import React, { useEffect, useState } from 'react';
import { Radio, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface LoadingScreenProps {
  error?: string | null;
  onRetry?: () => void;
  message?: string;
  onGoBack?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  error = null,
  onRetry,
  message = "Authentification Administration & Chargement...",
  onGoBack,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans p-6 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col items-center space-y-6 max-w-md w-full bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl backdrop-blur-md shadow-2xl relative z-10 text-center">
        {/* Animated Radio Logo Branding */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Radio className={`w-8 h-8 text-white ${!error ? 'animate-pulse' : ''}`} />
          </div>
          {!error && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Radio Télévision Sismique
          </h2>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Module Écoute & Contrôle
          </p>
        </div>

        {!error ? (
          <div className="space-y-4 w-full">
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <p className="text-sm font-medium text-slate-300">
              {message}
            </p>

            <p className="text-xs text-slate-500 font-mono">
              Temps écoulé : {seconds}s / max 5s
            </p>
          </div>
        ) : (
          <div className="space-y-5 w-full">
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start space-x-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Échec de Connexion</p>
                <p className="text-xs text-slate-300 leading-relaxed break-words">
                  {error}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 transition text-white font-medium text-sm rounded-xl shadow-lg shadow-orange-500/20 w-full"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Réessayer</span>
                </button>
              )}
              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 transition text-slate-300 font-medium text-sm rounded-xl border border-slate-700 w-full"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
