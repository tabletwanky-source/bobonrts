
import React, { useState, useRef, useEffect } from 'react';
import { STREAM_URL } from '../constants';
import { useAuth } from '../context/AuthContext';

const RadioPlayer: React.FC = () => {
  const { isStreaming, setIsStreaming } = useAuth();
  const [volume, setVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize audio element state when isStreaming changes globally
  useEffect(() => {
    if (!audioRef.current) return;
    if (isStreaming) {
      audioRef.current.play().catch(e => {
        console.error("Playback failed on mount/update", e);
        // Sync state back to false if the browser blocked autoplay
        setIsStreaming(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isStreaming, setIsStreaming]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isStreaming) {
      audioRef.current.pause();
      setIsStreaming(false);
    } else {
      audioRef.current.play()
        .then(() => setIsStreaming(true))
        .catch(e => {
          console.error("Playback failed on toggle", e);
          setIsStreaming(false);
        });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 flex items-center space-x-4 w-[320px] md:w-[400px]">
        <audio ref={audioRef} src={STREAM_URL} preload="none" />
        
        <button 
          onClick={togglePlay}
          className="w-12 h-12 flex-shrink-0 bg-orange-600 hover:bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
        >
          {isStreaming ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" strokeWidth="2" />
            </svg>
          )}
        </button>

        <div className="flex-grow min-w-0">
          <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">En Direct</p>
          <p className="text-sm font-bold text-white truncate">Radio Sismique FM</p>
          <div className="flex items-center space-x-2 mt-1">
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <input 
              type="range" 
              min="0" max="100" 
              value={volume} 
              onChange={handleVolumeChange}
              className="flex-grow h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>

        {isStreaming && (
          <div className="flex items-end space-x-1 h-8 pr-1">
            <div className="w-1 bg-orange-500 animate-[bounce_1s_infinite]"></div>
            <div className="w-1 bg-orange-400 animate-[bounce_1.2s_infinite]"></div>
            <div className="w-1 bg-orange-600 animate-[bounce_0.8s_infinite]"></div>
            <div className="w-1 bg-orange-500 animate-[bounce_1.1s_infinite]"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadioPlayer;
