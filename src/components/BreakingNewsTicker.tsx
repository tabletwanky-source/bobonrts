import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { BreakingNewsAlert } from '../types';
import { ShieldAlert, ChevronRight, X, ExternalLink } from 'lucide-react';

const BreakingNewsTicker: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<BreakingNewsAlert[]>([]);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const alertsRef = collection(db, 'breaking_news');
    const unsubscribe = onSnapshot(alertsRef, (snapshot) => {
      const list: BreakingNewsAlert[] = [];
      const now = new Date();
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isActive) {
          // Parse expiration
          let expDate = null;
          if (data.expiresAt) {
            if (data.expiresAt.toDate) {
              expDate = data.expiresAt.toDate();
            } else {
              expDate = new Date(data.expiresAt);
            }
          }
          
          // Only show if not expired
          if (!expDate || expDate > now) {
            list.push({
              id: docSnap.id,
              title: data.title || '🚨 DERNIÈRE MINUTE',
              message: data.message || '',
              link: data.link || '',
              priority: data.priority || 'high',
              isActive: true,
              isPinned: data.isPinned ?? false,
              createdAt: data.createdAt,
              expiresAt: expDate
            });
          }
        }
      });
      
      // Sort: pinned first, then priority (high, medium, low)
      list.sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        const priorityScore = (p: string) => p === 'high' ? 3 : (p === 'medium' ? 2 : 1);
        return priorityScore(b.priority) - priorityScore(a.priority);
      });

      setActiveAlerts(list);
      // Reset close state when new alerts are fetched or pushed
      if (list.length > 0) {
        setClosed(false);
      }
    }, (error) => {
      console.error("Firestore listening breaking news failed on client:", error);
    });

    return () => unsubscribe();
  }, []);

  if (closed || activeAlerts.length === 0) return null;

  // Render combined alert message
  return (
    <div 
      className="bg-red-600 border-b border-red-700 text-white relative py-2.5 px-4 overflow-hidden z-40 shadow-lg animate-fade-in flex items-center justify-between"
      id="breaking-news-top-banner"
    >
      {/* Background glow effects */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-red-600 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-red-600 to-transparent pointer-events-none z-10" />

      {/* Main Container */}
      <div className="container mx-auto max-w-7xl flex items-center gap-3 w-full pr-8">
        {/* Urgent Label Badge */}
        <div className="relative z-20 flex items-center select-none bg-black text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider space-x-1 border border-red-500/35 shrink-0 shadow-sm animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          <span>DIRECT INFO</span>
        </div>

        {/* Scrolling Ticker Line */}
        <div className="flex-grow overflow-hidden relative h-5 flex items-center select-none font-medium text-xs">
          <div className="flex items-center space-x-12 whitespace-nowrap animate-marquee">
            {activeAlerts.map((alert, i) => (
              <span key={alert.id} className="flex items-center gap-2">
                <span className="font-extrabold text-black bg-white/90 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-red-700">
                  {alert.title}
                </span>
                <span className="font-bold tracking-tight text-white hover:underline cursor-default">
                  {alert.message}
                </span>
                {alert.link && (
                  <a 
                    href={alert.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-yellow-300 hover:text-white inline-flex items-center gap-1 font-bold ml-1 hover:underline"
                  >
                    <span>En savoir plus</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {i < activeAlerts.length - 1 && (
                  <span className="text-yellow-400 font-extrabold px-2">✦</span>
                )}
              </span>
            ))}
            {/* Repeat the content once to guarantee loop continuity */}
            {activeAlerts.map((alert, i) => (
              <span key={`${alert.id}-dup`} className="flex items-center gap-2">
                <span className="font-extrabold text-black bg-white/90 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-red-700">
                  {alert.title}
                </span>
                <span className="font-bold tracking-tight text-white">
                  {alert.message}
                </span>
                {alert.link && (
                  <a 
                    href={alert.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-yellow-300 hover:text-white inline-flex items-center gap-1 font-bold ml-1 hover:underline"
                  >
                    <span>En savoir plus</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {i < activeAlerts.length - 1 && (
                  <span className="text-yellow-400 font-extrabold px-2">✦</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Dismiss button */}
      <button 
        onClick={() => setClosed(true)} 
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-red-100 hover:text-white p-1 rounded-full z-20 transition-transform active:scale-90"
        title="Masquer le flash info"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Styled Marquee style injection safely */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default BreakingNewsTicker;
