import React, { useState, useEffect } from 'react';
import { Calendar, HelpCircle, RefreshCw, AlertCircle, Shield, ArrowLeft, Search } from 'lucide-react';
import { sportsService } from '../services/sportsService';

interface SportsMatchesProps {
  onBack: () => void;
  onSelectMatch: (id: number) => void;
  initialCompetition?: string;
}

const COMPETITIONS = [
  { code: 'PL', name: 'Premier League (Angleterre)', icon: '🇬🇧' },
  { code: 'PD', name: 'La Liga (Espagne)', icon: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga (Allemagne)', icon: '🇩🇪' },
  { code: 'SA', name: 'Serie A (Italie)', icon: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1 (France)', icon: '🇫🇷' },
  { code: 'CL', name: 'UEFA Champions League', icon: '🏆' },
  { code: 'WC', name: 'FIFA World Cup (Mondiale)', icon: '🌍' }
];

export const SportsMatches: React.FC<SportsMatchesProps> = ({ onBack, onSelectMatch, initialCompetition = '' }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [competition, setCompetition] = useState<string>(initialCompetition);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, LIVE, SCHEDULED, FINISHED
  const [loading, setLoading] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchesData = async () => {
      try {
        setLoading(true);
        setErrorLocal(null);

        const data = await sportsService.getMatches(competition);
        setMatches(data.matches || []);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to load matches:", err);
        if (err.code === 'API_KEY_MISSING') {
          setErrorLocal("Configuration de l'API sportive requise.");
        } else {
          setErrorLocal("Données sportives temporairement indisponibles.");
        }
        setLoading(false);
      }
    };

    fetchMatchesData();
  }, [competition]);

  // Client side status filtering
  const filteredMatches = matches.filter((match) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'LIVE') return match.status === 'LIVE' || match.status === 'IN_PLAY';
    if (statusFilter === 'SCHEDULED') return match.status === 'SCHEDULED' || match.status === 'TIMED';
    if (statusFilter === 'FINISHED') return match.status === 'FINISHED';
    if (statusFilter === 'POSTPONED') return match.status === 'POSTPONED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-950/60 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Calendrier & Résultats</h2>
            <p className="text-slate-400 text-xs font-semibold">Consultez l'historique complet des rencontres sportives officielles.</p>
          </div>
        </div>

        {/* Competition Dropdown & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="">Toutes Championnats</option>
            {COMPETITIONS.map((c) => (
              <option key={c.code} value={c.code}>{c.icon} {c.name}</option>
            ))}
          </select>

          <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl">
            {[
              { label: 'Tous', value: 'all' },
              { label: '🔴 Direct', value: 'LIVE' },
              { label: '⏰ À Venir', value: 'SCHEDULED' },
              { label: '✅ Terminés', value: 'FINISHED' },
              { label: '❌ Reportés', value: 'POSTPONED' }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                  statusFilter === btn.value 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorLocal && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-300 flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="font-semibold text-sm">{errorLocal}</p>
          <p className="text-xs text-rose-400">Impossible de charger les rencontres de football. L'API est injoignable.</p>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-xs">Extraction des fiches officielles...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl py-12 px-6 text-center text-slate-400 max-w-lg mx-auto shadow-md">
          <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="font-bold text-sm text-slate-200">Aucun résultat trouvé</p>
          <p className="text-xs text-slate-500 mt-1">Aucune rencontre correspondante n'est répertoriée pour cette catégorie de filtre.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Matches grouping by Day */}
          {Object.entries(groupByDay(filteredMatches)).map(([day, dayMatches]: [string, any]) => {
            const dateObj = new Date(day);
            const formattedDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            
            return (
              <div key={day} className="space-y-3">
                <h3 className="font-black text-xs text-orange-500 uppercase tracking-widest pl-2 pt-2 border-l-2 border-orange-500">
                  {formattedDate}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dayMatches.map((m: any) => {
                    const statusName = parseStatusLabel(m.status);
                    return (
                      <div 
                        key={m.id}
                        onClick={() => onSelectMatch(m.id)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all shadow-md hover:shadow-lg flex flex-col justify-between cursor-pointer group"
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-850 pb-2 mb-3">
                          <span className="truncate max-w-[60%] uppercase">{m.competition?.name}</span>
                          <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[9px] tracking-wider ${statusName.style}`}>
                            {statusName.text}
                          </span>
                        </div>

                        <div className="space-y-3 flex-grow py-1">
                          {/* Home team */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3.5">
                              <img 
                                src={m.homeTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + m.homeTeam?.name} 
                                alt="" 
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + m.homeTeam?.name }}
                              />
                              <span className="text-slate-200 text-sm font-bold group-hover:text-white transition-colors truncate max-w-[180px]">
                                {m.homeTeam?.name}
                              </span>
                            </div>
                            {m.status === 'FINISHED' && (
                              <span className="text-slate-200 font-mono font-black text-sm pr-1">
                                {m.score?.fullTime?.home}
                              </span>
                            )}
                          </div>

                          {/* Away team */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3.5">
                              <img 
                                src={m.awayTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + m.awayTeam?.name} 
                                alt="" 
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + m.awayTeam?.name }}
                              />
                              <span className="text-slate-200 text-sm font-bold group-hover:text-white transition-colors truncate max-w-[180px]">
                                {m.awayTeam?.name}
                              </span>
                            </div>
                            {m.status === 'FINISHED' && (
                              <span className="text-slate-200 font-mono font-black text-sm pr-1">
                                {m.score?.fullTime?.away}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-850 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>Kickoff: {new Date(m.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {m.venue && (
                            <span className="max-w-[50%] truncate">🏟️ {m.venue}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Group matches by ISO Days
function groupByDay(arr: any[]) {
  return arr.reduce((acc: any, item: any) => {
    const day = item.utcDate.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});
}

// Map football-data statuses to beautiful badges
function parseStatusLabel(status: string) {
  switch (status) {
    case 'LIVE':
    case 'IN_PLAY':
      return { text: '🔴 LIVE', style: 'bg-red-600/10 text-red-500' };
    case 'SCHEDULED':
    case 'TIMED':
      return { text: '⏰ PLANIFIÉ', style: 'bg-blue-600/10 text-blue-400' };
    case 'FINISHED':
      return { text: '✅ TERMINÉ', style: 'bg-emerald-600/10 text-emerald-400' };
    case 'POSTPONED':
      return { text: '❌ REPORTÉ', style: 'bg-amber-600/10 text-amber-500' };
    default:
      return { text: status, style: 'bg-slate-700/10 text-slate-400' };
  }
}

export default SportsMatches;
