import React from 'react';
import { Trophy, ArrowLeft, ChevronRight, Award, Shield } from 'lucide-react';

interface SportsCompetitionsProps {
  onBack: () => void;
  onSelectCompetition: (code: string) => void;
}

const ALL_COMPETITIONS = [
  { code: 'PL', name: 'Premier League', location: 'Angleterre 🇬🇧', type: 'Championnat', icon: '🏆', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300' },
  { code: 'PD', name: 'La Liga (Primera Division)', location: 'Espagne 🇪🇸', type: 'Championnat', icon: '⚽', logo: 'https://images.unsplash.com/photo-1540747737956-3787217a9602?auto=format&fit=crop&q=80&w=300' },
  { code: 'BL1', name: 'Bundesliga', location: 'Allemagne 🇩🇪', type: 'Championnat', icon: '🛡️', logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=300' },
  { code: 'SA', name: 'Serie A', location: 'Italie 🇮🇹', type: 'Championnat', icon: '🇮🇹', logo: 'https://images.unsplash.com/photo-1431324155629-1a6edd1dec1d?auto=format&fit=crop&q=80&w=300' },
  { code: 'FL1', name: 'Ligue 1', location: 'France 🇫🇷', type: 'Championnat', icon: '🥖', logo: 'https://images.unsplash.com/photo-1489945052260-4f21d52268b9?auto=format&fit=crop&q=80&w=300' },
  { code: 'CL', name: 'UEFA Champions League', location: 'Europe 🇪🇺', type: 'Coupe Continentale', icon: '🌟', logo: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=300' },
  { code: 'WC', name: 'FIFA World Cup (Coupe du Monde)', location: 'Mondiale 🌍', type: 'Coupe Internationale', icon: '🌍', logo: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=300' },
  { code: 'DED', name: 'Eredivisie', location: 'Pays-Bas 🇳🇱', type: 'Championnat', icon: '🌷', logo: 'https://images.unsplash.com/photo-1517524008436-441d67b3084b?auto=format&fit=crop&q=80&w=300' },
  { code: 'PPL', name: 'Primeira Liga', location: 'Portugal 🇵🇹', type: 'Championnat', icon: '🍇', logo: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=300' },
  { code: 'BSA', name: 'Campeonato Brasileiro Série A', location: 'Brésil 🇧🇷', type: 'Championnat', icon: '🌴', logo: 'https://images.unsplash.com/photo-1459865264687-595d652db67e?auto=format&fit=crop&q=80&w=300' },
];

export const SportsCompetitions: React.FC<SportsCompetitionsProps> = ({ onBack, onSelectCompetition }) => {
  return (
    <div className="space-y-6">
      {/* Header filter */}
      <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <button 
          onClick={onBack}
          className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-950/60 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Liste des Championnats</h2>
          <p className="text-slate-400 text-xs font-semibold">Consultez en temps réel les données issues de la fédération de football.</p>
        </div>
      </div>

      {/* Grid of campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALL_COMPETITIONS.map((c) => (
          <div 
            key={c.code}
            className="flex flex-col bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl hover:border-slate-705 group transition-all"
          >
            {/* Background image preview cover */}
            <div 
              className="h-32 bg-cover bg-center relative p-4 flex flex-col justify-end"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%), url("${c.logo}")`
              }}
            >
              <div className="flex items-center justify-between">
                <span className="bg-orange-600 border border-orange-500 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                  Code: {c.code}
                </span>
                <span className="text-2xl">{c.icon}</span>
              </div>
            </div>

            <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
              <div className="space-y-1">
                <h3 className="text-white font-black text-base group-hover:text-orange-500 transition-colors">{c.name}</h3>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                  <span>📍 {c.location}</span>
                  <span className="text-slate-650">•</span>
                  <span>🏆 {c.type}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                <button
                  onClick={() => onSelectCompetition(c.code)}
                  className="bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white py-2 px-3 rounded-lg text-xs font-bold transition-all text-center"
                >
                  Classement
                </button>
                <button
                  onClick={() => onSelectCompetition(c.code)} // navigate to matches filtered on competition
                  className="bg-orange-600 hover:bg-orange-500 text-white py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all text-center flex items-center justify-center space-x-1 shadow-lg shadow-orange-600/15"
                >
                  <span>Calendrier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SportsCompetitions;
