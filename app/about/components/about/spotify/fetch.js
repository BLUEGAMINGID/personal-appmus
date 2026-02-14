// components/about/components/about/spotify/fetch.js

// CONFIG
const LYRIC_OFFSET = 0; 

// Helper: Fetch dengan Timeout agar tidak hanging
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

// Parser Waktu TTML
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

// Parser XML TTML
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

// Fungsi pembersih string (Lower case, remove punctuation) untuk perbandingan akurat
const normalizeString = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, ""); // Hapus simbol, spasi, dll
};

// Fungsi membersihkan Judul dari list.js (jika ada angka track)
const cleanTitle = (rawTitle) => {
    // Menghapus angka di depan (misal: "15 aku berharap" -> "aku berharap")
    return rawTitle.replace(/^\d+\s+/, "").replace(/\(.*\)/, "").trim();
};

// --- MAIN FUNCTION ---
export default async function getLocalMetadata(item) {
    const { original, karaoke, ttml } = item;
    
    // Cache Key V7 (Update versi cache)
    if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`hybrid_meta_v7_${original}`);
        if (cached) return JSON.parse(cached);
    }

    try {
        // 1. Ambil data mentah dari list.js
        // Kita percaya data di list.js sudah benar, tapi kita bersihkan sedikit judulnya untuk search query
        let searchTitle = cleanTitle(item.title);
        let searchArtist = item.artist;
        let targetAlbum = item.album; // INI KUNCINYA: Kita simpan nama album yang dimau

        // Default Metadata (Fallback jika iTunes gagal)
        let finalTitle = item.title;
        let finalArtist = item.artist;
        let finalAlbum = item.album;
        let coverUrl = null;
        let microCoverUrl = null;

        try {
            // 2. Cari di iTunes
            const query = `${searchArtist} ${searchTitle}`;
            // Limit dinaikkan ke 5 agar kita bisa memilih yang albumnya cocok
            const itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`);
            
            if (itunesRes && itunesRes.ok) {
                const data = await itunesRes.json();
                
                if (data.resultCount > 0) {
                    let bestMatch = data.results[0]; // Default ambil yang pertama

                    // 3. LOGIKA FILTERING (Mencari Album yang Cocok)
                    if (targetAlbum) {
                        const normalizedTarget = normalizeString(targetAlbum);
                        
                        // Cari hasil yang nama albumnya mirip dengan list.js
                        const albumMatch = data.results.find(track => {
                            const normalizedCollection = normalizeString(track.collectionName);
                            return normalizedCollection.includes(normalizedTarget) || normalizedTarget.includes(normalizedCollection);
                        });

                        if (albumMatch) {
                            bestMatch = albumMatch; // HORE! Ketemu album yang spesifik
                        }
                    }

                    // 4. Set Data dari Hasil Terbaik
                    finalTitle = bestMatch.trackName;
                    finalArtist = bestMatch.artistName;
                    finalAlbum = bestMatch.collectionName;
                    
                    // Resolusi Cover
                    coverUrl = bestMatch.artworkUrl100.replace("100x100", "600x600"); // HD untuk Card
                    microCoverUrl = bestMatch.artworkUrl100.replace("100x100", "60x60"); // Low Res untuk Background Blur
                }
            }
        } catch (e) { 
            console.warn("iTunes fetch failed, using local list.js data");
        }

        // 5. Fetch Lyrics (TTML)
        let lyrics = [];
        if (ttml) {
            try {
                const ttmlRes = await fetch(ttml);
                if (ttmlRes.ok) {
                    const ttmlText = await ttmlRes.text();
                    lyrics = parseTTML(ttmlText);
                }
            } catch (e) {}
        }

        const finalData = {
            title: finalTitle,
            artist: finalArtist,
            album: finalAlbum, 
            cover: coverUrl, 
            microCover: microCoverUrl || coverUrl,
            lyrics: lyrics,
            audioUrl: original,
            karaokeUrl: karaoke
        };

        if (typeof window !== "undefined") {
            try { localStorage.setItem(`hybrid_meta_v7_${original}`, JSON.stringify(finalData)); } catch(e) {}
        }
        
        return finalData;

    } catch (e) {
        // Fallback Total: Pakai data list.js apa adanya
        return { 
            title: item.title, 
            artist: item.artist, 
            album: item.album,
            lyrics: [], 
            cover: null, 
            microCover: null,
            audioUrl: original, 
            karaokeUrl: karaoke 
        };
    }
}

export async function getSimpleMetadata(item) {
    return {
        title: item.title,
        artist: item.artist,
        album: item.album,
        cover: null 
    };
}
