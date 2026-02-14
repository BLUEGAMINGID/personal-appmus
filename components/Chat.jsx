"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faCommentDots, faPaperPlane, faTimes, faRobot, faCircle, faExclamationTriangle, faExternalLinkAlt, faBriefcase, faUser 
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin, faLetterboxd, faTiktok } from "@fortawesome/free-brands-svg-icons";

// ============================================
// 1. DEFINISI AKSI & SOSIAL
// ============================================
// GANTI LINK INI DENGAN LINK ASLI ANDA
const ACTIONS = {
    SOCIAL_MEDIA: [
        { label: "GitHub", url: "https://github.com/BLUEGAMINGID", icon: faGithub, color: "hover:bg-[#24292e] hover:text-white" },
        { label: "LinkedIn", url: "https://www.linkedin.com/in/danish-fa-132aba2a3?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", icon: faLinkedin, color: "hover:bg-[#0077b5] hover:text-white" },
        { label: "Instagram", url: "https://www.instagram.com/dansz.f.a/", icon: faInstagram, color: "hover:bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 hover:text-white" },
        { label: "TikTok", url: "https://www.tiktok.com/@danzxdnz?_r=1&_t=ZS-93R6SObIkEq", icon: faTiktok, color: "hover:bg-[#24292e] hover:text-white" },
        { label: "Letterboxd", url: "https://boxd.it/7q3oV", icon: faLetterboxd, color: "hover:bg-[#0077b5] hover:text-white" }
    ],
    NAVIGATE_ABOUT: { label: "Tentang Saya", hash: "about", icon: faUser },
};

// ============================================
// 2. SYSTEM PROMPT (OTAK BOT)
// ============================================
const SYSTEM_PROMPT = `
Kamu adalah "DanZ-Kev Bot", asisten pribadi Danish (DanZ).
Gunakan Bahasa Indonesia yang santai, sopan, dan terstruktur.

ATURAN FORMATTING (WAJIB):
- Gunakan baris baru (Enter) agar teks tidak menumpuk.
- Gunakan simbol "•" untuk membuat daftar/list.
- JANGAN berikan paragraf yang lebih dari 3 baris. Pecah menjadi poin-poin.

STYLE: 
- Bahasa: Indonesia santai (seperti teman), gunakan istilah "Danish" atau "dia" untuk merujuk ke pemilik.
- Karakter: Informatif, to-the-point, dan sedikit tech-savvy.

KONTEN DATA DANISH:

1. PROFIL UMUM:
- Nama: Danish (sering dikenal sebagai DanZ).
- Role: Frontend Developer (Spesialis React & Next.js).
- Domisili: Jakarta, Indonesia.
- Karakter: Menyukai gabungan antara teknologi sistem digital dan ekspresi visual/media kreatif.

2. RIWAYAT PENDIDIKAN (Education):
- Sekolah: MAN 5 Jakarta (2023 - Sekarang).
- Fokus: Aktif di dunia IT meski masih sekolah.
- Minat Akademik: Sangat tertarik pada bidang Film dan Televisi untuk jenjang kuliah nanti. Dia suka visual storytelling dan alur produksi media.

3. PENGALAMAN (Experience):
- Head Server & Map Developer di WH-Server (Des 2024 - Sekarang): Mengelola server Minecraft Bedrock, optimasi performa, scripting JavaScript/JSON, dan map development. Mahir dalam Prompt Engineering di sini.
- Lua Encryptor Developer (Feb 2021 - Okt 2022): Membuat script enkripsi/obfuscation berbasis Lua untuk mengamankan source code komunitas.
- Skill Lain: Mentoring, Selling, dan Graphical Texture.

4. MINAT & HOBI KHUSUS:
- Minecraft: Mengelola komunitas di "wonghoa.my.id". Dia menangani manajemen server hingga support komunitas.
- Web Dev: Hobi membangun tools, dashboard, dan interface web untuk operasional server.
- Media: Terobsesi dengan bagaimana teknologi mendukung proses kreatif di industri film/media.

ATURAN OUTPUT (PENTING):
1. Jika user tanya "Sosmed", "Kontak", "Instagram", "GitHub", atau "LinkedIn": 
   HANYA jawab dengan JSON: {"action": "SOCIAL_MEDIA"}
2. Jika user tanya "Project", "Karya", "Bikin apa aja", atau "Portfolio": 
   HANYA jawab dengan JSON: {"action": "NAVIGATE_PROJECTS"}
3. Jika user tanya "Siapa Danish", "Tentang kamu", "About", atau "Latar belakang": 
   HANYA jawab dengan JSON: {"action": "NAVIGATE_ABOUT"}
4. Untuk pertanyaan detail (Contoh: "Danish sekolah di mana?", "Skillnya apa?", "Pernah kerja apa?"): 
   Jawab dengan teks biasa yang merujuk pada data di atas.
`;


