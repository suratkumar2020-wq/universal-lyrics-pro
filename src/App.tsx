import AdminPanel from './Admin';
import { db } from './firebaseConfig'; // Firebase config se db import karein
import { doc, getDoc } from 'firebase/firestore';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { Radio, Languages, MoreVertical, Heart, Home, Settings, Flag, RefreshCw, Cpu, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LyricLine {
  id: number;
  time: number;
  original: string;
  translated?: string;
}

type Platform = 'spotify' | 'youtube' | 'jiosaavn';

const THEMES: Record<Platform, { color: string; bg: string; secondary: string }> = {
  spotify: { color: '#1db954', bg: '#080808', secondary: '#1ed760' },
  youtube: { color: '#ff0000', bg: '#050505', secondary: '#ff4d4d' },
  jiosaavn: { color: '#0fb3b8', bg: '#001516', secondary: '#73f6fb' }
};

const GlowBeat = ({ color }: { color: string }) => (
  <div className="flex items-end gap-[3px] h-6">
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        animate={{ height: [8, 24, 12, 20, 8] }}
        transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, ease: "easeInOut" }}
        className="w-[3px] rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />
    ))}
  </div>
);

export default function App() {
  const [platform, setPlatform] = useState<Platform>('spotify');
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [isHinglish, setIsHinglish] = useState(true);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'home' | 'settings' | 'report' | 'admin'>('home');
  const [showMenu, setShowMenu] = useState(false);

  const theme = THEMES[platform] || THEMES.spotify;

  // Helper to parse LRC string into LyricLine array
  const parseAndSetLRC = (lrcString: string) => {
    const lines = lrcString.split('\n').map((line, i) => {
      const match = line.match(/^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)/);
      if (match) {
        return {
          id: i,
          time: parseInt(match[1], 10) * 60 + parseFloat(match[2]),
          original: match[3] || "♪",
          translated: ""
        };
      }
      return null;
    }).filter(Boolean);
    setLyrics(lines as LyricLine[]);
  };

  const fetchLyrics = async () => {
    if (!song || !artist) return;
    setIsLoading(true);
    setLyrics([]);

    try {
      // 1. PRIORITY 1: Check Firebase Verified DB
      const songId = `${artist.toLowerCase().trim().replace(/ /g, '_')}_${song.toLowerCase().trim().replace(/ /g, '_')}`;
      const docRef = doc(db, "verified_lyrics", songId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const verifiedData = docSnap.data();
        
        // NEW ADD-ON: Merging Original and Hinglish LRC from Firebase
        const originalLines = (verifiedData.lrc || "").split('\n');
        const hinglishLines = (verifiedData.hinglishLrc || "").split('\n');

        const mergedLyrics = originalLines.map((line: string, i: number) => {
          const match = line.match(/^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)/);
          if (match) {
            const time = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
            const originalText = match[3] || "♪";

            // Hinglish line se text nikalna (same index par)
            let transText = "";
            if (hinglishLines[i]) {
              // Timestamp match karne ki koshish (agar user ne timestamps ke sath paste kiya ho)
              const transMatch = hinglishLines[i].match(/^\[\d{2}:\d{2}(?:\.\d+)?\]\s*(.*)/);
              transText = transMatch ? transMatch[1] : hinglishLines[i].replace(/^\[.*?\]\s*/, "");
            }

            return {
              id: i,
              time: time,
              original: originalText,
              translated: transText // Firebase se hinglish yahan load hogi
            };
          }
          return null;
        }).filter(Boolean);

        if (mergedLyrics.length > 0) {
          setLyrics(mergedLyrics as LyricLine[]);
          setIsLoading(false);
          return; 
        }
      }

      // 2. PRIORITY 2: Check LRCLIB
      const lrcUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(song)}`;
      const lrcRes = await fetch(lrcUrl);
      if (lrcRes.ok) {
        const lrcData = await lrcRes.json();
        if (lrcData.syncedLyrics) {
          parseAndSetLRC(lrcData.syncedLyrics);
          setIsLoading(false);
          return;
        }
      }

      // 3. PRIORITY 3: Local Backend (AI)
      const res = await fetch(`http://localhost:3000/api/lyrics?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}`);
      const data = await res.json();
      
      if (data.status === 'success' && data.data) {
        const lines = data.data.original.split('\n').map((line: string, i: number) => {
          const match = line.match(/^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)/);
          let time = -1, text = line;
          if (match) { 
            time = parseInt(match[1], 10) * 60 + parseFloat(match[2]); 
            text = match[3]; 
          }
          let transText = data.data.hinglish ? data.data.hinglish.split('\n')[i] : '';
          const transMatch = transText?.match(/^\[\d{2}:\d{2}(?:\.\d+)?\]\s*(.*)/);
          if (transMatch) transText = transMatch[1];
          return { id: i, time, original: text || "♪", translated: transText };
        }).filter((l: LyricLine) => l.original.trim() !== '');
        setLyrics(lines);
      }
    } catch (err) {
      console.error("Lyrics Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReport = () => {
    // Apne real Google Form entries yahan update karein
    const formId = "1FAIpQLSfFc0eolMHv5g7nSOzZeIYhT_5WNGkwrtyPUUE_yY1zzDX9gQ";
    const songEntry = "entry.694037124";
    const artistEntry = "entry.1494193670";
    const finalUrl = `https://docs.google.com/forms/d/e/${formId}/viewform?usp=pp_url&${songEntry}=${encodeURIComponent(song)}&${artistEntry}=${encodeURIComponent(artist)}`;
    window.open(finalUrl, '_blank');
  };

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['currentTrack', 'currentPlaybackTime'], (result) => {
        if (result.currentTrack) {
          setSong(result.currentTrack.song); setArtist(result.currentTrack.artist); setPlatform(result.currentTrack.platform);
        }
        if (result.currentPlaybackTime) setCurrentTime(result.currentPlaybackTime);
      });
      const handleStorageChange = (changes: any, areaName: string) => {
        if (areaName === 'local') {
          if (changes.currentTrack?.newValue) {
            setSong(changes.currentTrack.newValue.song);
            setArtist(changes.currentTrack.newValue.artist);
            setPlatform(changes.currentTrack.newValue.platform);
          }
          if (changes.currentPlaybackTime?.newValue !== undefined) setCurrentTime(changes.currentPlaybackTime.newValue);
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, []);

  useEffect(() => { fetchLyrics(); }, [song, artist]);

  let activeIndex = 0;
  if (lyrics.length > 0) {
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time !== -1 && lyrics[i].time <= currentTime + 0.4) activeIndex = i;
    }
  }

  useEffect(() => {
    const activeEl = document.getElementById(`lyric-${activeIndex}`);
    if (activeEl && activeTab === 'home') activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex, activeTab]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] font-sans selection:bg-white/20">
      <main className="w-[380px] h-[640px] rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col relative transition-all duration-1000 border border-white/5" style={{ backgroundColor: theme.bg }}>
        
        {/* Transparent Header */}
        <header className="px-6 h-12 flex justify-between items-center z-[100] bg-[#000000] border-none relative">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.color, boxShadow: `0 0 8px ${theme.color}` }} />
            <span className="text-[9px] font-black tracking-[4px] uppercase text-white/60 select-none">{platform}</span>
          </div>
          <div className="flex items-center gap-4 text-white/30 relative">
            <RefreshCw className={`w-3.5 h-3.5 cursor-pointer hover:text-white transition-all ${isLoading ? 'animate-spin' : ''}`} onClick={fetchLyrics} />
            <div className="w-[1px] h-3 bg-white/10" />
            <MoreVertical className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => setShowMenu(!showMenu)} />
            
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }} className="absolute right-0 top-8 w-40 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[110]">
                  <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-2 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-lg transition-colors">REFRESH APP</button>
                  <button onClick={() => { setActiveTab('admin'); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-[10px] font-bold text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors border-t border-white/5 mt-1 uppercase">Open Host Panel</button>
                  <button onClick={() => setShowMenu(false)} className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-500/70 hover:bg-red-500/10 rounded-lg transition-colors uppercase">Close Menu</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Content Tabs */}
        <section className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-32 no-scrollbar" ref={scrollRef}>
          {activeTab === 'home' ? (
            <>
              {/* Metadata only on Home */}
              <section className="pt-2 pb-4 flex items-center gap-4 bg-gradient-to-b from-black/20 to-transparent">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative z-10">
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center"><GlowBeat color={theme.color} /></div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ backgroundColor: theme.color }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-[20px] font-black text-white truncate tracking-tight">{song || "Ready to sync"}</h1>
                  <p className="text-[13px] font-bold opacity-60 truncate" style={{ color: theme.color }}>{artist || "Play some music..."}</p>
                </div>
                <div className="ml-auto flex items-center gap-2"><Heart className="w-5 h-5 cursor-pointer active:scale-125 transition-transform" style={{ color: theme.color, fill: theme.color }} /></div>
              </section>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20">
                  <RefreshCw className="w-10 h-10 animate-spin" />
                  <p className="text-[12px] font-black tracking-widest uppercase text-center text-white/40 leading-relaxed">Analyzing Beats &<br/>Fetching Lyrics</p>
                </div>
              ) : lyrics.length > 0 ? (
                lyrics.map((line, index) => {
                  const status = index === activeIndex ? 'active' : index < activeIndex ? 'passed' : 'future';
                  const primaryText = isHinglish ? (line.translated || line.original) : line.original;
                  const secondaryText = (isHinglish && line.translated) ? line.original : null;
                  return (
                    <motion.div key={line.id} id={`lyric-${index}`} className={`relative p-5 transition-all duration-700 rounded-[24px] border ${status === 'active' ? 'bg-white/[0.04] border-white/10 shadow-2xl' : 'border-transparent'}`}>
                      <p className={`font-black leading-tight tracking-tight transition-all duration-700 ${status === 'active' ? 'text-[26px] opacity-100' : 'text-[22px] opacity-20'}`} style={status === 'active' ? { color: 'white' } : {}}>{primaryText}</p>
                      <AnimatePresence>{secondaryText && status === 'active' && (<motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 0.6, height: 'auto' }} className="text-[15px] font-bold mt-2" style={{ color: theme.secondary }}>{secondaryText}</motion.p>)}</AnimatePresence>
                      {status === 'active' && (<motion.div layoutId="bar" className="absolute left-0 top-6 bottom-6 w-1 rounded-full" style={{ backgroundColor: theme.color, boxShadow: `0 0 15px ${theme.color}` }} />)}
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-20">
                  <Cpu className="w-16 h-16 mb-4 mx-auto" />
                  <p className="text-sm font-black tracking-widest uppercase">Vibe not found</p>
                </div>
              )}
            </>
          ) : activeTab === 'settings' ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-10 space-y-8">
              <h2 className="text-3xl font-black text-white">Settings</h2>
              <div className="space-y-4">
                <div className="p-5 bg-white/5 rounded-[24px] border border-white/5">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Adaptive Color</p>
                  <p className="text-sm font-bold tracking-tight">Smart theme is <span style={{ color: theme.color }}>ENABLED</span></p>
                </div>
                <div className="p-5 bg-white/5 rounded-[24px] border border-white/5">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Database Priority</p>
                  <p className="text-sm font-bold tracking-tight">Verified &gt; LRCLIB &gt; AI</p>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'report' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-20">
              <Flag className="w-16 h-16 opacity-10 mx-auto" />
              <div>
                <h2 className="text-2xl font-black text-white">Report Issue</h2>
                <p className="text-xs font-bold text-white/40 mt-2">Lyrics mismatch or sync delay?</p>
              </div>
              <button onClick={handleSendReport} className="px-10 py-4 bg-white text-black rounded-full font-black text-[10px] tracking-widest uppercase active:scale-95 transition-transform">Send Report</button>
            </motion.div>
          ) : (
            <div className="pt-10">
              <AdminPanel onBack={() => setActiveTab('home')} />              
            </div>
          )}
        </section>

        {/* Floating Toggle (Home only) */}
        {activeTab === 'home' && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center z-[60]">
            <button onClick={() => setIsHinglish(!isHinglish)} className="flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl hover:bg-black/60 transition-all active:scale-95 shadow-xl">
              <div className={`w-2 h-2 rounded-full ${isHinglish ? 'animate-pulse' : ''}`} style={{ backgroundColor: isHinglish ? theme.color : '#444' }} />
              <span className="text-[10px] font-black tracking-[2px] text-white/90 uppercase">{isHinglish ? 'Hinglish ON' : 'Native Mode'}</span>
            </button>
          </div>
        )}

        {/* Navigation Footer */}
        <footer className="h-20 flex items-center justify-around bg-black/60 backdrop-blur-2xl border-t border-white/[0.03] z-[70]">
          <div onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'home' ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-50'}`}>
            <Home className="w-5 h-5 text-white" />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: activeTab === 'home' ? theme.color : 'transparent' }} />
          </div>
          <div onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'settings' ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-50'}`}>
            <Settings className="w-5 h-5 text-white" />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: activeTab === 'settings' ? theme.color : 'transparent' }} />
          </div>
          <div onClick={() => setActiveTab('report')} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'report' ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-50'}`}>
            <Flag className="w-5 h-5 text-white" />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: activeTab === 'report' ? theme.color : 'transparent' }} />
          </div>
        </footer>
      </main>
    </div>
  );
}