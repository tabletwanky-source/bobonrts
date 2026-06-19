import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Award, Crown, Check } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'achievement' | 'badge';
  title: string;
  subtitle: string;
  points?: number;
  icon: string;
  badgeColor?: string;
  bgColor?: string;
}

const GamificationNotifyPopup: React.FC = () => {
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const handleUnlock = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, item } = customEvent.detail;
      
      const newNotif: NotificationItem = {
        id: Math.random().toString(),
        type,
        title: type === 'achievement' ? item.title : item.name,
        subtitle: type === 'achievement' ? item.description : 'Félicitations, vous êtes monté de grade !',
        points: type === 'achievement' ? item.pointsAwarded : undefined,
        icon: item.icon || '🏆',
        badgeColor: item.color || 'text-orange-500',
        bgColor: item.bgColor || 'bg-orange-500/10'
      };

      // Set active (showing one at a time for maximum aesthetic priority)
      setActiveNotification(newNotif);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActiveNotification((prev) => (prev?.id === newNotif.id ? null : prev));
      }, 6000);
    };

    window.addEventListener('gamification_unlock', handleUnlock);
    return () => {
      window.removeEventListener('gamification_unlock', handleUnlock);
    };
  }, []);

  return (
    <AnimatePresence>
      {activeNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5, type: 'spring', damping: 15 }}
          className="fixed bottom-24 left-4 md:left-8 z-50 max-w-sm w-full pointer-events-auto"
        >
          <div className="bg-slate-900/95 border-2 border-orange-500/80 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(249,115,22,0.3)] backdrop-blur-xl relative overflow-hidden">
            {/* Sparkling animations inside */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-600/20 text-orange-500 flex items-center justify-center text-3xl shrink-0 shadow-lg border border-orange-500/40 relative">
                <span className="relative z-10">{activeNotification.icon}</span>
                <span className="absolute inset-x-0 bottom-0 h-1 bg-orange-500 rounded-b-2xl" />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center space-x-1.5 text-xs text-orange-400 font-extrabold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                  <span>
                    {activeNotification.type === 'achievement' ? 'Défi accompli !' : 'Nouveau Grade !'}
                  </span>
                </div>
                
                <h4 className="text-lg font-black text-white mt-1 leading-tight tracking-tight">
                  {activeNotification.title}
                </h4>
                
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">
                  {activeNotification.subtitle}
                </p>

                {activeNotification.points && (
                  <div className="inline-flex items-center space-x-1 bg-yellow-500/10 text-yellow-500 rounded-lg px-2.5 py-1 mt-3 border border-yellow-500/20">
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">+{activeNotification.points} pts bonus</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveNotification(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 font-bold text-sm bg-slate-950/60 p-1 rounded-full border border-slate-800/80 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GamificationNotifyPopup;