const Chat = () => {
  // -- STATE --
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Halo! Saya DanZ-Kev Bot. Ada yang bisa saya bantu?" }
  ]);

  const messagesEndRef = useRef(null);
  const hasShownPreview = useRef(false);

  // Munculkan Preview Bubble setelah 2 detik
  useEffect(() => {
    if (!hasShownPreview.current) {
        const timer = setTimeout(() => {
            setShowPreview(true);
            hasShownPreview.current = true;
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, []);

  // Auto Scroll ke pesan terakhir
  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Fungsi untuk menangani navigasi internal
  const handleNavigation = (hash) => {
      setIsOpen(false); // Tutup chat
      // Menggunakan window.location.hash standar agar kompatibel dengan Lenis atau scroll browser biasa
      window.location.hash = hash;
  };

  // -- FUNGSI RENDER KONTEN PESAN (Mendeteksi JSON Aksi) --
  const renderMessageContent = (content) => {
      try {
          // Coba parsing konten sebagai JSON
          const parsedContent = JSON.parse(content);

          // Cek apakah JSON memiliki properti 'action' yang valid
          if (parsedContent.action && ACTIONS[parsedContent.action]) {
              const actionData = ACTIONS[parsedContent.action];

              // RENDER 1: DAFTAR SOSIAL MEDIA (Array)
              if (Array.isArray(actionData)) {
                  return (
                      <div className="flex flex-col gap-3 mt-1">
                          <p className="text-sm mb-1 font-medium">Berikut sosial media saya:</p>
                          <div className="flex flex-wrap gap-2">
                              {actionData.map((social, idx) => (
                                  <a 
                                    key={idx} 
                                    href={social.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl transition-all duration-300 text-xs font-bold group ${social.color}`}
                                  >
                                      <FontAwesomeIcon icon={social.icon} className="text-base group-hover:scale-110 transition-transform"/>
                                      <span>{social.label}</span>
                                  </a>
                              ))}
                          </div>
                      </div>
                  );
              }

              // RENDER 2: TOMBOL NAVIGASI INTERNAL (Object hash)
              if (actionData.hash) {
                  return (
                      <div className="flex flex-col gap-3 mt-1">
                           <p className="text-sm mb-1 font-medium">Klik tombol di bawah untuk menuju halaman tersebut:</p>
                           <button
                               onClick={() => handleNavigation(actionData.hash)}
                               className="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 px-5 py-3 rounded-xl transition-all active:scale-95 text-sm font-bold w-full"
                           >
                               <FontAwesomeIcon icon={actionData.icon || faExternalLinkAlt} />
                               {actionData.label}
                           </button>
                      </div>
                  );
              }
          }
          // Jika JSON valid tapi bukan action yang dikenal, anggap teks biasa (fallback)
          return content;
      } catch (e) {
          // Jika bukan JSON, render sebagai teks biasa
          if (content.includes("Error:")) {
               return (
                   <span className="text-red-600 font-medium flex items-center gap-2">
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
      // PERUBAHAN: Tembak endpoint lokal /api/chat
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


  return (
    <div className="fixed bottom-0 right-0 z-[9999] flex flex-col items-end font-jost pointer-events-none p-4 sm:p-6">
      
      {/* 1. PREVIEW BUBBLE (Floating Text) */}
      {/* 1. PREVIEW BUBBLE (Floating Text) */}
<AnimatePresence>
  {showPreview && !isOpen && (
      <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          onClick={() => setIsOpen(true)}
          // PERUBAHAN: Padding vertikal dikurangi (py-2.5), Lebar dibuat w-max (mengikuti teks), Max-width diperbesar
          className="pointer-events-auto absolute bottom-5 right-[85px] sm:bottom-7 sm:right-[90px] bg-white shadow-[0_10px_40px_rgb(0,0,0,0.15)] rounded-full rounded-tr-none py-2.5 px-5 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 border border-gray-100 w-max max-w-[260px] sm:max-w-md transition-all duration-300"
      >
          {/* Ikon diperkecil sedikit agar lebih proporsional dengan bentuk lonjong */}
          <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center shrink-0 shadow-md text-white">
               <FontAwesomeIcon icon={faRobot} className="text-sm" />
          </div>
          
          <div className="flex flex-col overflow-hidden">
              {/* Ukuran teks disesuaikan agar tetap compact */}
              <span className="text-sm font-bold text-gray-900 leading-tight">DanZ-Kev Bot</span>
              <span className="text-[11px] text-gray-500 leading-tight mt-0.5 whitespace-nowrap">Tanya saya tentang portofolio!</span>
          </div>

          {/* Notif Dot */}
          <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
          </div>
      </motion.div>
  )}
</AnimatePresence>


      {/* 2. CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto fixed inset-0 z-[10000] bg-white flex flex-col sm:absolute sm:inset-auto sm:bottom-[85px] sm:right-0 sm:w-[400px] sm:h-[650px] sm:rounded-[28px] sm:shadow-2xl sm:border sm:border-gray-200/80 overflow-hidden"
          >
            {/* HEADER */}
            <div className="bg-black text-white p-5 flex justify-between items-center shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md">
                        <FontAwesomeIcon icon={faRobot} className="text-xl"/>
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-black"></div>
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight">DanZ-Kev Bot</h3>
                    <div className="flex items-center gap-1.5 opacity-80">
                        <FontAwesomeIcon icon={faCircle} className="text-[8px] text-green-400" />
                        <span className="text-xs font-medium">Online</span>
                    </div>
                </div>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90">
                <FontAwesomeIcon icon={faTimes} className="text-xl"/>
              </button>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FDFDFD] scroll-smooth font-medium">
              {messages.map((msg, idx) => (
                <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start items-end"}`}
                >
                  {msg.role !== "user" && (
                       <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2 shrink-0 mb-1 border border-gray-200">
                            <FontAwesomeIcon icon={faRobot} className="text-gray-600 text-sm" />
                       </div>
                  )}
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap
                    ${msg.role === "user" 
                        ? "bg-black text-white rounded-br-sm" 
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"}`}
                  >
                    {/* PANGGIL FUNGSI RENDER CONTENT DISINI */}
                    {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                 <div className="flex justify-start items-end gap-2">
                     <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                            <FontAwesomeIcon icon={faRobot} className="text-gray-600 text-sm" />
                     </div>
                    <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                        <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                        </div>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* INPUT AREA */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0 pb-safe sm:pb-5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 bg-gray-50 text-gray-900 text-sm px-5 py-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all border border-gray-100 placeholder:text-gray-400 font-medium"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="w-[54px] h-[54px] bg-black text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-md"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-lg translate-x-[1px] translate-y-[1px]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. TOMBOL UTAMA (FAB) */}
      <AnimatePresence>
        {!isOpen && (
            <motion.button
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="pointer-events-auto w-[72px] h-[72px] bg-black text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center border-[3px] border-white hover:bg-gray-900 transition-all z-[9990]"
            >
                <FontAwesomeIcon icon={faCommentDots} className="text-3xl" />
            </motion.button>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pb-safe { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
};

export default Chat;