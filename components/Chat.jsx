"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faCommentDots, faPaperPlane, faTimes, faRobot, faCircle, faExclamationTriangle, faExternalLinkAlt, faBriefcase, faUser, faChevronDown 
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin, faLetterboxd, faTiktok } from "@fortawesome/free-brands-svg-icons";

// ============================================
// 1. DEFINISI AKSI & SOSIAL
// ============================================
const ACTIONS = {
    SOCIAL_MEDIA: [
        { label: "GitHub", url: "https://github.com/BLUEGAMINGID", icon: faGithub, color: "#24292e" },
        { label: "LinkedIn", url: "https://www.linkedin.com/in/danish-fa-132aba2a3?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", icon: faLinkedin, color: "#0077b5" },
        { label: "Instagram", url: "https://www.instagram.com/dansz.f.a/", icon: faInstagram, color: "#E1306C" },
        { label: "TikTok", url: "https://www.tiktok.com/@danzxdnz?_r=1&_t=ZS-93R6SObIkEq", icon: faTiktok, color: "#ff0050" },
        { label: "Letterboxd", url: "https://boxd.it/7q3oV", icon: faLetterboxd, color: "#00e054" }
    ],
    NAVIGATE_ABOUT: { label: "Tentang Saya", hash: "about", icon: faUser },
};

