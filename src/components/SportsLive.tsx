import React, { useState, useEffect } from 'react';
import { Flame, Clock, RefreshCw, AlertCircle, ArrowLeft, Tv, MapPin } from 'lucide-react';
import { sportsService } from '../services/sportsService';

interface SportsLiveProps {
  onBack: () => void;
  onSelectMatch: (id: number) => void;
}

export const SportsLive: React.FC<SportsLiveProps> = ({ onBack, onSelectMatch }) => {
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60); // 60s countdown
  const [manualReloading, setManualReloading] = useState(false);

  const fetchLiveScores = async () => {
    try {
      setErrorLocal(null);
      const data = await sportsService.getLiveMatches();
      setLiveMatches(data.matches || []);
      setLoading(false);
      setTimeLeft(60); // reset clock
    } catch (err: any) {
      console.error("Failed to load live scores:", err);
      if (err.code === 'API_KEY_MISSING') {
        setErrorLocal("Configuration de l'API sportive requise.");
      } else {
        setErrorLocal("Données sportives temporairement indisponibles.");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveScores();

    // 1. Live Countdown timer
    const clockInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchLiveScores(); // refetch on 0
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const handleManualRefresh = async () => {
    setManualReloading(true);
    await fetchLiveScores();
    setManualReloading(false);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-950/60 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Direct & Live Scores</h2>
            </div>
            <p className="text-slate-400 text-xs font-semibold">Matchs officiels en cours de diffusion de notre réseau radiophonique.</p>
          </div>
        </div>

        {/* Refresh Clock */}
        <div className="flex items-center space-x-4 bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl justify-between md:justify-start">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-slate-350 font-bold text-xs">Mise à jour dans:</span>
            <span className="text-white font-mono font-black text-sm w-6 text-center">{timeLeft}s</span>
          </div>

          <button 
            onClick={handleManualRefresh}
            disabled={manualReloading}
            className="text-slate-400 hover:text-white transition-all hover:rotate-180 duration-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${manualReloading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
        </div>
      </div>

      {errorLocal && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-300 flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
          <p className="font-semibold text-sm">{errorLocal}</p>
          <p className="text-xs text-rose-400">Impossible de joindre le flux de scores officiel. Aucun match factice ne sera affiché.</p>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-xs">Extraction du flux en direct...</p>
        </div>
      ) : liveMatches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800/85 rounded-2xl py-16 px-6 text-center max-w-md mx-auto shadow-xl flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
            <Tv className="w-6 h-6 text-slate-500" />
          </div>
          <div className="space-y-1">
            <p className="font-black text-white uppercase tracking-tight text-sm">Aucun match en cours de diffusion</p>
            <p className="text-xs text-slate-500">Il n'y a pas de rencontres de football en direct actuellement dans les championnats surveillés.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveMatches.map((m) => (
            <div 
              key={m.id}
              onClick={() => onSelectMatch(m.id)}
              className="bg-slate-900 border border-slate-805 hover:border-orange-500/30 rounded-2xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-orange-500/5 group flex flex-col justify-between"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-850 pb-3 mb-4">
                <span className="truncate max-w-[60%] uppercase text-orange-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {m.competition?.name}
                </span>
                <span className="bg-red-600/10 text-red-500 px-2 py-0.5 rounded-full font-black uppercase text-[9px] tracking-widest animate-pulse">
                  LIVE
                </span>
              </div>

              {/* Major Score Display */}
              <div className="grid grid-cols-12 gap-2 items-center my-3">
                <div className="col-span-10 space-y-3">
                  <div className="flex items-center space-x-3.5">
                    <img 
                      src={m.homeTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + m.homeTeam?.name} 
                      alt="" 
                      className="w-6 h-6 object-contain"
                      onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + m.homeTeam?.name }}
                    />
                    <span className="text-slate-200 text-sm md:text-base font-black group-hover:text-white transition-colors truncate">
                      {m.homeTeam?.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    <img 
                      src={m.awayTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + m.awayTeam?.name} 
                      alt="" 
                      className="w-6 h-6 object-contain"
                      onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + m.awayTeam?.name }}
                    />
                    <span className="text-slate-200 text-sm md:text-base font-black group-hover:text-white transition-colors truncate">
                      {m.awayTeam?.name}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 bg-slate-950 py-3.5 px-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-rose-500 font-black text-sm md:text-base">{m.score?.fullTime?.home ?? 0}</span>
                  <span className="text-[10px] text-slate-600 font-bold my-0.5">-</span>
                  <span className="text-rose-500 font-black text-sm md:text-base">{m.score?.fullTime?.away ?? 0}</span>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-bold font-mono">
                <div className="flex items-center space-x-1">
                  <span>⏱️ Minute:</span>
                  <span className="text-rose-500 font-bold">{m.minute ? `${m.minute}'` : 'En cours'}</span>
                </div>
                {m.venue && (
                  <span className="truncate max-w-[50%] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {m.venue}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SportsLive;
