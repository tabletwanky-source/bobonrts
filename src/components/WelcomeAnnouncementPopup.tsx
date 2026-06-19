import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { WelcomeAnnouncement } from '../types';
import { Radio, Phone, Wifi, X, ChevronRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default announcement parameters
const DEFAULT_ANNOUNCEMENT: WelcomeAnnouncement = {
  title: "🎙️ AUDIO NOW – ÉCOUTEZ-NOUS PARTOUT !",
  content: `📞 AUDIONOW : 1-518-801-1331

📱 Téléchargez notre application mobile et écoutez-nous en direct partout dans le monde.

📡 Dans les mois à venir, il est possible que notre signal soit disponible sur 93.1 FM ou 98.1 FM dans plusieurs zones d’Haïti.

📍 Zones concernées :
Kafou, Kafoufèy, Pòtoprens, Kanapevè, Matisan, Bizoton, Dègàn, Mariani, Potay ak lòt lokalite yo.

🎧 Rete konekte avèk nou pou tout nouvo anons ak mizajou yo.`,
  imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop",
  enabled: true,
  autoCloseDuration: 10,
  views: 0,
  dismissals: 0
};

const WelcomeAnnouncementPopup: React.FC = () => {
  const [announcement, setAnnouncement] = useState<WelcomeAnnouncement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [statsRecorded, setStatsRecorded] = useState(false);
  
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const STORAGE_KEY = 'sismique_welcome_announcement_last_shown_time';

  useEffect(() => {
    fetchAnnouncementAndCheckDisplay();

    return () => {
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const fetchAnnouncementAndCheckDisplay = async () => {
    try {
      const docRef = doc(db, 'settings', 'announcement');
      const docSnap = await getDoc(docRef);
      
      let currentPopup: WelcomeAnnouncement = DEFAULT_ANNOUNCEMENT;
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentPopup = {
          title: data.title || DEFAULT_ANNOUNCEMENT.title,
          content: data.content || DEFAULT_ANNOUNCEMENT.content,
          imageUrl: data.imageUrl || DEFAULT_ANNOUNCEMENT.imageUrl,
          enabled: data.enabled !== undefined ? data.enabled : DEFAULT_ANNOUNCEMENT.enabled,
          autoCloseDuration: data.autoCloseDuration !== undefined ? Number(data.autoCloseDuration) : DEFAULT_ANNOUNCEMENT.autoCloseDuration,
          views: data.views || 0,
          dismissals: data.dismissals || 0
        };
      } else {
        // If it doesn't exist, we can't create it here (visitors may not have access)
        // Set document fallback
        currentPopup = DEFAULT_ANNOUNCEMENT;
      }

      setAnnouncement(currentPopup);

      if (!currentPopup.enabled) {
        return;
      }

      // Check localStorage for 24 hours constraint
      const lastShown = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (!lastShown || now - Number(lastShown) > twentyFourHours) {
        // Show popup
        setIsVisible(true);
        setCountdown(currentPopup.autoCloseDuration);

        // Record show view count in Firestore (fire-and-forget, handle error gracefully)
        if (docSnap.exists()) {
          updateDoc(docRef, {
            views: increment(1)
          }).catch(err => {
            const isOfflineErr = err?.message?.toLowerCase().includes("offline") || 
                                 err?.message?.toLowerCase().includes("network") || 
                                 err?.code === "unavailable" ||
                                 (typeof navigator !== 'undefined' && !navigator.onLine);
            if (!isOfflineErr) {
              console.error("Could not write popup views stat:", err);
            }
          });
        }

        // Start countdown
        startCountdownTimer(currentPopup.autoCloseDuration);
      }
    } catch (e: any) {
      const isOfflineErr = e?.message?.toLowerCase().includes("offline") || 
                           e?.message?.toLowerCase().includes("network") || 
                           e?.code === "unavailable" ||
                           (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isOfflineErr) {
        console.info("Information: App running offline or settings document unavailable. Using local fallback for welcome announcement.");
      } else {
        console.error("Error fetching welcome announcement settings:", e);
      }
      // Fallback on error to default local state
      setAnnouncement(DEFAULT_ANNOUNCEMENT);
    }
  };

  const startCountdownTimer = (duration: number) => {
    clearTimers();

    let tempCount = duration;
    countdownIntervalRef.current = setInterval(() => {
      tempCount -= 1;
      setCountdown(tempCount);
      if (tempCount <= 0) {
        clearInterval(countdownIntervalRef.current!);
      }
    }, 1000);

    autoCloseTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration * 1000);
  };

  const handleDismiss = async () => {
    if (!isVisible) return;
    setIsVisible(false);
    clearTimers();
    
    // Set last shown timestamp
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    // Record dismissal stat in Firestore (fireandforget)
    try {
      const docRef = doc(db, 'settings', 'announcement');
      await updateDoc(docRef, {
        dismissals: increment(1)
      });
    } catch (err) {
      // Ignore gracefully (visitor might be offline or settings doc has permission rules)
      console.warn("Could not save dismissal stats to database.", err);
    }
  };

  // Close when ESC is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible || !announcement) return null;

  return (
    <AnimatePresence>
      <div 
        id="welcome_announcement_overlay"
        className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      >
        {/* Click outside to close */}
        <div 
          className="absolute inset-0 z-0 bg-transparent cursor-pointer" 
          onClick={handleDismiss} 
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg md:max-w-2xl bg-slate-900/95 border border-slate-800/80 rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)] backdrop-blur-xl flex flex-col md:max-h-[90vh]"
        >
          {/* Close (X) button */}
          <button 
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-orange-600 rounded-full border border-slate-800 hover:border-orange-500 transition-all shadow-md cursor-pointer"
            aria-label="Fermer l'annonce"
            id="welcome_announcement_close_btn"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Large Hero Image Area at top */}
          <div className="relative h-44 sm:h-56 w-full overflow-hidden shrink-0">
            <img 
              src={announcement.imageUrl} 
              alt="Welcome Station Announcement" 
              className="w-full h-full object-cover select-none" 
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
            
            {/* Elegant station branding overlay */}
            <div className="absolute bottom-4 left-6 flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-orange-600 shadow-md">
                <Radio className="w-6 h-6 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-orange-500 tracking-wider uppercase">Sismique FM Live</span>
                <h4 className="text-sm font-black text-white leading-none uppercase">L'Écho Des Ondes</h4>
              </div>
            </div>

            {/* Live Indicator wave */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse select-none">
              <Wifi className="w-2.5 h-2.5 animate-bounce" />
              <span>Annonce Spéciale</span>
            </div>
          </div>

          {/* Scrolling Announcement content area */}
          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-grow select-text">
            {/* Countdown bar indicator */}
            <div className="w-full bg-slate-950/80 rounded-full h-1.5 relative overflow-hidden mb-6 border border-slate-800">
              <motion.div 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: announcement.autoCloseDuration, ease: "linear" }}
              />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase mb-6 tracking-wide text-center">
              {announcement.title}
            </h2>

            {/* Rich announcement text blocks with beautiful formatting */}
            <div className="text-slate-300 text-sm leading-relaxed space-y-4 font-sans font-medium whitespace-pre-line bg-slate-950/40 p-5 rounded-2xl border border-slate-800/40">
              {announcement.content}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-6 border-t border-slate-800/60 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            {/* Realtime Countdown Text */}
            <div className="text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 order-2 sm:order-none">
              <Volume2 className="w-3.5 h-3.5 text-orange-500/80 animate-ping" />
              <span>Fermeture dans <span className="text-orange-500 font-black font-mono text-sm">{countdown}</span>s</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition duration-350 cursor-pointer text-center"
                id="welcome_announcement_passer_btn"
              >
                Passer cette annonce
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 font-extrabold text-xs uppercase tracking-widest text-white px-6 py-3.5 rounded-xl transition duration-350 shadow-lg hover:shadow-orange-700/20 active:scale-95 cursor-pointer"
                id="welcome_announcement_continuer_btn"
              >
                <span>Continuer vers le site</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WelcomeAnnouncementPopup;
