// components/about/components/about/spotify/fetch.js

// --- CONFIG ---
const LYRIC_OFFSET = 0; // KEMBALIKAN KE 0 AGAR AUDIO TIDAK RUSAK

// Helper: Fetch dengan Timeout
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 4000 } = options;
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

// --- FUNGSI MEMBERSIHKAN JUDUL ---
const cleanTitle = (rawTitle) => {
    return rawTitle.replace(/^(\d+[-.]\d+|\d+)\s+/, "").trim();
};

// --- FUNGSI UTAMA ---
export default async function getLocalMetadata(item) {
    const { original, karaoke, ttml } = item;
    
    if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`hybrid_meta_v3_${original}`);
        if (cached) return JSON.parse(cached);
    }

    try {
        let finalTitle = cleanTitle(item.title);
        let finalArtist = item.artist;
        let finalAlbum = item.album;
        let coverUrl = null;

        try {
            const query = `${finalArtist} ${finalTitle}`;
            const itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`);
            
            if (itunesRes && itunesRes.ok) {
                const data = await itunesRes.json();
                if (data.resultCount > 0) {
                    const track = data.results[0];
                    finalTitle = track.trackName;
                    finalArtist = track.artistName;
                    finalAlbum = track.collectionName;
                    coverUrl = track.artworkUrl100.replace("100x100", "600x600");
                }
            }
        } catch (e) { 
            console.warn("iTunes fetch failed, using local fallback");
        }

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
            lyrics: lyrics,
            audioUrl: original,
            karaokeUrl: karaoke
        };

        if (typeof window !== "undefined") {
            try { localStorage.setItem(`hybrid_meta_v3_${original}`, JSON.stringify(finalData)); } catch(e) {}
        }
        
        return finalData;

    } catch (e) {
        return { title: cleanTitle(item.title), artist: item.artist, lyrics: [], cover: null, audioUrl: original, karaokeUrl: karaoke };
    }
}

export async function getSimpleMetadata(item) {
    return {
        title: cleanTitle(item.title),
        artist: item.artist,
        album: item.album,
        cover: null 
    };
}
