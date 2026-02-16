// components/music-player/fetch.js

// --- CONFIG ---
const LYRIC_OFFSET = 0;

// --- 1. INTELLIGENT CLEANER (Pembersih Judul Super Agresif) ---
// Tujuannya membuat query sesimpel mungkin agar iTunes PASTI menemukan hasil.
const cleanQuery = (str) => {
  if (!str) return "";
  return (
    str
      // Hapus angka track di depan (misal: "1-01 ", "01 ", "15.", "1-10")
      .replace(/^[\d\-\.]+\s+/, "")
      // Hapus konten dalam kurung siku [...] (Biasanya info OST/Album tambahan)
      .replace(/\[.*?\]/g, "")
      // Hapus konten dalam kurung biasa (...) TAPI sisakan jika judulnya pendek
      // Strategi: Hapus (feat...), (Bonus...), (Vocal Only) tapi hati-hati dengan judul asli yg pakai kurung
      .replace(/\(feat.*?\)/iy, "")
      .replace(/\(with.*?\)/iy, "")
      .replace(/\(Original.*?\)/iy, "")
      // Hapus ekstensi file
      .replace(/\.(mp3|m4a|wav|flac)$/i, "")
      // Hapus tanda baca berat yang membingungkan search engine
      .replace(/["']/g, "")
      // Hapus spasi berlebih
      .trim()
  );
};

// Normalizer untuk membandingkan Nama Album (Hapus spasi & simbol)
// Contoh: "Doves, '25" menjadi "doves25" agar cocok dengan "Doves 2025" atau variasi lain
const normalizeForMatch = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// --- HELPER FETCH ---
const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 8000 } = options; // Timeout 8 detik (koneksi lambat)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
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
  const parts = timeStr.split(":");
  let seconds = 0;
  if (parts.length === 3) {
    seconds =
      parseInt(parts[0]) * 3600 +
      parseInt(parts[1]) * 60 +
      parseFloat(parts[2]);
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
        duration: end - begin,
      });
    }
  }

  // Extract songwriters from iTunesMetadata
  const songwriters = [];
  const swElements = xmlDoc.getElementsByTagName("songwriter");
  for (let i = 0; i < swElements.length; i++) {
    const name = swElements[i].textContent.trim();
    if (name) songwriters.push(name);
  }

  return { lyrics, songwriters };
};

// --- MAIN FUNCTION ---
export default async function getLocalMetadata(item) {
  const { original, karaoke, ttml } = item;

  // GANTI KEY CACHE: Kita pakai 'v10' agar semua cache lama yang kosong/salah terhapus
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(`hybrid_meta_v12_${original}`);
    if (cached) return JSON.parse(cached);
  }

  // 1. SIAPKAN DATA BERSIH
  const cleanTitle = cleanQuery(item.title);
  const cleanArtist = item.artist;
  const targetAlbum = item.album;

  // Data Default (Fallback jika internet mati)
  // Kita gunakan cleanTitle agar tampilan di Player rapi (tidak ada "1-01")
  let finalData = {
    title: cleanTitle,
    artist: cleanArtist,
    album: targetAlbum,
    cover: null,
    microCover: null,
    lyrics: [],
    songwriters: [],
    audioUrl: original,
    karaokeUrl: karaoke,
  };

  try {
    // 2. QUERY KE ITUNES
    // Kita cari dengan judul yang SUDAH DIBERSIHKAN
    const query = `${cleanArtist} ${cleanTitle}`;
    const itunesRes = await fetchWithTimeout(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`,
    );

    if (itunesRes && itunesRes.ok) {
      const data = await itunesRes.json();

      if (data.resultCount > 0) {
        // Default: Ambil hasil pertama (paling relevan menurut iTunes)
        let bestMatch = data.results[0];

        // 3. LOGIKA FILTER ALBUM (Smart Matching)
        // Kita cari hasil yang nama albumnya COCOK dengan list.js
        if (targetAlbum) {
          const normTarget = normalizeForMatch(targetAlbum);

          const albumMatch = data.results.find((track) => {
            const normCollection = normalizeForMatch(track.collectionName);
            // Cek apakah string album ada kemiripan (substring match)
            return (
              normCollection.includes(normTarget) ||
              normTarget.includes(normCollection)
            );
          });

          if (albumMatch) {
            bestMatch = albumMatch; // HORE! Ketemu album spesifik
          }
        }

        // 4. UPDATE DATA DARI HASIL TERBAIK
        finalData.title = bestMatch.trackName;
        finalData.artist = bestMatch.artistName;
        finalData.album = bestMatch.collectionName;

        // Ambil Gambar (HD & Micro)
        const rawUrl = bestMatch.artworkUrl100;
        if (rawUrl) {
          finalData.cover = rawUrl.replace("100x100", "600x600"); // HD untuk desktop/large art
          finalData.microCover = rawUrl.replace("100x100", "100x100"); // Compact/mobile
        }
      } else {
        console.warn(`No results for: ${query}`);
      }
    }
  } catch (e) {
    console.warn("Metadata fetch error, using fallback data");
  }

  // 5. FETCH LYRICS
  if (ttml) {
    try {
      const ttmlRes = await fetch(ttml);
      if (ttmlRes.ok) {
        const ttmlText = await ttmlRes.text();
        const parsed = parseTTML(ttmlText);
        finalData.lyrics = parsed.lyrics;
        finalData.songwriters = parsed.songwriters;
      }
    } catch (e) {}
  }

  // SIMPAN CACHE
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `hybrid_meta_v12_${original}`,
        JSON.stringify(finalData),
      );
    } catch (e) {}
  }

  return finalData;
}

export async function getSimpleMetadata(item) {
  return {
    title: cleanQuery(item.title),
    artist: item.artist,
    album: item.album,
    cover: null,
  };
}

export const fetchAudioBlob = async (url) => {
  try {
    // Direct fetch (bypass Vercel API limits & IDM)
    // IDM doesn't intercept fetch() calls that return Blobs
    const response = await fetch(url);
    if (!response.ok) throw new Error("Fetch failed");

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching audio blob:", error);
    return url; // Fallback to direct URL if fetch fails
  }
};
