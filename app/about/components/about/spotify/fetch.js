// components/about/components/about/spotify/fetch.js

// --- CONFIG ---
const LYRIC_OFFSET = 0; 

// --- 1. INTELLIGENT STRING CLEANER ---
// Membersihkan judul dari 'sampah' agar query ke iTunes akurat
const cleanQuery = (str) => {
    if (!str) return "";
    return str
        // Hapus angka track di depan (misal: "1-01 ", "01 ", "15.")
        .replace(/^[\d\s\-\.]+\s+/, "")
        // Hapus ekstensi file jika terbawa
        .replace(/\.(mp3|m4a|wav|flac)$/i, "")
        // Hapus konten dalam kurung siku [...] (Biasanya info tambahan yang ganggu search)
        .replace(/\s*\[.*?\]\s*/g, "")
        // Hapus tanda baca berat
        .replace(/["']/g, "")
        .trim();
};

// Normalizer untuk pencocokan Album (Hapus spasi & simbol agar "Doves, '25" match dengan "Doves 25")
const normalizeForMatch = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, ""); 
};

// --- HELPER FETCH ---
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 6000 } = options; // Timeout agak panjang buat iTunes
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
    
    // Gunakan versi cache baru (V9) agar data lama ter-refresh
    if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`hybrid_meta_v9_${original}`);
        if (cached) return JSON.parse(cached);
    }

    // Siapkan data bersih untuk query
    // Contoh: "1-01 Malaikat..." -> "Malaikat..."
    const cleanTitle = cleanQuery(item.title);
    const cleanArtist = item.artist;
    const targetAlbum = item.album; 

    // Default Fallback Data (Penting agar UI tidak blank jika internet mati)
    let finalData = {
        // Kita gunakan cleanTitle untuk tampilan UI agar rapi (tanpa 1-01)
        title: cleanTitle, 
        artist: cleanArtist,
        album: targetAlbum,
        cover: null, 
        microCover: null,
        lyrics: [],
        audioUrl: original,
        karaokeUrl: karaoke
    };

    try {
        // --- 2. CARI KE ITUNES ---
        const query = `${cleanArtist} ${cleanTitle}`;
        // Limit 10 untuk memperbesar peluang ketemu album yang tepat
        const itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`);
        
        if (itunesRes && itunesRes.ok) {
            const data = await itunesRes.json();
            
            if (data.resultCount > 0) {
                let bestMatch = data.results[0]; // Default ambil yang pertama

                // --- 3. STRICT ALBUM MATCHING ---
                // Ini logika "Mahal"-nya. Kita cari yang albumnya benar-benar sama.
                if (targetAlbum) {
                    const normTarget = normalizeForMatch(targetAlbum); 
                    
                    const albumMatch = data.results.find(track => {
                        const normCollection = normalizeForMatch(track.collectionName);
                        // Cek kemiripan string album
                        return normCollection.includes(normTarget) || normTarget.includes(normCollection);
                    });

                    if (albumMatch) {
                        bestMatch = albumMatch; // HORE! Ketemu album yang spesifik
                    }
                }

                // Update data dari hasil terbaik iTunes
                finalData.title = bestMatch.trackName;
                finalData.artist = bestMatch.artistName;
                finalData.album = bestMatch.collectionName;
                
                // Image Logic (300px untuk Header, 60px untuk Background)
                const rawUrl = bestMatch.artworkUrl100;
                if (rawUrl) {
                    finalData.cover = rawUrl.replace("100x100", "300x300"); 
                    finalData.microCover = rawUrl.replace("100x100", "300x300"); 
                }
            }
        }
    } catch (e) { 
        console.warn("Metadata fetch error, using fallback");
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
        try { localStorage.setItem(`hybrid_meta_v9_${original}`, JSON.stringify(finalData)); } catch(e) {}
    }
    
    return finalData;
}

export async function getSimpleMetadata(item) {
    // Fungsi simple ini juga kita bersihkan judulnya
    return {
        title: cleanQuery(item.title), 
        artist: item.artist,
        album: item.album,
        cover: null 
    };
}