// ============================================
// 2. SYSTEM PROMPT (OTAK BOT — MUSIC PLAYER FOCUSED)
// ============================================
const SYSTEM_PROMPT = `
Kamu adalah "DanZ-Kev Bot", asisten musik pribadi di DanZ Music Player.
Gunakan Bahasa Indonesia yang santai, sopan, dan terstruktur.

ATURAN FORMATTING (WAJIB):
- Gunakan baris baru (Enter) agar teks tidak menumpuk.
- Gunakan simbol "•" untuk membuat daftar/list.
- JANGAN berikan paragraf yang lebih dari 3 baris. Pecah menjadi poin-poin.
- Boleh gunakan emoji 🎵🎤🎧 secukupnya.

STYLE:
- Bahasa: Indonesia santai, seperti teman yang nyaranin lagu.
- Karakter: Musikal, antusias, dan knowledgeable. Kamu paham musik indie Indonesia dengan baik.

===== DATA MUSIK PLAYER =====

ARTIS & KOLEKSI LENGKAP:

1. HINDIA (Baskara Putra)
   Artis indie Indonesia paling dominan di koleksi ini. Dikenal karena lirik yang puitis dan emosional.
   Album:
   • "Menari Dengan Bayangan" (15 lagu): Evakuasi, Wejangan Mama, Besok Mungkin Kita Sampai, Jam Makan Siang (feat. Matter Mos), Dehidrasi (feat. Petra Sihombing), Untuk Apa / Untuk Apa?, Voice Note Anggra, Secukupnya, Belum Tidur (feat. Sal Priadi), Apapun Yang Terjadi, Membasuh (feat. Rara Sekar), Rumah Ke Rumah, Mata Air (feat. Natasha Udu & Kamga), Wejangan Caca, Evaluasi
   • "Lagipula Hidup Akan Berakhir" (Disc 1 & 2, 28 lagu): Malaikat Berputar di Atas Pencakar Langit, Janji Palsu, Matahari Tenggelam, Satu Hari Lagi, WAWANCARA LIAR Pt. I-IV, Ibel, Selebrisik, Cincin, Kami Khawatir Kawan, Apa Kabar Ayah?, Bunuh Idolamu, I'm Not A Robot / CAPTCHA, Forgot Password (feat. Nadin Amizah), Perkara Tubuh, Pesisir, Masalah Masa Depan, Alexandra, Jangan Jadi Pahlawan (feat. Teddy Adhitya), Bayangkan, Bayangkan Jika Kita Tidak Menyerah, Kita Ke Sana, Berdansalah Karir Ini Tak Ada Artinya, Nabi Palsu, dan lainnya.
   • "Doves, '25 on Blank Canvas" (16 lagu): perseverance (in the face of grief), hated in the Nation, everything u are, kids, (mimi), betty (feat. White Chorus), a feeling, semua lagu cinta terdengar sama, the world is ending all over again, letdown, (kamis), anak itu belum pulang, harga satu pil, YAAYO, aku berharap ini tak terjadi kepadamu, loved by You
   Rekomendasi Hindia: "Secukupnya", "Evaluasi", "Belum Tidur", "Cincin", "everything u are"

2. REALITY CLUB
   Band indie rock Jakarta. Musik mereka gabungan indie rock, pop, dan post-punk.
   Album:
   • "Never Get Better" (13 lagu): Elastic Hearts, Things I Don't Know, Shouldn't End This Way, Cursive Curses, Fatal Attraction, Hesitation, Okay, Mentors, A Graceful Retreat, For Lack Of A Better Word, Is It The Answer?, Never Get Better, Epilogue
   • "Reality Club Presents…" (10 lagu): I Wish I Was Your Joke (feat. Bilal Indrajaya), You Let Her Go Again, Dancing In The Breeze Alone, Tell Me I'm Wrong, Desire, Arrowhead Man, Am I Bothering You?, Anything You Want, Four Summers, Love Epiphany
   • "What Do You Really Know?" (11 lagu): Prologue, SSR, All Along All Things Were Wrong, Caught in a Trap, The Rush, Vita o morte, Telenovia, On My Own Again, Alexandra, A Sorrowful Reunion, 2112
   • "Who Knows Where Life Will Take You?" (13 lagu): I'll Do It Myself, Lost Myself in Reveries, Enough for You, Does It Happen?, Shut Up Behave, Finding a Catholic Man, Muted Sirens, Close to You/Jauh, Quick! Love!, Now I'm a Diplomat, Thank You for Hijacking My Existential Crisis, You'll Find Lovers Like You and Me, Mama's Coming Home
   Rekomendasi RC: "Is It The Answer", "Alexandra", "Love Epiphany", "A Sorrowful Reunion"

3. SAL PRIADI
   Singer-songwriter Indonesia. Musiknya lo-fi, dreamy, dan romantis.
   Album:
   • "Amin Paling Serius" (Single)
   • "MARKERS AND SUCH PENS FLASHDISKS" (15 lagu): Kita usahakan rumah itu, Mesra-mesraannya kecil-kecilan dulu, Lewat sudah pukul dua makin banyak bicara kita, Dari planet lain, Yasudah, Episode, Foto kita blur, Semua lagu cinta, Di mana alamatmu sekarang, Ada titik-titik di ujung doa, Biar jadi urusanku, Zuzuzaza, Hi selamat pagiii, Gala bunga matahari, I'd like to watch you sleeping
   Rekomendasi: "Amin Paling Serius", "Dari planet lain", "Foto kita blur"

4. ARDHITO PRAMONO
   Musisi jazz-pop Indonesia. Versatile, suaranya khas dan warm.
   • "Bitterlove" (Single)
   • "Waking Up Together With You" (Single)
   • "I Just Couldn't Save You Tonight" (feat. Aurelie Moeremans) — OST Story of Kale
   • "a letter to my 17 year old" EP: Say Hello, Bitterlove, Fake Optics, Superstar, Cigarettes of Ours
   Rekomendasi: "Bitterlove", "Cigarettes of Ours"

5. BARASUARA — "Terbuang Dalam Waktu" (Single). Band indie rock Indonesia.
6. DANIEL CAESAR — "Who Knows" dari album "Son Of Spergy". R&B/soul artist internasional.
7. AKU JEJE — "Lihat Kebunku (Taman Bunga)" (Single). Artis pop Indonesia.
8. NAYKILLA — "Kasih Aba Aba" & "SO ASU" (Singles). Artis pop Indonesia.
9. .FEAST — "Membangun & Menghancurkan" album, "Nina" single. Band post-punk/indie Indonesia.

===== FITUR PLAYER =====
• 🎤 MODE KARAOKE: Semua lagu punya versi "No Vocal". User bisa geser slider karaoke untuk mengurangi/menghilangkan vokal asli.
• 📜 LIRIK SINKRON: Semua lagu punya lirik time-synced (TTML). Lirik highlight otomatis mengikuti lagu yang sedang diputar.
• ✍️ SONGWRITER CREDITS: Kredit penulis lagu ditampilkan di bawah judul lagu (diambil dari file TTML).
• 🔀 SHUFFLE: Lagu diputar secara acak otomatis.
• 📋 PLAYLIST: Bisa lihat semua lagu, dikelompokkan per album.
• 🎨 UI: Terinspirasi Apple Music — album art besar, glow effect, animasi smooth.

===== ATURAN OUTPUT (PENTING) =====
1. Jika user tanya "Sosmed", "Kontak", "Instagram", "GitHub", atau "LinkedIn" dari Danish:
   HANYA jawab dengan JSON: {"action": "SOCIAL_MEDIA"}

2. Jika user tanya "Siapa Danish", "Tentang kamu", "About", atau "Latar belakang" Danish:
   HANYA jawab dengan JSON: {"action": "NAVIGATE_ABOUT"}

3. Untuk pertanyaan tentang MUSIK (lagu, artis, album, rekomendasi, fitur player):
   Jawab dengan teks biasa berdasarkan data di atas. Jadilah antusias dan rekomendasikan lagu!

4. Jika user minta rekomendasi lagu berdasarkan MOOD:
   • Galau/sedih → Hindia ("Secukupnya", "Evaluasi", "Cincin"), Sal Priadi ("Dari planet lain")
   • Semangat/energi → Reality Club ("Is It The Answer", "SSR"), Barasuara ("Terbuang Dalam Waktu")
   • Romantis → Sal Priadi ("Amin Paling Serius", "Kita usahakan rumah itu"), Ardhito ("Bitterlove")
   • Chill/santai → Ardhito ("Cigarettes of Ours"), Hindia ("Belum Tidur"), Daniel Caesar ("Who Knows")
   • Marah/bold → Reality Club ("Shut Up, Behave"), Naykilla ("SO ASU"), .Feast

5. Jika user tanya cara pakai fitur (karaoke, lirik, dll): Jelaskan berdasarkan data FITUR PLAYER.

6. Catatan: Player ini adalah koleksi musik pribadi Danish. Semua lagu sudah lengkap dengan lirik dan mode karaoke.
`;


