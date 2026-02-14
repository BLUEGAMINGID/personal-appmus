// components/about/components/about/spotify/fetch.js

const LYRIC_OFFSET = 0; 

// --- 1. SMART CLEANER ---
// Membersihkan judul dari sampah track number, ekstensi, dan tanda kurung
const cleanString = (str) => {
    if (!str) return "";
    return str
        .replace(/^\d+[-.]?\s*/, "")       // Hapus angka depan "01 " atau "15."
        .replace(/\.(mp3|m4a|wav|flac)$/i, "") // Hapus ekstensi file
        .replace(/\s*\(.*?\)\s*/g, "")     // Hapus apapun dalam kurung (...) misal (Vocal Only)
        .replace(/\s*\[.*?\]\s*/g, "")     // Hapus apapun dalam kurung siku [...]
        .replace(/\s*\{.*?\}\s*/g, "")     // Hapus apapun dalam kurung kurawal {...}
        .replace(/["']/g, "")              // Hapus tanda petik yang bikin query error
        .trim();
};

// Normalizer untuk pencocokan Album (Hapus semua simbol biar gampang match)
const normalizeForMatch = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, ""); 
};

// --- HELPER FETCH ---
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 5000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        return null;
    }
};

// --- TTML PARSER ---
const parseTTMLTime = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    let seconds = 0;
    if (parts.length === 3) { 
        seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) { 
        seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else { 
        seconds = parseFloat(timeStr);
    }
    return seconds;
};

const parseTTML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const paragraphs = xmlDoc.getElementsByTagName("p");
    const lyrics = [];

    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const begin = parseTTMLTime(p.getAttribute("begin"));
        const end = parseTTMLTime(p.getAttribute("end"));
        const text = p.textContent.trim();
        if (text) {
            lyrics.push({
                time: begin + LYRIC_OFFSET,
                endTime: end + LYRIC_OFFSET,
                text: text,
                duration: end - begin 
            });
        }
    }
    return lyrics;
};

// --- MAIN FUNCTION ---
export default async function getLocalMetadata(item) {
    const { original, karaoke, ttml } = item;
    
    // Cek cache
    if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`hybrid_meta_v8_${original}`); // Versi 8
        if (cached) return JSON.parse(cached);
    }

    // Siapkan data bersih dulu dari input list.js
    // Ini PENTING: Kita bersihkan judul lokal untuk Fallback & Query
    const cleanLocalTitle = cleanString(item.title);
    const cleanLocalArtist = item.artist;
    const targetAlbum = item.album; 

    // Default Fallback Data (Sudah dibersihkan!)
    let finalData = {
        title: cleanLocalTitle, // Gunakan judul bersih
        artist: cleanLocalArtist,
        album: targetAlbum,
        cover: null, 
        microCover: null,
        lyrics: [],
        audioUrl: original,
        karaokeUrl: karaoke
    };

    try {
        // --- 2. CARI KE ITUNES ---
        // Query: Artist + Clean Title
        const query = `${cleanLocalArtist} ${cleanLocalTitle}`;
        const itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`);
        
        if (itunesRes && itunesRes.ok) {
            const data = await itunesRes.json();
            
            if (data.resultCount > 0) {
                let bestMatch = data.results[0]; // Default ambil yang pertama

                // --- 3. FUZZY ALBUM MATCHING ---
                // Jika kita punya target album, coba cari yang paling mirip
                if (targetAlbum) {
                    const normTarget = normalizeForMatch(targetAlbum); // misal: "doves25onblankcanvas"
                    
                    const betterMatch = data.results.find(track => {
                        const normCollection = normalizeForMatch(track.collectionName);
                        // Cek apakah salah satu string ada di dalam string lainnya
                        return normCollection.includes(normTarget) || normTarget.includes(normCollection);
                    });

                    if (betterMatch) {
                        bestMatch = betterMatch;
                    }
                }

                // Update data dari hasil terbaik iTunes
                finalData.title = bestMatch.trackName;
                finalData.artist = bestMatch.artistName;
                finalData.album = bestMatch.collectionName;
                
                // Image Logic (300px & 60px)
                const rawUrl = bestMatch.artworkUrl100;
                if (rawUrl) {
                    finalData.cover = rawUrl.replace("100x100", "300x300"); // Main (HD Cukup)
                    finalData.microCover = rawUrl.replace("100x100", "60x60"); // BG (Micro)
                }
            }
        }
    } catch (e) { 
        console.warn("iTunes fetch error, using local fallback");
        // Tidak apa-apa error, kita sudah punya 'finalData' dengan judul bersih di atas
    }

    // --- 4. FETCH LYRICS ---
    if (ttml) {
        try {
            const ttmlRes = await fetch(ttml);
            if (ttmlRes.ok) {
                const ttmlText = await ttmlRes.text();
                finalData.lyrics = parseTTML(ttmlText);
            }
        } catch (e) {}
    }

    // Simpan Cache
    if (typeof window !== "undefined") {
        try { localStorage.setItem(`hybrid_meta_v8_${original}`, JSON.stringify(finalData)); } catch(e) {}
    }
    
    return finalData;
}

export async function getSimpleMetadata(item) {
    return {
        title: cleanString(item.title), // Pastikan ini juga dibersihkan
        artist: item.artist,
        album: item.album,
        cover: null 
    };
}
