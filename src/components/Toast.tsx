import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
        };
      case 'error':
        return {
          bg: 'bg-red-950/90 border-red-500/30 text-red-300',
          icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-shake" />
        };
      default:
        return {
          bg: 'bg-blue-950/90 border-blue-500/30 text-blue-300',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed top-24 right-4 z-50 animate-fade-in">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-sm ${style.bg}`}>
        {style.icon}
        <p className="text-xs font-semibold tracking-wide font-sans">{message}</p>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded-full hover:bg-slate-800/40"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