const Chat = ({ isOpen, onClose }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Halo! 🎵 Mau dengerin apa nih? Tanya aku soal lagu, artis, atau minta rekomendasi berdasarkan mood kamu!" }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);



  const handleNavigation = (hash) => {
      setIsOpen(false);
      window.location.hash = hash;
  };

  // -- RENDER MESSAGE CONTENT --
  const renderMessageContent = (content) => {
      try {
          const parsedContent = JSON.parse(content);
          if (parsedContent.action && ACTIONS[parsedContent.action]) {
              const actionData = ACTIONS[parsedContent.action];

              // SOCIAL MEDIA LINKS
              if (Array.isArray(actionData)) {
                  return (
                      <div className="flex flex-col gap-2.5 mt-1">
                          <p className="text-xs text-white/50 font-medium mb-0.5">Sosial media Danish:</p>
                          <div className="flex flex-wrap gap-1.5">
                              {actionData.map((social, idx) => (
                                  <a 
                                    key={idx} 
                                    href={social.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 bg-white/10 text-white/80 px-3 py-2 rounded-lg transition-all duration-200 text-[11px] font-semibold hover:bg-white/20 hover:text-white border border-white/5"
                                  >
                                      <FontAwesomeIcon icon={social.icon} className="text-xs"/>
                                      <span>{social.label}</span>
                                  </a>
                              ))}
                          </div>
                      </div>
                  );
              }

              // NAVIGATION BUTTON
              if (actionData.hash) {
                  return (
                      <div className="flex flex-col gap-2 mt-1">
                           <p className="text-xs text-white/50 font-medium">Klik untuk menuju halaman:</p>
                           <button
                               onClick={() => handleNavigation(actionData.hash)}
                               className="flex items-center justify-center gap-2 bg-white/15 text-white hover:bg-white/25 px-4 py-2.5 rounded-xl transition-all active:scale-95 text-xs font-bold w-full border border-white/10"
                           >
                               <FontAwesomeIcon icon={actionData.icon || faExternalLinkAlt} className="text-xs" />
                               {actionData.label}
                           </button>
                      </div>
                  );
              }
          }
          return content;
      } catch (e) {
          if (content.includes("Error:")) {
               return (
                   <span className="text-red-400 font-medium flex items-center gap-2 text-xs">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        {content}
                   </span>
               );
          }
          return content;
      }
  };


  // -- API CALL --
    const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            userMessage
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal konek ke AI");

      if (data.choices && data.choices[0]) {
        const botReply = data.choices[0].message.content;
        setMessages((prev) => [...prev, { role: "assistant", content: botReply }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Maaf: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };


  // Controlled component props
  if (isOpen === undefined) isOpen = false; 

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%", scale: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: "100%", scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[10000] bg-[#0a0a0a] flex flex-col sm:absolute sm:inset-auto sm:bottom-[70px] sm:right-0 sm:w-[380px] sm:h-[580px] sm:rounded-3xl sm:shadow-[0_25px_80px_rgba(0,0,0,0.6)] sm:border sm:border-white/10 overflow-hidden font-sans antialiased"
        >
          {/* HEADER - Apple Music Style */}
          <div className="relative bg-[#1c1c1e]/80 backdrop-blur-2xl px-5 py-4 flex justify-between items-center shrink-0 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                  <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                      <FontAwesomeIcon icon={faRobot} className="text-white/80 text-sm"/>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1c1c1e]"></div>
              </div>
              <div>
                  <h3 className="font-bold text-white text-sm leading-tight">DanZ-Kev</h3>
                  <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCircle} className="text-[5px] text-green-400" />
                      <span className="text-[10px] text-white/40 font-medium">Online</span>
                  </div>
              </div>
            </div>
            
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90">
              <FontAwesomeIcon icon={faChevronDown} className="text-white/60 text-xs"/>
            </button>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
            {messages.map((msg, idx) => (
              <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start items-end"}`}
              >
                {msg.role !== "user" && (
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center mr-2 shrink-0 mb-0.5 border border-white/5">
                          <FontAwesomeIcon icon={faRobot} className="text-white/50 text-[9px]" />
                      </div>
                )}
                <div 
                  className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap
                  ${msg.role === "user" 
                      ? "bg-[#0a84ff] text-white rounded-2xl rounded-br-md" 
                      : "bg-[#1c1c1e] text-white/90 border border-white/5 rounded-2xl rounded-bl-md"}`}
                >
                  {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start items-end gap-2">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center border border-white/5">
                          <FontAwesomeIcon icon={faRobot} className="text-white/50 text-[9px]" />
                    </div>
                  <div className="bg-[#1c1c1e] px-4 py-3 rounded-2xl rounded-bl-md border border-white/5">
                      <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
                      </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* INPUT AREA - Apple Music Style */}
          <form onSubmit={handleSend} className="px-4 py-3 bg-[#1c1c1e]/60 backdrop-blur-xl border-t border-white/5 flex gap-2.5 shrink-0 pb-safe sm:pb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 bg-white/10 text-white text-xs px-4 py-3 rounded-full focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/15 transition-all border border-white/5 placeholder:text-white/25 font-medium"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-[#0a84ff] text-white rounded-full flex items-center justify-center hover:bg-[#0b7aed] active:scale-90 disabled:opacity-30 disabled:scale-100 transition-all shrink-0"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Chat;