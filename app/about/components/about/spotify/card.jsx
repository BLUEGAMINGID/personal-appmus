"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import getLocalMetadata, { getSimpleMetadata } from "./fetch";
import { playlist } from "./list";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import {
    faPlay, faPause, faQuoteRight, faForward, faBackward,
    faMicrophone, faMusic, faSpinner, faBars, faTimes
} from "@fortawesome/free-solid-svg-icons";

// --- HOOKS ---
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        if (media.addEventListener) media.addEventListener("change", listener);
        else media.addListener(listener); 
        return () => {
            if (media.removeEventListener) media.removeEventListener("change", listener);
            else media.removeListener(listener);
        };
    }, [matches, query]);
    return matches;
};

// --- MEMOIZED SUB-COMPONENTS (PERFORMANCE CORE) ---

const LiveInterlude = React.memo(({ isActive, audioRef, startTime, duration }) => {
    const fillRef = useRef(null);

    useEffect(() => {
        let rafId;
        const update = () => {
            if (!audioRef.current || !fillRef.current) return;
            const currentTime = audioRef.current.currentTime;
            let progress = (currentTime - startTime) / duration;
            progress = Math.max(0, Math.min(1, progress));
            fillRef.current.style.width = `${progress * 100}%`;
            
            if (isActive) rafId = requestAnimationFrame(update);
        };

        if (isActive) {
            rafId = requestAnimationFrame(update);
        } else if (fillRef.current && audioRef.current) {
            fillRef.current.style.width = audioRef.current.currentTime > startTime + duration ? '100%' : '0%';
        }
        
        return () => cancelAnimationFrame(rafId);
    }, [isActive, startTime, duration, audioRef]);

    return (
        <div className="py-3 w-full flex flex-col items-start justify-center opacity-100 transition-opacity duration-700 will-change-transform transform-gpu">
            <div className="relative inline-block w-fit">
                <div className="text-[28px] tracking-[4px] text-white/20 leading-tight select-none font-bold mix-blend-screen pl-1">● ● ●</div>
                <div ref={fillRef} className="absolute top-0 left-0 h-full overflow-hidden whitespace-nowrap text-[28px] tracking-[4px] text-white leading-tight select-none font-bold will-change-[width] pl-1" style={{ width: '0%' }}>
                    <span className={isActive ? "active-lyric-glow-text" : ""}>● ● ●</span>
                </div>
            </div>
        </div>
    );
});
LiveInterlude.displayName = "LiveInterlude";

const AppleVocalSlider = React.memo(({ value, onChange, onClose }) => {
    const sliderRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMove = useCallback((clientY) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        let percentage = (rect.bottom - clientY) / rect.height;
        onChange(Math.max(0, Math.min(1, percentage)));
    }, [onChange]);

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} onTouchStart={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: isDragging ? 1.15 : 1, y: 0 }} exit={{ opacity: 0, scale: 0.5, y: 20 }} transition={{ type: "spring", damping: 20, stiffness: 350 }} className="absolute bottom-20 right-0 z-50 flex flex-col items-center origin-bottom">
                <div ref={sliderRef} className="relative w-[42px] h-[140px] rounded-[21px] overflow-hidden cursor-pointer touch-none select-none border border-white/20" style={{ background: "rgba(60, 60, 60, 0.4)", backdropFilter: "blur(40px) saturate(200%)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)" }} 
                    onPointerDown={(e) => { setIsDragging(true); handleMove(e.clientY); e.target.setPointerCapture(e.pointerId); }} 
                    onPointerMove={(e) => { if (isDragging) handleMove(e.clientY); }} 
                    onPointerUp={(e) => { setIsDragging(false); e.target.releasePointerCapture(e.pointerId); }} 
                    onClick={(e) => e.stopPropagation()} 
                    onTouchStart={(e) => e.stopPropagation()}>
                    <motion.div className="absolute bottom-0 w-full bg-white/90" style={{ height: `${value * 100}%` }} transition={{ duration: isDragging ? 0 : 0.3 }}><motion.div animate={{ opacity: isDragging ? 1 : 0.5 }} className="absolute top-0 left-0 right-0 h-[20px] bg-white blur-[10px]" /></motion.div>
                    <div className="absolute inset-0 flex flex-col justify-end items-center pb-5 pointer-events-none mix-blend-difference"><FontAwesomeIcon icon={faMicrophone} className="text-white text-sm opacity-80" /></div>
                    <div className="absolute inset-0 rounded-[21px] pointer-events-none border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]"><div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70%] h-[2px] bg-white/40 rounded-full blur-[0.5px]" /></div>
                </div>
            </motion.div>
        </>
    );
});
AppleVocalSlider.displayName = "AppleVocalSlider";

