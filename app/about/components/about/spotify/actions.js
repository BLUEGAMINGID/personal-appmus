// components/about/components/about/spotify/actions.js
"use server";

export async function findKaraokeVideo(originalQuery) {
    // Kumpulan server mirror untuk antisipasi down
    const MIRRORS = [
        "https://pipedapi.kavin.rocks",
        "https://api.piped.ot.ax",
        "https://pipedapi.drgns.space",
        "https://pa.il.ax",
        "https://api.piped.mha.fi"
    ];

    // Query yang sangat spesifik
    const query = `${originalQuery} Karaoke Instrumental`;

    for (const host of MIRRORS) {
        try {
            const res = await fetch(`${host}/search?q=${encodeURIComponent(query)}&filter=music_videos`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.93 Safari/537.36'
                }
            });

            if (!res.ok) continue;

            const data = await res.json();
            
            if (data.items && data.items.length > 0) {
                // Return URL lengkap
                return `https://www.youtube.com${data.items[0].url}`;
            }
        } catch (error) {
            console.error(`Mirror ${host} failed.`);
        }
    }
    return null;
}
