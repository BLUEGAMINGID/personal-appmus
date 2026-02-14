"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import getLocalMetadata, { getSimpleMetadata } from "./fetch";
import { playlist } from "./list";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import {
    faPlay, faPause, faQuoteRight, faForward, faBackward,
    faMicrophone, faMusic, faSpinner, faBars, faTimes
} from "@fortawesome/free-solid-svg-icons";

// --- KOMPONEN: DYNAMIC INTERLUDE DOTS ---
const LiveInterlude = ({ audioRef, startTime, duration, isActive }) => {
    const fillRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        let rafId;

        const update = () => {
            if (!audioRef.current || !fillRef.current) return;
            
            const currentTime = audioRef.current.currentTime;
            
            // Hitung progress (0.0 sampai 1.0) berdasarkan waktu lagu saat ini
            // Rumus: (Waktu Sekarang - Waktu Mulai Interlude) / Durasi Interlude
            let progress = (currentTime - startTime) / duration;
            
            // Clamp progress agar tidak bocor (0% - 100%)
            progress = Math.max(0, Math.min(1, progress));

            // Update lebar div "Filling" secara langsung (Tanpa Re-render React)
            fillRef.current.style.width = `${progress * 100}%`;

            if (isActive) {
                rafId = requestAnimationFrame(update);
            }
        };

        if (isActive) {
            rafId = requestAnimationFrame(update);
        } else {
            // Jika tidak aktif (sudah lewat), set penuh atau kosong tergantung posisi
            if (audioRef.current && audioRef.current.currentTime > startTime + duration) {
                 if(fillRef.current) fillRef.current.style.width = '100%';
            } else {
                 if(fillRef.current) fillRef.current.style.width = '0%';
            }
        }

        return () => cancelAnimationFrame(rafId);
    }, [isActive, startTime, duration, audioRef]);

    return (
        <div ref={containerRef} className="py-8 pl-2 w-full flex flex-col justify-center gap-2 opacity-100 transition-opacity duration-500">
            {/* Label Instrumental */}
            {isActive && (
                <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="text-[10px] font-bold tracking-[0.2em] text-green-400 uppercase mb-1"
                >
                    Instrumental Break
                </motion.div>
            )}

            {/* Container Titik */}
            <div className="relative inline-block w-fit">
                {/* Layer 1: Titik Redup (Background) */}
                <div className="text-[30px] tracking-[12px] text-white/10 leading-none select-none font-bold">
                    ● ● ●
                </div>

                {/* Layer 2: Titik Terang (Filling/Masking) */}
                {/* Div ini akan melebar dari 0% ke 100% menutupi layer 1 */}
                <div 
                    ref={fillRef} 
                    className="absolute top-0 left-0 h-full overflow-hidden whitespace-nowrap text-[30px] tracking-[12px] text-white leading-none select-none font-bold transition-all duration-75 ease-linear will-change-[width]"
                    style={{ width: '0%', textShadow: "0 0 15px rgba(255,255,255,0.8)" }}
                >
                    ● ● ●
                </div>
            </div>
        </div>
    );
};


