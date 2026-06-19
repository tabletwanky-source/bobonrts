import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  MapPin, 
  Trophy, 
  Calendar, 
  ChevronRight, 
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { sportsService } from '../services/sportsService';

interface SportsHomeProps {
  onNavigate: (route: string) => void;
  onSelectMatch: (id: number) => void;
}

export const SportsHome: React.FC<SportsHomeProps> = ({ onNavigate, onSelectMatch }) => {
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [errorSports, setErrorSports] = useState<string | null>(null);
  const [haitiMatch, setHaitiMatch] = useState<any | null>(null);

  // Fetch live matches and fixtures from our proxy
  useEffect(() => {
    const fetchHomeSports = async () => {
      try {
        setLoadingLive(true);
        setErrorSports(null);
        
        // 1. Fetch Live scores
        const liveData = await sportsService.getLiveMatches();
        setLiveMatches(liveData.matches || []);
        setLoadingLive(false);

        // 2. Fetch Upcoming matches from proxy
        setLoadingUpcoming(true);
        const upcomingData = await sportsService.getMatches(undefined, 'SCHEDULED');
        // Sort and slice to first 5
        const sorted = (upcomingData.matches || []).slice(0, 5);
        setUpcomingMatches(sorted);
        setLoadingUpcoming(false);
      } catch (err: any) {
        console.error("Failed to load sports homepage data:", err);
        if (err.code === 'API_KEY_MISSING') {
          setErrorSports("Configuration de l'API sportive requise.");
        } else {
          setErrorSports("Données sportives temporairement indisponibles.");
        }
        setLoadingLive(false);
        setLoadingUpcoming(false);
      }
    };

    // 3. Fetch custom sports configuration to get scheduled Haiti match which can be pinned
    const fetchSportsSetup = async () => {
      try {
        const config = await sportsService.getCompetitions();
        // Check if custom Haiti fixtures exist
        if (config && config.customHaitiFixtures && config.customHaitiFixtures.length > 0) {
          // Pick next non-finished Haiti match
          const now = new Date();
          const upcomingHaiti = config.customHaitiFixtures
            .filter((f: any) => new Date(f.utcDate || f.date) > now)
            .sort((a: any, b: any) => new Date(a.utcDate || a.date).getTime() - new Date(b.utcDate || b.date).getTime());
          
          if (upcomingHaiti.length > 0) {
            setHaitiMatch(upcomingHaiti[0]);
          } else {
            setHaitiMatch(config.customHaitiFixtures[config.customHaitiFixtures.length - 1]);
          }
        }
      } catch (e) {
        console.warn("Could not retrieve sports configuration for Haiti widget:", e);
      }
    };

    // 4. Fetch platform general sports news
    const fetchSportsNews = async () => {
      try {
        setLoadingNews(true);
        const newsCol = collection(db, 'articles');
        // Retrieve articles with category 'Sports' or 'sport'
        const qSports1 = query(newsCol, where('category', '==', 'Sports'), limit(3));
        const snap1 = await getDocs(qSports1);
        let list: any[] = [];
        snap1.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        
        if (list.length === 0) {
          // Try lowercase
          const qSports2 = query(newsCol, where('category', '==', 'sport'), limit(3));
          const snap2 = await getDocs(qSports2);
          snap2.forEach((d) => {
            list.push({ id: d.id, ...d.data() });
          });
        }
        setNews(list);
        setLoadingNews(false);
      } catch (err) {
        console.warn("Failed to retrieve local sports news:", err);
        setLoadingNews(false);
      }
    };

    fetchHomeSports();
    fetchSportsSetup();
    fetchSportsNews();
  }, []);

  return (
    <div className="space-y-10">
      {/* 1. Header Hero Banner */}
      <div 
        className="relative rounded-3xl overflow-hidden p-8 md:p-12 border border-slate-800 bg-cover bg-center shadow-2xl flex flex-col justify-between min-h-[300px]"
        style={{
          backgroundImage: 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200")'
        }}
      >
        <div className="absolute top-4 right-4 bg-orange-600/90 text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest animate-pulse shadow-lg flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Centrale de Sport Sismique</span>
        </div>

        <div className="mt-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase leading-none">
            Vivez le Sport en <span className="text-orange-500">Temps Réel</span>
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-xl font-medium">
            Scores en direct, calendriers officiels, tableaux de classement et suivi privilégié de l'équipe nationale d'Haïti de football.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => onNavigate('/sports/live')}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all transform hover:scale-105 shadow-xl shadow-orange-600/20 flex items-center space-x-2"
            >
              <Flame className="w-4 h-4" />
              <span>Matchs en Direct</span>
            </button>
            <button 
              onClick={() => onNavigate('/sports/standings')}
              className="bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all"
            >
              Classements
            </button>
          </div>
        </div>
      </div>

      {errorSports && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-300 flex flex-col items-center justify-center space-y-3 shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="font-semibold">{errorSports}</p>
          <p className="text-xs text-rose-400 max-w-md">L'API de football officielle est inaccessible temporairement. Aucun faux match ne sera généré.</p>
        </div>
      )}

      {/* 2. Grid Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col & Mid Col (Main feeds) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 🔥 LIVE MATCHES SLIDER/TICKER */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-red-500 animate-bounce" />
                <h3 className="font-black text-lg text-white uppercase tracking-tight">Matchs en Direct</h3>
              </div>
              <button 
                onClick={() => onNavigate('/sports/live')}
                className="text-orange-500 hover:text-orange-400 text-xs font-bold flex items-center space-x-1"
              >
                <span>Tout voir</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loadingLive ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                <p className="text-slate-400 text-xs">Mise à jour en direct...</p>
              </div>
            ) : liveMatches.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Aucun match en cours de diffusion en direct pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {liveMatches.slice(0, 3).map((match) => (
                  <div 
                    key={match.id}
                    onClick={() => onSelectMatch(match.id)}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-orange-500/30 cursor-pointer transition-all shadow-md hover:shadow-orange-500/5 group flex items-center justify-between"
                  >
                    <div className="space-y-2 flex-grow">
                      <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {match.competition?.name}
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-10 space-y-1.5">
                          <div className="flex items-center space-x-2.5">
                            <img 
                              src={match.homeTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + match.homeTeam?.name} 
                              alt="" 
                              className="w-5 h-5 object-contain"
                              onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + match.homeTeam?.name }}
                            />
                            <span className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors">{match.homeTeam?.name}</span>
                          </div>
                          <div className="flex items-center space-x-2.5">
                            <img 
                              src={match.awayTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + match.awayTeam?.name} 
                              alt="" 
                              className="w-5 h-5 object-contain"
                              onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + match.awayTeam?.name }}
                            />
                            <span className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors">{match.awayTeam?.name}</span>
                          </div>
                        </div>

                        <div className="col-span-2 text-right bg-slate-900 py-2.5 px-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                          <span className="text-orange-500 font-black text-sm">{match.score?.fullTime?.home ?? 0}</span>
                          <span className="text-[10px] text-slate-500 font-black">-</span>
                          <span className="text-orange-500 font-black text-sm">{match.score?.fullTime?.away ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-4 flex flex-col items-end shrink-0 justify-center">
                      <span className="bg-red-600/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-1.5">LIVE</span>
                      <span className="text-[10px] text-slate-400 font-bold">{match.minute ? `Min ${match.minute}` : 'En cours'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📅 UPCOMING FIXTURES */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h3 className="font-black text-lg text-white uppercase tracking-tight">Matchs à Venir</h3>
              </div>
              <button 
                onClick={() => onNavigate('/sports/matches')}
                className="text-orange-500 hover:text-orange-400 text-xs font-bold flex items-center space-x-1"
              >
                <span>Calendrier</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loadingUpcoming ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto mb-2" />
                <p className="text-slate-400 text-xs">Chargement du calendrier...</p>
              </div>
            ) : upcomingMatches.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Aucun match planifié disponible.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatches.map((match) => {
                  const kickoffDate = new Date(match.utcDate);
                  return (
                    <div 
                      key={match.id}
                      onClick={() => onSelectMatch(match.id)}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-850 pb-2 mb-2">
                        <span className="max-w-[70%] truncate uppercase">{match.competition?.name}</span>
                        <span className="text-orange-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{kickoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>

                      <div className="space-y-2 py-1">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={match.homeTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + match.homeTeam?.name} 
                            alt="" 
                            className="w-4 h-4 object-contain"
                            onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + match.homeTeam?.name }}
                          />
                          <span className="text-slate-300 font-semibold text-xs truncate">{match.homeTeam?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <img 
                            src={match.awayTeam?.crest || "https://api.dicebear.com/7.x/initials/svg?seed=" + match.awayTeam?.name} 
                            alt="" 
                            className="w-4 h-4 object-contain"
                            onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + match.awayTeam?.name }}
                          />
                          <span className="text-slate-300 font-semibold text-xs truncate">{match.awayTeam?.name}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-[10px] text-slate-500 font-bold capitalize text-right">
                        {kickoffDate.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          
          {/* 🇭🇹 NATIONAL TEAM HAITI WIDGET CARD */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl group">
            {/* National team flag graphic header */}
            <div className="h-28 bg-gradient-to-r from-blue-700 via-red-600 to-red-700 relative flex items-center justify-between px-6">
              <div className="space-y-1">
                <span className="bg-white/25 backdrop-blur-md text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                  🇭🇹 Les Grenadiers
                </span>
                <h4 className="text-xl font-bold text-white tracking-tight uppercase leading-none">
                  Haiti National
                </h4>
              </div>
              <img 
                src="https://i.postimg.cc/151rbPwM/fll.png" 
                alt="Drapeau officiel de la République d'Haïti" 
                className="w-14 h-10 object-cover rounded shadow-md border border-white/20 transform group-hover:scale-110 transition-transform" 
                loading="lazy"
              />
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 font-medium">
                Suivez en temps réel et en continu les actualités, calendriers et scores des Grenadiers d'Haïti dans toutes les compétitions.
              </p>

              {/* Matchs des Grenadiers Widget Content */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3">
                <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  Prochain Match des Grenadiers
                </p>

                {haitiMatch ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                      <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] border border-slate-800 text-slate-400 uppercase truncate max-w-[50%]">
                        {haitiMatch.competition || "Selection"}
                      </span>
                      <span className="text-slate-400 capitalize text-[10px]">
                        {new Date(haitiMatch.utcDate || haitiMatch.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-500 font-bold shrink-0 w-4">🇭🇹</span>
                        <span className={`font-semibold ${haitiMatch.isHome ? 'text-orange-400 font-bold' : 'text-slate-300'}`}>Haïti</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-500 font-bold shrink-0 w-4">⚽</span>
                        <span className={`font-semibold ${!haitiMatch.isHome ? 'text-orange-400 font-bold' : 'text-slate-300'}`}>{haitiMatch.opponent || h_opp(haitiMatch)}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-2 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold">Kickoff:</span>
                      <span className="text-orange-500 font-mono font-black text-xs">
                        {new Date(haitiMatch.utcDate || haitiMatch.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-center py-2">
                    <p className="text-xs text-slate-400">Aucune date enregistrée prochainement par l'API.</p>
                    <button 
                      onClick={() => onNavigate('/sports/haiti')}
                      className="text-xs text-orange-400 hover:text-orange-500 font-bold underline"
                    >
                      Consulter les résultats récents
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => onNavigate('/sports/haiti')}
                className="w-full bg-orange-600/10 hover:bg-orange-600 border border-orange-500/20 hover:border-orange-500 text-orange-400 hover:text-white py-2 px-4 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5"
              >
                <span>Accéder au Hub Grenadier</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 🏆 COMPETITIONS LIST */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-black text-lg text-white uppercase tracking-tight border-b border-slate-800 pb-4">
              Compétitions
            </h3>
            <div className="space-y-2">
              {[
                { name: "Premier League", code: "PL", icon: "🇬🇧" },
                { name: "La Liga (Espagne)", code: "PD", icon: "🇪🇸" },
                { name: "Bundesliga", code: "BL1", icon: "🇩🇪" },
                { name: "Champions League", code: "CL", icon: "🏆" },
                { name: "Série A (Italie)", code: "SA", icon: "🇮🇹" },
                { name: "Ligue 1 (France)", code: "FL1", icon: "🇫🇷" }
              ].map((c) => (
                <div 
                  key={c.code}
                  onClick={() => onNavigate(`/sports/standings?competition=${c.code}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm shrink-0">{c.icon}</span>
                    <span className="text-slate-300 font-bold text-xs group-hover:text-white transition-colors">{c.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition-colors" />
                </div>
              ))}
            </div>
            <button 
              onClick={() => onNavigate('/sports/competitions')}
              className="w-full text-center text-xs text-slate-400 hover:text-orange-400 font-bold"
            >
              Voir toutes les compétitions
            </button>
          </div>

        </div>

      </div>

      {/* 📰 SPORTS NEWS SECTION */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="font-black text-lg text-white uppercase tracking-tight">Actualités Sportives</h3>
          </div>
        </div>

        {loadingNews ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Chargement des actualités sportives...
          </div>
        ) : news.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            Aucun article de sport n'a été publié récemment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <div 
                key={item.id}
                className="flex flex-col bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-lg hover:border-slate-700 transition-all group"
              >
                {item.featuredImage && (
                  <div className="h-44 overflow-hidden relative">
                    <img 
                      src={item.featuredImage} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                    <span className="absolute bottom-2 left-2 bg-slate-900/90 text-orange-400 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border border-slate-800">
                      Médias
                    </span>
                  </div>
                )}
                <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {item.createdAt && new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
                    </span>
                    <h4 className="text-slate-200 font-black text-sm group-hover:text-white transition-all line-clamp-2 uppercase tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-slate-400 text-xs font-semibold line-clamp-2">
                      {item.excerpt || item.content?.substring(0, 100).replace(/<[^>]*>/g, '')}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// Simple visual extraction helper for opponent
function h_opp(match: any) {
  if (!match) return "";
  if (match.isHome) return match.opponent || "";
  return match.opponent || "";
}
export default SportsHome;
