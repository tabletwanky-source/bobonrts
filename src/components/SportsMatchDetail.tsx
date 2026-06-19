import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, MapPin, User, Calendar, Clock, Award, Shield } from 'lucide-react';
import { sportsService } from '../services/sportsService';

interface SportsMatchDetailProps {
  matchId: number;
  onBack: () => void;
}

export const SportsMatchDetail: React.FC<SportsMatchDetailProps> = ({ matchId, onBack }) => {
  const [matchData, setMatchData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchDetail = async () => {
      try {
        setLoading(true);
        setErrorLocal(null);

        const data = await sportsService.getMatchDetail(matchId);
        setMatchData(data);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to load match detail:", err);
        if (err.code === 'API_KEY_MISSING') {
          setErrorLocal("Configuration de l'API sportive requise.");
        } else {
          setErrorLocal("Données sportives temporairement indisponibles.");
        }
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchDetail();
    }
  }, [matchId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-400 font-bold text-xs">Extraction de l'historique et des statistiques Fédérales...</p>
      </div>
    );
  }

  if (errorLocal || !matchData) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center max-w-md mx-auto space-y-4 shadow-xl">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-slate-200">{errorLocal || "Impossible de charger le match."}</p>
        <button 
          onClick={onBack}
          className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs px-5 py-2 rounded-xl uppercase transition-all"
        >
          Retour au calendrier
        </button>
      </div>
    );
  }

  const match = matchData; // football-data v4 /v4/matches/{id} returns the match object directly on the root of response
  const kickoff = new Date(match.utcDate);

  // Parse Referee
  const refereeNames = match.referees && match.referees.length > 0 
    ? match.referees.map((r: any) => r.name).join(', ') 
    : 'Officiel non désigné';

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      {/* 1. Nav Back */}
      <button 
        onClick={onBack}
        className="text-slate-400 hover:text-white flex items-center space-x-2 text-xs font-black uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux rencontres</span>
      </button>

      {/* 2. Headline card */}
      <div className="bg-slate-900 border border-slate-805 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Flag header */}
        <div className="flex justify-between items-center text-[11px] text-slate-405 font-bold uppercase border-b border-slate-850 pb-4">
          <span className="bg-slate-950 border border-slate-800 text-slate-400 font-mono px-3 py-1 rounded-md">
            {match.competition?.name}
          </span>
          <span className="text-orange-400">
            {match.stage ? `${match.stage?.replace(/_/g, " ")}` : 'Saison régulière'}
          </span>
        </div>

        {/* Major Versus Display */}
        <div className="grid grid-cols-12 gap-4 items-center py-6">
          {/* Home team */}
          <div className="col-span-4 flex flex-col items-center text-center space-y-3">
            <img 
              src={match.homeTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + match.homeTeam?.name} 
              alt="" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain hover:scale-105 transition-transform"
              onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + match.homeTeam?.name }}
            />
            <span className="text-white text-xs md:text-sm font-black uppercase tracking-tight leading-snug">
              {match.homeTeam?.name}
            </span>
          </div>

          {/* Versus Center */}
          <div className="col-span-4 flex flex-col items-center justify-center space-y-2">
            {match.status === 'FINISHED' ? (
              <div className="flex items-center space-x-3 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 font-mono font-black text-2xl md:text-3xl text-orange-500 shadow-inner">
                <span>{match.score?.fullTime?.home}</span>
                <span className="text-slate-700 text-sm">:</span>
                <span>{match.score?.fullTime?.away}</span>
              </div>
            ) : match.status === 'LIVE' || match.status === 'IN_PLAY' ? (
              <div className="flex flex-col items-center space-y-1">
                <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest">LIVE</span>
                <div className="flex items-center space-x-3 bg-slate-950 px-5 py-3 rounded-2xl border border-red-500/20 font-mono font-black text-2xl md:text-3xl text-red-500 shadow-inner">
                  <span>{match.score?.fullTime?.home ?? 0}</span>
                  <span className="text-slate-700 text-sm">:</span>
                  <span>{match.score?.fullTime?.away ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-[11px] font-black text-slate-400 font-mono text-center">
                PLANIFIÉ
              </div>
            )}
            <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">VS</span>
          </div>

          {/* Away team */}
          <div className="col-span-4 flex flex-col items-center text-center space-y-3">
            <img 
              src={match.awayTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + match.awayTeam?.name} 
              alt="" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain hover:scale-105 transition-transform"
              onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + match.awayTeam?.name }}
            />
            <span className="text-white text-xs md:text-sm font-black uppercase tracking-tight leading-snug">
              {match.awayTeam?.name}
            </span>
          </div>
        </div>

        {/* 3. Detailed Stats / Venue breakdown */}
        <div className="border-t border-slate-850 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-350">
          
          <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Spécificités du Match</p>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Date: {kickoff.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Heure: {kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">Stade: {match.venue || 'Terrain non spécifié'}</span>
            </div>
          </div>

          <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Arbitrage & Mi-Temps</p>
            
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">Arbitre: {refereeNames}</span>
            </div>

            {match.score?.halfTime && (
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Score Mi-temps: {match.score.halfTime.home ?? 0} à {match.score.halfTime.away ?? 0}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Status Fédéral: <span className="text-orange-500 font-bold uppercase">{match.status}</span></span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SportsMatchDetail;