const AppleMusicTimeSlider = React.memo(({ audioRef, duration, isPaused, onSeekStart, onSeekEnd }) => {
    const progressRef = useRef(null);
    const timeRef = useRef(null);

    useEffect(() => {
        let rafId;
        const updateLoop = () => {
            if (audioRef.current) {
                const curr = audioRef.current.currentTime;
                const pct = duration > 0 ? (curr / duration) * 100 : 0;
                if (progressRef.current) progressRef.current.style.width = `${pct}%`;
                if (timeRef.current) timeRef.current.innerText = format(curr);
            }
            rafId = requestAnimationFrame(updateLoop);
        };
        if (!isPaused) rafId = requestAnimationFrame(updateLoop);
        return () => cancelAnimationFrame(rafId);
    }, [isPaused, duration, audioRef]);

    const format = (s) => {
        if (!s || isNaN(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const handleInput = (e) => {
        const val = parseFloat(e.target.value);
        if(progressRef.current) progressRef.current.style.width = `${val*100}%`; 
        if(timeRef.current) timeRef.current.innerText = format(val*duration); 
        onSeekStart(val*duration);
    };

    return (
        <div className="w-full flex items-center gap-3 text-[10px] font-bold text-white/50 tabular-nums select-none">
            <span ref={timeRef} className="w-8 text-right">0:00</span>
            <div className="relative flex-1 h-8 flex items-center group cursor-pointer">
                <div className="absolute inset-x-0 h-[4px] bg-white/20 rounded-full overflow-hidden transition-all duration-300 ease-out group-hover:h-[6px]">
                    <div ref={progressRef} className="h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: '0%' }} />
                </div>
                <input type="range" min={0} max={1} step="0.001" 
                    onChange={handleInput} 
                    onMouseUp={(e) => onSeekEnd(parseFloat(e.target.value) * duration)} 
                    onTouchEnd={(e) => onSeekEnd(parseFloat(e.target.value) * duration)} 
                    className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer" 
                />
            </div>
            <span className="w-8">{format(duration)}</span>
        </div>
    );
});
AppleMusicTimeSlider.displayName = "AppleMusicTimeSlider";

const LyricLine = React.memo(({ line, isActive, onClick, audioRef }) => {
    if (line.isInterlude) {
        return <LiveInterlude audioRef={audioRef} startTime={line.time} duration={line.duration} isActive={isActive} />;
    }
    return (
        <div 
            onClick={() => onClick(line.time)} 
            className={`cursor-pointer py-3 text-left transition-all duration-700 ease-out origin-left will-change-transform transform-gpu ${
                isActive 
                ? "opacity-100 scale-100 active-lyric-glow blur-0" 
                : "opacity-40 scale-[0.98] blur-[1.5px] hover:opacity-60 hover:blur-[0.5px]" 
            }`}
        >
            <p className={`font-bold text-[28px] leading-tight text-white tracking-tight ${isActive ? "active-lyric-glow-text" : ""}`}>{line.text}</p>
        </div>
    );
}, (prev, next) => prev.isActive === next.isActive && prev.line === next.line);
LyricLine.displayName = "LyricLine";

// --- MEMOIZED BACKGROUND (KEEP 3 LAYERS BUT OPTIMIZED) ---
const AliveBackground = React.memo(({ cover }) => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#101010] contain-strict">
        {cover && (
            <>
                <div 
                    className="absolute inset-[-50%] bg-cover bg-center animate-spin-slow will-change-transform transform-gpu" 
                    style={{ 
                        backgroundImage: `url(${cover})`, 
                        filter: 'blur(50px) saturate(250%) brightness(0.9)', 
                        opacity: 0.6, 
                        animationDelay: '-12s' 
                    }} 
                />
                
                <div 
                    className="absolute inset-[-50%] bg-cover bg-center animate-spin-reverse-slower will-change-transform transform-gpu" 
                    style={{ 
                        backgroundImage: `url(${cover})`, 
                        mixBlendMode: 'screen', 
                        filter: 'blur(35px) saturate(300%) contrast(110%)', 
                        opacity: 0.5, 
                        animationDelay: '-45s' 
                    }} 
                />

                <div 
                    className="absolute inset-[-50%] bg-cover bg-center animate-pulse-spin will-change-transform transform-gpu" 
                    style={{ 
                        backgroundImage: `url(${cover})`, 
                        mixBlendMode: 'overlay', 
                        filter: 'blur(30px) saturate(200%) brightness(1.2)', 
                        opacity: 0.3, 
                        animationDelay: '-23s' 
                    }} 
                />
                
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/90" />
            </>
        )}
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
    </div>
));
AliveBackground.displayName = "AliveBackground";

// --- MAIN CARD ---
const Card = () => {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    
    const [currentIndex, setCurrentIndex] = useState(0); 
    const [isMounted, setIsMounted] = useState(false);
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
    const playlistContainerRef = useRef(null);

    useEffect(() => {
        setIsMounted(true);
        setCurrentIndex(Math.floor(Math.random() * playlist.length));
    }, []);

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
        if (showPlaylist && playlistContainerRef.current) {
            setTimeout(() => {
                const activeEl = playlistContainerRef.current?.querySelector('.active-playlist-song');
                if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [showPlaylist, playlistMeta.length]);

    useEffect(() => {
        if (!isMounted) return;

        setIsLoading(true);
        setActiveIdx(-1);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        
        const currentTrack = playlist[currentIndex];
        
        if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if(instruRef.current) { instruRef.current.pause(); instruRef.current.currentTime = 0; }

        getLocalMetadata(currentTrack).then((data) => {
            setResult(data);
            
            if (audioRef.current) { audioRef.current.src = data.audioUrl; audioRef.current.load(); }
            if (instruRef.current) {
                if (data.karaokeUrl) { instruRef.current.src = data.karaokeUrl; instruRef.current.load(); } 
                else { instruRef.current.removeAttribute("src"); }
            }

            const onLoadedMetadata = () => {
                if(audioRef.current) {
                    setDuration(audioRef.current.duration);
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                             if (instruRef.current && data.karaokeUrl) {
                                 instruRef.current.currentTime = audioRef.current.currentTime;
                                 instruRef.current.play().catch(() => {});
                             }
                             setIsPaused(false);
                             setIsLoading(false);
                        }).catch(() => { 
                            setIsPaused(true); 
                            setIsLoading(false); 
                        });
                    }
                }
            };
            
            const audioEl = audioRef.current;
            if(audioEl) {
                audioEl.addEventListener('loadedmetadata', onLoadedMetadata, {once: true});
            }
            return () => {
                if(audioEl) audioEl.removeEventListener('loadedmetadata', onLoadedMetadata);
            };
        });
    }, [currentIndex, isMounted]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = Math.max(0, Math.min(1, vocalMix));
        if (instruRef.current && result.karaokeUrl) instruRef.current.volume = 1.0; 
    }, [vocalMix, result.karaokeUrl]);

    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return;
        const mainTime = audioRef.current.currentTime;

        if (instruRef.current && result.karaokeUrl && !instruRef.current.paused && !audioRef.current.paused) {
            const diff = Math.abs(instruRef.current.currentTime - mainTime);
            if (diff > 0.2) instruRef.current.currentTime = mainTime;
        }

        if (processedLyrics.length > 0) {
            const lyricAnimationDelay = 0.5;
            const adjustedTime = mainTime - lyricAnimationDelay;
            let idx = -1;
            
            if (activeIdx !== -1 && activeIdx < processedLyrics.length) {
                const current = processedLyrics[activeIdx];
                const next = processedLyrics[activeIdx + 1];
                if (adjustedTime >= current.time && (!next || adjustedTime < next.time)) idx = activeIdx;
            }

            if (idx === -1) {
                for (let i = 0; i < processedLyrics.length; i++) {
                    if (adjustedTime >= processedLyrics[i].time && 
                       (i === processedLyrics.length - 1 || adjustedTime < processedLyrics[i+1].time)) {
                        idx = i;
                        break;
                    }
                }
            }
            
            if (idx !== -1 && idx !== activeIdx) setActiveIdx(idx);
        }
    }, [result.karaokeUrl, processedLyrics, activeIdx]);

    useEffect(() => {
        if (showLyrics && scrollRef.current && !showPlaylist && activeIdx !== -1) {
            const activeEl = scrollRef.current.children[activeIdx];
            if (activeEl) {
                const container = scrollRef.current;
                const containerH = container.clientHeight;
                const elTop = activeEl.offsetTop;
                const elH = activeEl.clientHeight;
                let targetScroll = elTop - (containerH * 0.22); 
                if (elH > containerH * 0.4) targetScroll = elTop - (containerH * 0.15);
                container.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        }
    }, [activeIdx, showLyrics, showPlaylist]);

    const togglePlay = useCallback(() => {
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
    }, [isPaused, result.karaokeUrl]);

    const handleSeekEnd = useCallback((newTime) => {
        if (audioRef.current) audioRef.current.currentTime = newTime;
        if (instruRef.current && result.karaokeUrl) instruRef.current.currentTime = newTime;
    }, [result.karaokeUrl]);

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % playlist.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    const selectSong = (idx) => { if (idx === currentIndex) { setShowPlaylist(false); return; } setCurrentIndex(idx); setShowPlaylist(false); };

    // LAYOUT RESPONSIVE LOGIC
    const getCardHeight = () => {
        if (showLyrics || showPlaylist) return isDesktop ? 680 : 580; 
        return isDesktop ? 260 : 160; // Mobile: 160px (Compact), Desktop: 260px (Normal)
    };

    return (
        <div className="mt-6 w-full max-w-md mx-auto font-jost select-none relative z-10">
            <audio ref={audioRef} preload="auto" onTimeUpdate={handleTimeUpdate} onEnded={handleNext} className="hidden" />
            <audio ref={instruRef} preload="auto" className="hidden" />

            <div className="relative w-full rounded-[40px] overflow-hidden shadow-2xl bg-[#0a0a0a] transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)" style={{ height: getCardHeight() }}>
                
                {/* 3 LAYERS BACKGROUND */}
                <AliveBackground cover={result.cover} />

                <div className="relative z-10 w-full h-full p-6 flex flex-col border border-white/5">
                    {/* Header */}
                    <div className="flex items-center space-x-5 shrink-0 mb-4 relative z-50">
                        <div className="w-14 h-14 rounded-lg overflow-hidden shadow-lg relative shrink-0 border border-white/10 bg-white/5">
                            {result.cover ? <img src={result.cover} alt="Cover" className="w-full h-full object-cover" loading="eager" decoding="async" /> : <div className="w-full h-full flex items-center justify-center"><FontAwesomeIcon icon={faApple} className="text-white/30 text-xl" /></div>}
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
                        
                        {showPlaylist && (
                            <div className="absolute inset-0 z-30 bg-[#111]/80 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col border border-white/10 animate-slide-up">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5"><span className="text-[11px] font-bold text-white/70 uppercase tracking-widest pl-1">Up Next</span></div>
                                <div ref={playlistContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
                                    {groupedPlaylist.map((group, gIdx) => (
                                        <div key={gIdx} className="mb-2">
                                            <div className="sticky top-0 bg-[#111]/90 backdrop-blur-md p-2 rounded-lg mb-2 z-10 border border-white/5 shadow-sm"><h4 className="text-white font-bold text-sm truncate ml-1">{group.album}</h4></div>
                                            <div className="space-y-1">
                                                {group.tracks.map((track, i) => (
                                                    <div key={track.idx} onClick={() => selectSong(track.idx)} className={`flex items-center p-2 rounded-xl gap-3 cursor-pointer ${currentIndex === track.idx ? "bg-white/20 active-playlist-song border border-white/10" : "hover:bg-white/5"}`}>
                                                        <div className="w-6 text-center shrink-0">{currentIndex === track.idx ? <FontAwesomeIcon icon={faPlay} className="text-green-400 text-[10px]"/> : <span className="text-white/30 text-[12px] font-medium">{i + 1}</span>}</div>
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
                        <div ref={scrollRef} className="w-full h-full overflow-y-auto no-scrollbar pt-20 pb-32 px-4 mask-scroller-y">
                            {processedLyrics.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2"><FontAwesomeIcon icon={faMusic} className="text-2xl" /><p className="text-sm">No Lyrics</p></div>
                            ) : (
                                processedLyrics.map((line, i) => (
                                    <LyricLine 
                                        key={i} 
                                        line={line} 
                                        isActive={activeIdx === i} 
                                        onClick={handleSeekEnd} 
                                        audioRef={audioRef}
                                    />
                                ))
                            )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end z-40">
                             <button onClick={(e) => { e.stopPropagation(); setShowPlaylist(!showPlaylist); }} className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 transition-all active:scale-90 ${showPlaylist ? "bg-white text-black" : "text-white hover:bg-white/10"}`}><FontAwesomeIcon icon={showPlaylist ? faTimes : faBars} className="text-xs" /></button>
                             {result.karaokeUrl && !showPlaylist && (
                                <div className="relative pointer-events-auto font-jost">
                                    <AnimatePresence>{showVocalControls && (<AppleVocalSlider value={vocalMix} onChange={setVocalMix} onClose={() => setShowVocalControls(false)} />)}</AnimatePresence>
                                    <button onClick={() => setShowVocalControls(!showVocalControls)} className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 transition-all active:scale-90 ${showVocalControls || vocalMix < 0.95 ? "bg-white text-black" : "text-white hover:bg-white/10"}`}><FontAwesomeIcon icon={faMicrophone} className="text-xs" /></button>
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
                
                /* DEEP MASK FIX (25%) */
                .mask-scroller-y { 
                    mask-image: linear-gradient(to bottom, 
                        transparent 0%, 
                        rgba(0,0,0,0.2) 10%, 
                        rgba(0,0,0,0.6) 20%, 
                        black 30%, 
                        black 70%, 
                        rgba(0,0,0,0.6) 80%, 
                        rgba(0,0,0,0.2) 90%, 
                        transparent 100%
                    );
                    -webkit-mask-image: linear-gradient(to bottom, 
                        transparent 0%, 
                        rgba(0,0,0,0.2) 10%, 
                        rgba(0,0,0,0.6) 20%, 
                        black 30%, 
                        black 70%, 
                        rgba(0,0,0,0.6) 80%, 
                        rgba(0,0,0,0.2) 90%, 
                        transparent 100%
                    );
                }
                
                /* 1-LAYER SMOOTH GLOW (ALL DEVICES) */
                .active-lyric-glow-text { 
                    text-shadow: 0 0 25px rgba(255, 255, 255, 0.6);
                }

                @keyframes spin-slow { from { transform: rotate(0deg) scale(1.5); } to { transform: rotate(360deg) scale(1.5); } }
                @keyframes spin-reverse-slower { from { transform: rotate(360deg) scale(1.2); } to { transform: rotate(0deg) scale(1.2); } }
                @keyframes pulse-spin { 
                    0% { transform: rotate(0deg) scale(1.4); opacity: 0.3; } 
                    50% { transform: rotate(180deg) scale(1.6); opacity: 0.5; }
                    100% { transform: rotate(360deg) scale(1.4); opacity: 0.3; }
                }
                
                .animate-spin-slow { animation: spin-slow 90s linear infinite; }
                .animate-spin-reverse-slower { animation: spin-reverse-slower 120s linear infinite; }
                .animate-pulse-spin { animation: pulse-spin 60s ease-in-out infinite; }
                
                .contain-strict { contain: strict; }
            `}</style>
        </div>
    );
};

export default Card;