// --- KOMPONEN: APPLE VOCAL SLIDER (Mini Capsule Edition) ---
const AppleVocalSlider = ({ value, onChange, onClose }) => {
    const sliderRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Logic Touch/Drag
    const handleMove = (clientY) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const height = rect.height;
        const bottom = rect.bottom;
        let percentage = (bottom - clientY) / height;
        percentage = Math.max(0, Math.min(1, percentage));
        onChange(percentage);
    };

    const handlePointerDown = (e) => {
        setIsDragging(true);
        handleMove(e.clientY);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => { if (isDragging) handleMove(e.clientY); };
    const handlePointerUp = (e) => { setIsDragging(false); e.target.releasePointerCapture(e.pointerId); };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} onTouchStart={onClose} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ 
                    opacity: 1, 
                    scale: isDragging ? 1.15 : 1,
                    y: 0 
                }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ type: "spring", damping: 20, stiffness: 350 }}
                className="absolute bottom-20 right-0 z-50 flex flex-col items-center origin-bottom"
            >
                <div 
                    ref={sliderRef}
                    className="relative w-[42px] h-[140px] rounded-[21px] overflow-hidden cursor-pointer touch-none select-none border border-white/20"
                    style={{
                        background: "rgba(30, 30, 30, 0.6)", 
                        backdropFilter: "blur(40px)",
                        boxShadow: isDragging 
                            ? "0 15px 40px rgba(255,255,255,0.15)" 
                            : "0 8px 30px rgba(0,0,0,0.5)"
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <motion.div 
                        className="absolute bottom-0 w-full bg-white/90"
                        style={{ height: `${value * 100}%` }}
                        transition={{ duration: isDragging ? 0 : 0.3 }}
                    >
                        <motion.div 
                            animate={{ opacity: isDragging ? 1 : 0.5, scale: isDragging ? 1.5 : 1 }}
                            className="absolute top-0 left-0 right-0 h-[30px] bg-white blur-[15px]"
                        />
                    </motion.div>

                    <div className="absolute inset-0 flex flex-col justify-end items-center pb-5 pointer-events-none mix-blend-difference">
                        <FontAwesomeIcon icon={faMicrophone} className="text-white text-sm opacity-80" />
                    </div>

                    <div className="absolute inset-0 rounded-[21px] pointer-events-none border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70%] h-[2px] bg-white/30 rounded-full blur-[0.5px]" />
                    </div>
                </div>
            </motion.div>
        </>
    );
};

