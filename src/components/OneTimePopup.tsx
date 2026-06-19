
import React, { useState, useEffect } from 'react';

const OneTimePopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const POPUP_STORAGE_KEY = 'sismique_popup_shown_v1';
  const REDIRECT_URL = 'https://play.google.com/store/apps/details?id=radio.televisionsismique6';
  const IMAGE_URL = 'https://i.postimg.cc/W3WTRXxz/popopup-Reminder-Instagram-Story.png';

  useEffect(() => {
    // Check if the user has already seen the popup
    const hasSeenPopup = localStorage.getItem(POPUP_STORAGE_KEY);
    
    if (!hasSeenPopup) {
      // Small delay for better UX before showing the popup
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);

      // Auto-close after 15 seconds
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 16500); // 1.5s delay + 15s display

      return () => {
        clearTimeout(timer);
        clearTimeout(autoCloseTimer);
      };
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(POPUP_STORAGE_KEY, 'true');
  };

  const handleImageClick = () => {
    window.open(REDIRECT_URL, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup Container */}
      <div className="relative max-w-sm md:max-w-md w-full transform transition-all duration-500 scale-100 opacity-100 flex flex-col items-center">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute -top-12 right-0 md:-right-12 text-white bg-white/10 hover:bg-orange-600 p-2 rounded-full transition-all focus:outline-none"
          aria-label="Close popup"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Clickable Image */}
        <div 
          onClick={handleImageClick}
          className="relative cursor-pointer group rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.3)] ring-4 ring-white/5 transition-transform hover:scale-[1.02]"
        >
          <img 
            src={IMAGE_URL} 
            alt="Promotion Sismique" 
            className="w-full h-auto object-contain max-h-[70vh] md:max-h-[80vh]"
          />
          
          {/* Subtle Hover Effect */}
          <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/10 transition-colors pointer-events-none" />
          
          {/* CTA Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] text-white/80 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Cliquez pour en savoir plus
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneTimePopup;
