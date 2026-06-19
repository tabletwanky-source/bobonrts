import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  HelpCircle, 
  RefreshCw, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  Shield,
  Search
} from 'lucide-react';
import { sportsService } from '../services/sportsService';

interface SportsStandingsProps {
  onBack: () => void;
  initialCompetition?: string;
}

const LEAGUES = [
  { code: 'PL', name: 'Premier League (Angleterre)', icon: '🇬🇧' },
  { code: 'PD', name: 'La Liga (Espagne)', icon: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga (Allemagne)', icon: '🇩🇪' },
  { code: 'SA', name: 'Serie A (Italie)', icon: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1 (France)', icon: '🇫🇷' },
  { code: 'DED', name: 'Eredivisie (Pays-Bas)', icon: '🇳🇱' },
  { code: 'PPL', name: 'Primeira Liga (Portugal)', icon: '🇵🇹' },
  { code: 'BSA', name: 'Brasileirão Série A (Brésil)', icon: '🇧🇷' }
];

export const SportsStandings: React.FC<SportsStandingsProps> = ({ onBack, initialCompetition = 'PL' }) => {
  const [competition, setCompetition] = useState<string>(initialCompetition || 'PL');
  const [standings, setStandings] = useState<any[]>([]);
  const [season, setSeason] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandingsData = async () => {
      try {
        setLoading(true);
        setErrorLocal(null);

        const data = await sportsService.getStandings(competition);
        const firstStandings = data.standings?.[0]?.table || [];
        setStandings(firstStandings);
        setSeason(data.season?.currentMatchday || 0);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to load standings for", competition, err);
        if (err.code === 'API_KEY_MISSING') {
          setErrorLocal("Configuration de l'API sportive requise.");
        } else {
          setErrorLocal("Données sportives temporairement indisponibles.");
        }
        setLoading(false);
      }
    };

    fetchStandingsData();
  }, [competition]);

  return (
    <div className="space-y-6">
      {/* Header filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-950/60 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Tableaux de Classements</h2>
            <p className="text-slate-400 text-xs font-semibold">Classements généraux et de poule mis à jour de nos sources officielles.</p>
          </div>
        </div>

        {/* Change Tournament dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-slate-400 text-xs font-black uppercase tracking-wider hidden sm:inline">Tournoi:</span>
          <select 
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl focus:outline-none focus:border-orange-500"
          >
            {LEAGUES.map((l) => (
              <option key={l.code} value={l.code}>{l.icon} {l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {errorLocal && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-300 flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="font-semibold text-sm">{errorLocal}</p>
          <p className="text-xs text-rose-400">Ce championnat n'a pas pu être extrait de l'API (clé libre peut rejeter certains codes). Aucun jeu fictif n'est injecté.</p>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-xs">Extraction des scores et rangs officiels...</p>
        </div>
      ) : standings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-10 text-center max-w-sm mx-auto">
          <p className="font-bold text-slate-300">Aucune donnée disponible</p>
          <p className="text-xs text-slate-500 mt-1">Le classement de cette compétition n'est pas accessible actuellement.</p>
        </div>
      ) : (
        <div className="bg-slate-905 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/40 border-b border-slate-850 flex justify-between items-center text-xs font-bold text-slate-400">
            <span className="flex items-center space-x-1.5 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-orange-500" />
              <span>Tableau de la Saison En Cours</span>
            </span>
            {season > 0 && <span className="bg-slate-950 text-orange-400 border border-slate-800 px-2 py-0.5 rounded text-[10px]">Journée {season}</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px] text-xs">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 select-none uppercase font-black text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">Pos</th>
                  <th className="py-3.5 px-4">Équipe</th>
                  <th className="py-3.5 px-3 text-center w-14">MJ</th>
                  <th className="py-3.5 px-3 text-center w-12">G</th>
                  <th className="py-3.5 px-3 text-center w-12">N</th>
                  <th className="py-3.5 px-3 text-center w-12">P</th>
                  <th className="py-3.5 px-3 text-center w-16">BUTS (M-P)</th>
                  <th className="py-3.5 px-3 text-center w-14">Diff</th>
                  <th className="py-3.5 px-4 text-center w-16 bg-orange-600/5 text-orange-500 font-black">PTS</th>
                  <th className="py-3.5 px-4 w-32 hidden md:table-cell">Forme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-950">
                {standings.map((team: any, idx: number) => {
                  const formList = team.form ? team.form.split(',') : [];
                  const isTopFour = team.position <= 4;
                  const isRelegation = team.position >= standings.length - 2;

                  return (
                    <tr 
                      key={team.team?.id || idx}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-mono select-none">
                        <span className={`inline-block w-6 py-0.5 rounded text-xs font-black ${
                          isTopFour 
                            ? 'bg-blue-600/10 text-blue-400' 
                            : isRelegation 
                              ? 'bg-red-650/10 text-red-500' 
                              : 'text-slate-400'
                        }`}>
                          {team.position}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        <div className="flex items-center space-x-2.5">
                          <img 
                            src={team.team?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + team.team?.name} 
                            alt="" 
                            className="w-5 h-5 object-contain"
                            onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + team.team?.name }}
                          />
                          <span className="truncate max-w-[160px] md:max-w-xs">{team.team?.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-300 font-semibold font-mono">{team.playedGames}</td>
                      <td className="py-3.5 px-3 text-center text-slate-350 font-mono">{team.won}</td>
                      <td className="py-3.5 px-3 text-center text-slate-350 font-mono">{team.draw}</td>
                      <td className="py-3.5 px-3 text-center text-slate-350 font-mono">{team.lost}</td>
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono">{team.goalsFor}:{team.goalsAgainst}</td>
                      
                      <td className={`py-3.5 px-3 text-center font-black font-mono ${
                        team.goalDifference > 0 ? 'text-emerald-500' : team.goalDifference < 0 ? 'text-red-500' : 'text-slate-500'
                      }`}>
                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                      </td>

                      <td className="py-3.5 px-4 text-center font-black font-mono text-white bg-orange-600/10 text-sm">{team.points}</td>
                      
                      {/* Form (W,D,L) */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex items-center space-x-1">
                          {formList.slice(0, 5).map((char: string, formIdx: number) => {
                            let bulletColor = 'bg-slate-700 text-slate-300';
                            if (char === 'W') bulletColor = 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20';
                            if (char === 'D') bulletColor = 'bg-amber-600/20 text-amber-500 border border-amber-500/20';
                            if (char === 'L') bulletColor = 'bg-red-650/20 text-red-500 border border-red-500/20';

                            return (
                              <span 
                                key={formIdx} 
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[9px] ${bulletColor}`}
                              >
                                {char}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-850 flex flex-wrap gap-4 text-[10px] text-slate-500 font-bold uppercase select-none">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-1.5 rounded bg-blue-500/20 border border-blue-500/30"></span>
              <span>Qualification CL</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-1.5 rounded bg-red-650/25 border border-red-500/30"></span>
              <span>Zone relégation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsStandings;