// --- TIME SLIDER ---
const AppleMusicTimeSlider = ({ audioRef, duration, isPaused, onSeekStart, onSeekEnd }) => {
    const progressRef = useRef(null);
    const timeRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const format = (s) => {
        if (!s || isNaN(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    useEffect(() => {
        let rafId;
        const updateLoop = () => {
            if (audioRef.current && !isDragging) {
                const curr = audioRef.current.currentTime;
                const pct = (curr / (duration || 1)) * 100;
                if (progressRef.current) progressRef.current.style.width = `${pct}%`;
                if (timeRef.current) timeRef.current.innerText = format(curr);
            }
            rafId = requestAnimationFrame(updateLoop);
        };
        if (!isPaused) rafId = requestAnimationFrame(updateLoop);
        return () => cancelAnimationFrame(rafId);
    }, [isPaused, duration, isDragging, audioRef]);

    const handleChange = (e) => {
        const val = parseFloat(e.target.value);
        const time = val * duration;
        if (progressRef.current) progressRef.current.style.width = `${val * 100}%`;
        if (timeRef.current) timeRef.current.innerText = format(time);
        onSeekStart(time);
    };

    return (
        <div className="w-full flex items-center gap-3 text-[10px] font-bold text-white/50 tabular-nums select-none">
            <span ref={timeRef} className="w-8 text-right">0:00</span>
            <div className="relative flex-1 h-8 flex items-center group cursor-pointer">
                <div className="absolute inset-x-0 h-[4px] bg-white/20 rounded-full overflow-hidden transition-all duration-300 ease-out group-hover:h-[6px]">
                    <div ref={progressRef} className="h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: '0%' }} />
                </div>
                <input type="range" min={0} max={1} step="0.001"
                    onMouseDown={() => setIsDragging(true)} onTouchStart={() => setIsDragging(true)}
                    onChange={handleChange}
                    onMouseUp={(e) => { setIsDragging(false); onSeekEnd(parseFloat(e.target.value) * duration); }}
                    onTouchEnd={(e) => { setIsDragging(false); onSeekEnd(parseFloat(e.target.value) * duration); }}
                    className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                />
            </div>
            <span className="w-8">{format(duration)}</span>
        </div>
    );
};

// --- MAIN CARD ---
const Card = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [result, setResult] = useState({ lyrics: [], title: "Loading...", artist: "Music", cover: null, audioUrl: "", karaokeUrl: null });
    const [isPaused, setIsPaused] = useState(true);
    const [duration, setDuration] = useState(0);
    const [showLyrics, setShowLyrics] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [isLoading, setIsLoading] = useState(true);
    const [playlistMeta, setPlaylistMeta] = useState([]);
    const [showVocalControls, setShowVocalControls] = useState(false);
    const [vocalMix, setVocalMix] = useState(1);

    const audioRef = useRef(null);
    const instruRef = useRef(null);
    const scrollRef = useRef(null);

    // --- LOGIC 1: PENGELOMPOKAN PLAYLIST ---
    const groupedPlaylist = useMemo(() => {
        const groups = [];
        let currentGroup = null;
        playlistMeta.forEach((track) => {
            const groupKey = `${track.artist} - ${track.album}`;
            if (!currentGroup || currentGroup.key !== groupKey) {
                currentGroup = { key: groupKey, artist: track.artist, album: track.album, tracks: [] };
                groups.push(currentGroup);
            }
            currentGroup.tracks.push(track);
        });
        return groups;
    }, [playlistMeta]);

    // --- LOGIC 2: PROSES LIRIK ---
    const processedLyrics = useMemo(() => {
        if (!result.lyrics || result.lyrics.length === 0) return [];
        const newLyrics = [];
        if (result.lyrics[0].time > 8) newLyrics.push({ time: 0, text: "● ● ●", isInterlude: true, duration: result.lyrics[0].time });
        for (let i = 0; i < result.lyrics.length; i++) {
            const currentLine = result.lyrics[i];
            newLyrics.push(currentLine);
            if (result.lyrics[i + 1]) {
                const nextTime = result.lyrics[i + 1].time;
                const endTime = currentLine.endTime || (currentLine.time + 3);
                const gap = nextTime - endTime;
                if (gap > 10) newLyrics.push({ time: endTime, text: "● ● ●", isInterlude: true, duration: gap });
            }
        }
        return newLyrics;
    }, [result.lyrics]);

    useEffect(() => { setCurrentIndex(0); }, []);

    // --- LOGIC 3: LOAD PLAYLIST METADATA ---
    useEffect(() => {
        if (showPlaylist && playlistMeta.length === 0) {
            const fetchData = async () => {
                const tempResults = [];
                for (let i = 0; i < playlist.length; i++) {
                    const item = playlist[i];
                    const meta = await getSimpleMetadata(item);
                    tempResults.push({ ...meta, idx: i, album: item.album });
                }
                setPlaylistMeta(tempResults);
            };
            fetchData();
        }
    }, [showPlaylist]);

    // --- LOGIC 4: LOAD SONG & AUDIO ---
    useEffect(() => {
        setIsLoading(true);
        setActiveIdx(-1);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        
        const currentTrack = playlist[currentIndex];
        
        // STOP SEBELUM GANTI
        if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if(instruRef.current) { instruRef.current.pause(); instruRef.current.currentTime = 0; }

        getLocalMetadata(currentTrack).then((data) => {
            setResult(data);
            
            // SETUP AUDIO MAIN
            if (audioRef.current) { 
                audioRef.current.src = data.audioUrl; 
                audioRef.current.load(); 
            }
            
            // SETUP AUDIO KARAOKE
            if (instruRef.current) {
                if (data.karaokeUrl) { 
                    instruRef.current.src = data.karaokeUrl; 
                    instruRef.current.load();
                } else {
                    instruRef.current.removeAttribute("src"); 
                }
            }

            const onLoadedMetadata = () => {
                if(audioRef.current) {
                    setDuration(audioRef.current.duration);
                    
                    // PLAY DENGAN PROMISE UNTUK MENGHINDARI ERROR
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                             if (instruRef.current && data.karaokeUrl) {
                                 // SYNC AWAL YANG KERAS
                                 instruRef.current.currentTime = audioRef.current.currentTime;
                                 instruRef.current.play().catch(e => {});
                             }
                             setIsPaused(false);
                             setIsLoading(false);
                        }).catch(e => { 
                            setIsPaused(true); 
                            setIsLoading(false); 
                        });
                    }
                }
            };
            
            if(audioRef.current) {
                audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata, {once: true});
            }
        });
    }, [currentIndex]);

    // --- LOGIC 5: VOLUME MIXING ---
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = Math.max(0, Math.min(1, vocalMix));
        if (instruRef.current && result.karaokeUrl) {
            instruRef.current.volume = 1.0; 
        }
    }, [vocalMix, result.karaokeUrl]);

    // --- LOGIC 6: TIME UPDATE & SYNC & LYRIC SCROLL (CORE IMPROVEMENT) ---
    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const mainTime = audioRef.current.currentTime;

        // A. IMPROVED AUDIO SYNC (NO DISTORTION)
        if (instruRef.current && result.karaokeUrl && !instruRef.current.paused && !audioRef.current.paused) {
            const diff = Math.abs(instruRef.current.currentTime - mainTime);
            
            // Threshold Logic:
            // Hapus logic playbackRate (pitch shift) yang bikin suara distorsi/radio.
            // Gunakan "Hard Sync" hanya jika drift > 0.15 detik (cukup terdengar).
            // Jika drift < 0.15 detik, biarkan saja (telinga manusia toleransi delay kecil).
            if (diff > 0.15) {
                instruRef.current.currentTime = mainTime;
            }
        }

        // B. OPTIMIZED LYRIC SEARCH (LIGHTWEIGHT)
        if (processedLyrics.length > 0) {
            let idx = -1;
            // Optimasi: Cari mulai dari index aktif terakhir, jangan dari 0 terus (hemat CPU)
            const startSearch = activeIdx > -1 ? Math.max(0, activeIdx) : 0;
            
            // Cek index saat ini dulu (paling sering terjadi)
            if (activeIdx < processedLyrics.length - 1 && 
                mainTime >= processedLyrics[activeIdx].time && 
                mainTime < processedLyrics[activeIdx + 1].time) {
                idx = activeIdx;
            } else {
                // Jika tidak match, baru loop ke depan
                for (let i = startSearch; i < processedLyrics.length; i++) {
                    if (mainTime >= processedLyrics[i].time) {
                        // Cek apakah ini lirik terakhir atau belum waktu lirik berikutnya
                        if (i === processedLyrics.length - 1 || mainTime < processedLyrics[i + 1].time) {
                            idx = i;
                            break;
                        }
                    }
                }
            }
            
            // Jika user seek ke belakang, reset pencarian dari 0
            if (idx === -1 && mainTime < processedLyrics[startSearch]?.time) {
                 for (let i = 0; i < processedLyrics.length; i++) {
                    if (mainTime >= processedLyrics[i].time && (i === processedLyrics.length - 1 || mainTime < processedLyrics[i+1].time)) {
                        idx = i; break;
                    }
                 }
            }

            if (idx !== -1 && idx !== activeIdx) setActiveIdx(idx);
        }
    };

    // --- LOGIC 7: CUSTOM SCROLL (FIX TERTUTUP HEADER) ---
    useEffect(() => {
        if (showLyrics && scrollRef.current && !showPlaylist && activeIdx !== -1) {
            const activeEl = scrollRef.current.children[activeIdx];
            
            if (activeEl) {
                const container = scrollRef.current;
                const containerH = container.clientHeight;
                const elTop = activeEl.offsetTop;
                const elH = activeEl.clientHeight;

                // Hitung posisi scroll agar lirik ada di posisi 35% dari atas (bukan 50%)
                // Ini memberi ruang "aman" di atas agar tidak tertutup header
                // Dan memberi ruang "baca" di bawah.
                let targetScroll = elTop - (containerH * 0.35);

                // Jika lirik sangat panjang (lebih tinggi dari setengah layar),
                // pastikan bagian atas lirik yang sejajar dengan 'mata' (35% screen)
                if (elH > containerH * 0.5) {
                    targetScroll = elTop - (containerH * 0.30);
                }

                container.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeIdx, showLyrics, showPlaylist]);

    const togglePlay = () => {
        if(audioRef.current) {
            if(isPaused) {
                audioRef.current.play();
                if(instruRef.current && result.karaokeUrl) instruRef.current.play();
                setIsPaused(false);
            } else {
                audioRef.current.pause();
                if(instruRef.current) instruRef.current.pause();
                setIsPaused(true);
            }
        }
    };

    const handleSeekEnd = (newTime) => {
        if (audioRef.current) { 
            audioRef.current.currentTime = newTime; 
        }
        if (instruRef.current && result.karaokeUrl) {
            instruRef.current.currentTime = newTime;
        }
    };

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % playlist.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    const selectSong = (idx) => { if (idx === currentIndex) { setShowPlaylist(false); return; } setCurrentIndex(idx); setShowPlaylist(false); };

    return (
        <div className="mt-6 w-full max-w-md mx-auto md:mx-0 font-jost select-none relative z-10">
            <audio ref={audioRef} preload="auto" onTimeUpdate={handleTimeUpdate} onEnded={handleNext} className="hidden" />
            <audio ref={instruRef} preload="auto" className="hidden" />

            <div className="relative w-full rounded-[40px] overflow-hidden shadow-2xl bg-[#0a0a0a]" style={{ height: showLyrics || showPlaylist ? 580 : 200, transition: 'height 0.5s cubic-bezier(0.32, 0.72, 0, 1)' }}>
                {/* Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#0a0a0a]">
                     {result.cover && (
                        <div className="absolute inset-0 w-full h-full animate-fade-in">
                            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-cover bg-center opacity-40 blur-[80px] animate-slow-spin" style={{ backgroundImage: `url(${result.cover})` }}></div>
                            <div className="absolute inset-0 bg-black/30"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80"></div>
                        </div>
                     )}
                     <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 w-full h-full p-6 flex flex-col border border-white/5">
                    {/* Header */}
                    <div className="flex items-center space-x-5 shrink-0 mb-4 relative z-50">
                        <div className="w-14 h-14 rounded-lg overflow-hidden shadow-lg relative shrink-0 border border-white/10 bg-white/5">
                            {result.cover ? <img src={result.cover} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FontAwesomeIcon icon={faApple} className="text-white/30 text-xl" /></div>}
                        </div>
                        <div className="min-w-0 flex flex-col justify-center flex-1">
                            <h3 className="font-bold text-white truncate text-[18px]">{result.title}</h3>
                            <p className="text-white/60 font-medium text-[13px] truncate">{result.artist}</p>
                        </div>
                        <button onClick={() => { setShowLyrics(!showLyrics); setShowPlaylist(false); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${showLyrics && !showPlaylist ? "bg-white text-black" : "bg-white/10 text-white"}`}>
                            <FontAwesomeIcon icon={faQuoteRight} size="sm" />
                        </button>
                    </div>

                    {/* Expandable Area */}
                    <div className={`relative flex-1 overflow-hidden transition-all duration-500 ease-out ${showLyrics || showPlaylist ? "opacity-100 mb-4" : "opacity-0 h-0 mb-0 pointer-events-none"}`}>
                        
                        {/* Playlist Overlay */}
                        {showPlaylist && (
                            <div className="absolute inset-0 z-30 bg-[#111] rounded-3xl overflow-hidden flex flex-col border border-white/10 animate-slide-up">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest pl-1">Up Next</span>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
                                    {groupedPlaylist.map((group, gIdx) => (
                                        <div key={gIdx} className="mb-2">
                                            <div className="sticky top-0 bg-[#111] p-2 rounded-lg mb-2 z-10 border border-white/5">
                                                <h4 className="text-white font-bold text-sm truncate ml-1">{group.album}</h4>
                                            </div>
                                            <div className="space-y-1">
                                                {group.tracks.map((track, i) => (
                                                    <div key={track.idx} onClick={() => selectSong(track.idx)} className={`flex items-center p-2 rounded-xl gap-3 cursor-pointer ${currentIndex === track.idx ? "bg-white/10" : "hover:bg-white/5"}`}>
                                                        <div className="w-6 text-center shrink-0">
                                                            {currentIndex === track.idx ? <FontAwesomeIcon icon={faPlay} className="text-green-400 text-[10px]"/> : <span className="text-white/30 text-[12px] font-medium">{i + 1}</span>}
                                                        </div>
                                                        <span className={`text-[13px] font-bold truncate ${currentIndex === track.idx ? "text-green-400" : "text-white"}`}>{track.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

{/* Lyrics Area */}
<div ref={scrollRef} className="w-full h-full overflow-y-auto no-scrollbar py-[180px] px-2 mask-scroller-y">
    {processedLyrics.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
            <FontAwesomeIcon icon={faMusic} className="text-2xl" />
            <p className="text-sm">No Lyrics</p>
        </div>
    ) : (
        processedLyrics.map((line, i) => {
            const isActive = activeIdx === i;

            // --- LOGIC BARU: Jika ini adalah Interlude ---
            if (line.isInterlude) {
                return (
                    <LiveInterlude 
                        key={i}
                        audioRef={audioRef}
                        startTime={line.time}
                        duration={line.duration}
                        isActive={isActive}
                    />
                );
            }
            // ---------------------------------------------

            return (
                <div 
                    key={i} 
                    onClick={() => handleSeekEnd(line.time)} 
                    className={`cursor-pointer py-3 text-left transition-all duration-300 ease-out origin-left ${
                        isActive 
                        ? "opacity-100 scale-100 active-lyric-glow blur-0" 
                        : "opacity-40 scale-[0.98] blur-[1.5px] hover:opacity-60 hover:blur-[0.5px]" 
                    }`}
                >
                    <p className="font-bold text-[26px] leading-tight text-white tracking-tight">{line.text}</p>
                </div>
            );
        })
    )}
</div>
// hai

                        {/* Bottom Actions */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end z-40">
                             <button onClick={(e) => { e.stopPropagation(); setShowPlaylist(!showPlaylist); }} className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 transition-all active:scale-90 ${showPlaylist ? "bg-white text-black" : "text-white"}`}><FontAwesomeIcon icon={showPlaylist ? faTimes : faBars} className="text-xs" /></button>
                            
                             {result.karaokeUrl && !showPlaylist && (
                                <div className="relative pointer-events-auto font-jost">
                                    <AnimatePresence>
                                        {showVocalControls && (
                                            <AppleVocalSlider 
                                                value={vocalMix} 
                                                onChange={setVocalMix} 
                                                onClose={() => setShowVocalControls(false)} 
                                            />
                                        )}
                                    </AnimatePresence>
                                    <button onClick={() => setShowVocalControls(!showVocalControls)} className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 transition-all active:scale-90 ${showVocalControls || vocalMix < 0.95 ? "bg-white text-black" : "text-white"}`}>
                                        <FontAwesomeIcon icon={faMicrophone} className="text-xs" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-auto flex flex-col gap-3 shrink-0 z-20 pt-2">
                        <AppleMusicTimeSlider audioRef={audioRef} duration={duration} isPaused={isPaused} onSeekStart={() => {}} onSeekEnd={handleSeekEnd} />
                        <div className="flex justify-center items-center gap-6">
                            <button onClick={handlePrev} className="text-white/60 hover:text-white p-3 active:scale-90 transition-transform"><FontAwesomeIcon icon={faBackward} size="lg" /></button>
                            <button onClick={togglePlay} className={`bg-white text-black w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform ${isLoading ? 'opacity-80' : ''}`}>{isLoading ? <FontAwesomeIcon icon={faSpinner} spin size="lg" className="text-black/50" /> : <FontAwesomeIcon icon={isPaused ? faPlay : faPause} size="2xl" className={isPaused ? "ml-2" : ""} />}</button>
                            <button onClick={handleNext} className="text-white/60 hover:text-white p-3 active:scale-90 transition-transform"><FontAwesomeIcon icon={faForward} size="lg" /></button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .mask-scroller-y { mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); }
                .active-lyric-glow p { text-shadow: 0 0 12px rgba(255,255,255,0.4); }
                @keyframes slow-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-slow-spin { animation: slow-spin 60s linear infinite; }
                .animate-fade-in { animation: fadeIn 1s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default Card;
