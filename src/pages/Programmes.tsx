import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { DbProgram } from '../types';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Sparkles, 
  Activity, 
  ChevronRight, 
  Search,
  Filter,
  Grid3X3,
  ListFilter
} from 'lucide-react';
import SEO from '../components/SEO';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' }
];

const Programmes: React.FC = () => {
  const [programs, setPrograms] = useState<DbProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    // Default to current day of week (0-6)
    return new Date().getDay();
  });
  
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real-time calculated state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveProgram, setLiveProgram] = useState<DbProgram | null>(null);
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');

  // Real-time listener for programs
  useEffect(() => {
    const q = collection(db, 'programs');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DbProgram[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isActive !== false) {
          list.push({
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            hostName: data.hostName || '',
            dayOfWeek: typeof data.dayOfWeek === 'number' ? data.dayOfWeek : 1,
            startTime: data.startTime || '08:00',
            endTime: data.endTime || '09:00',
            category: data.category || 'Information',
            isActive: true
          });
        }
      });
      setPrograms(list);
      setLoading(false);
    }, (error) => {
      console.error("Client programs subscription failure:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update current time clock loop & calculate live show
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // update every 10 seconds

    return () => clearInterval(timer);
  }, []);

  // Recalculate live program whenever programs state or currentTime updates
  useEffect(() => {
    if (programs.length === 0) {
      setLiveProgram(null);
      return;
    }

    const currentDay = currentTime.getDay(); // 0 is Sunday, 1 is Monday ...
    
    // Format hours & minutes: "HH:MM"
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const hhmmNow = `${hours}:${minutes}`;

    // Look for matching program today starting <= now and ending > now
    const activeShow = programs.find(p => {
      return (
        p.dayOfWeek === currentDay &&
        p.startTime <= hhmmNow &&
        p.endTime > hhmmNow
      );
    });

    if (activeShow) {
      setLiveProgram(activeShow);
      
      // Calculate remaining minutes
      const [nowH, nowM] = [currentTime.getHours(), currentTime.getMinutes()];
      const [endH, endM] = activeShow.endTime.split(':').map(Number);
      
      const totalNowMins = nowH * 60 + nowM;
      const totalEndMins = endH * 60 + endM;
      
      const diffMins = totalEndMins - totalNowMins;
      
      if (diffMins > 60) {
        const hRemaining = Math.floor(diffMins / 60);
        const mRemaining = diffMins % 60;
        setTimeRemainingStr(`${hRemaining} h ${mRemaining} min restant`);
      } else if (diffMins > 0) {
        setTimeRemainingStr(`${diffMins} minutes restantes`);
      } else {
        setTimeRemainingStr('Finit bientôt');
      }
    } else {
      setLiveProgram(null);
      setTimeRemainingStr('');
    }
  }, [programs, currentTime]);

  // Filters categories unique list
  const categoriesList = ['all', ...Array.from(new Set(programs.map(p => p.category)))];

  // Daily shows filter
  const currentShowcasePrograms = programs.filter(p => {
    const matchesDay = p.dayOfWeek === selectedDay;
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDay && matchesCategory && matchesSearch;
  });

  // Sort daily programs chronologically by start time
  currentShowcasePrograms.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <>
      <SEO 
        title="Grille de Diffusion - Émissions en Direct" 
        description="Consultez le guide des programmes de Radio Télévision Sismique. Retrouvez vos émissions politiques, culturelles et musicales en direct d'Haïti."
      />

      <div className="bg-slate-950 min-h-screen text-white pb-24 pt-12">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header Banner */}
          <div className="mb-12 text-center sm:text-left">
            <span className="bg-orange-600/10 text-orange-500 border border-orange-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono">
              ⏰ GUIDE DES PROGRAMMES RTS
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white mt-3 uppercase tracking-tight">
              Grille des Programmes
            </h1>
            <p className="text-slate-400 text-xs mt-2 font-medium max-w-xl">
              Suivez toutes nos diffusions en direct et découvrez nos podcasts, chroniques et correspondances citoyennes quotidiennes.
            </p>
          </div>

          {/* DUAL COLS: Left holds Live indicator, Right holds guide list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: LIVE NOW HIGHLIGHT (SPAN 4) */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 pb-2.5 border-b border-slate-900">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>En Direct Maintenant</span>
              </h3>

              {!liveProgram ? (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 text-center shadow-xl animate-fade-in">
                  <span className="text-3xl mb-3 block">🎵</span>
                  <p className="text-xs font-extrabold text-slate-300">Diffusion Audio Musicale Continue</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">Aucune émission animée n'est planifiée à cette heure-là dans la grille.</p>
                  <div className="mt-4 pt-4 border-t border-slate-850/60">
                    <span className="text-[10px] font-black uppercase text-orange-400 font-mono tracking-wider">Radio Sismique Stereo</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative group animate-fade-in">
                  {/* Decorative background light */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Program Cover image */}
                  <div className="w-full aspect-video bg-slate-950 relative overflow-hidden">
                    <img 
                      src={liveProgram.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400"} 
                      alt={liveProgram.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400";
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span>LIVE</span>
                    </div>
                  </div>

                  {/* Program Info */}
                  <div className="p-5 flex flex-col pt-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 font-mono">
                      {liveProgram.category}
                    </span>
                    
                    <h4 className="text-lg font-black text-white mt-1 uppercase tracking-tight">
                      {liveProgram.title}
                    </h4>

                    {liveProgram.description && (
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-2 line-clamp-3">
                        {liveProgram.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-850/65">
                      <div className="flex items-center text-xs font-medium text-slate-300">
                        <User className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
                        <span>Présenté par <strong className="text-white">{liveProgram.hostName}</strong></span>
                      </div>
                      
                      <div className="flex items-center text-xs font-medium text-slate-300">
                        <Clock className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
                        <span>Créneau : <strong className="text-white font-mono">{liveProgram.startTime} - {liveProgram.endTime}</strong></span>
                      </div>
                    </div>

                    {/* Live countdown badge */}
                    <div className="mt-4 p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-[10px] font-mono font-black text-slate-400">
                      <span>FIN DU PROGRAMME IN :</span>
                      <span className="text-emerald-400 flex items-center uppercase">
                        <Activity className="w-3.5 h-3.5 mr-1" />
                        {timeRemainingStr}
                      </span>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: FULL GUIDE TABLE / LIST (SPAN 8) */}
            <div className="lg:col-span-8 flex flex-col">
              
              {/* Daily Filter Selector bar */}
              <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-900">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Planning de Diffusion Grille</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{programs.length} Émissions actives</span>
              </div>

              {/* Day Tab Switcher */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = selectedDay === day.value;
                  const isToday = new Date().getDay() === day.value;
                  
                  return (
                    <button
                      key={day.value}
                      onClick={() => setSelectedDay(day.value)}
                      className={`py-3 px-1 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center border ${
                        isActive
                          ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/10'
                          : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <span>{day.label}</span>
                      {isToday && (
                        <span className={`w-1 h-1 rounded-full mt-1 ${isActive ? 'bg-white' : 'bg-orange-500'}`} title="Aujourd'hui" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day search & category filter tool rails */}
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Chercher par émission, animateur, thématique..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                {/* Category selectors */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-widest flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Thématique :</span>
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-850 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500 font-bold"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'Toutes thématiques' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GUIDE LIST */}
              {loading ? (
                <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center bg-slate-900/10 border border-slate-900 p-8 rounded-2xl">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold">Chargement de la programmation...</p>
                </div>
              ) : currentShowcasePrograms.length === 0 ? (
                <div className="py-24 text-center bg-slate-900/30 border border-slate-850 p-8 rounded-3xl flex flex-col items-center justify-center">
                  <span className="text-3xl mb-3">📡</span>
                  <p className="text-sm font-bold text-slate-400">Aucune émission programmée pour ce jour.</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium max-w-sm leading-relaxed">
                    Ajustez vos filtres ou sélectionnez un autre jour pour découvrir nos programmes d'information, culture et sport.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentShowcasePrograms.map((show) => {
                    const isScheduleRightNow = 
                      new Date().getDay() === show.dayOfWeek &&
                      liveProgram?.id === show.id;

                    return (
                      <div 
                        key={show.id}
                        className={`flex flex-col sm:flex-row gap-4 p-4.5 bg-slate-900/60 border border-slate-850 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-800 ${
                          isScheduleRightNow 
                            ? 'bg-gradient-to-r from-orange-600/10 via-slate-900 to-slate-900 border-orange-500/30 shadow-lg' 
                            : ''
                        }`}
                      >
                        {/* Highlight strip for current day direct live */}
                        {isScheduleRightNow && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-600" />
                        )}

                        {/* Schedule Time column banner */}
                        <div className="sm:w-32 shrink-0 flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center border-b sm:border-b-0 sm:border-r border-slate-850 pb-3 sm:pb-0 sm:pr-4">
                          <div className="flex items-center text-orange-500 font-black font-mono text-sm leading-none whitespace-nowrap">
                            <Clock className="w-4 h-4 mr-1.5 shrink-0" />
                            <span>{show.startTime}</span>
                          </div>
                          
                          <div className="flex flex-col sm:mt-1 font-mono">
                            <span className="text-[10px] text-slate-500 font-bold sm:block hidden">jusqu'à</span>
                            <span className="text-slate-400 font-bold text-xs">{show.endTime}</span>
                          </div>
                        </div>

                        {/* Program Image thumbnail */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 self-start sm:self-center">
                          <img 
                            src={show.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400"} 
                            alt={show.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400";
                            }}
                          />
                        </div>

                        {/* Program core details */}
                        <div className="flex-grow min-w-0 pr-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-950 text-slate-400 border border-slate-850/80 px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider">
                              {show.category}
                            </span>
                            
                            {isScheduleRightNow && (
                              <span className="bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse uppercase tracking-wider">
                                EN DIRECT
                              </span>
                            )}
                          </div>

                          <h5 className="font-extrabold text-white uppercase text-sm tracking-tight mt-1 truncate">
                            {show.title}
                          </h5>

                          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold mt-1.5 line-clamp-2">
                            {show.description}
                          </p>

                          <p className="text-[10px] text-slate-500 font-bold mt-2.5 flex items-center">
                            <User className="w-3.5 h-3.5 text-orange-500 mr-1 shrink-0" />
                            <span>Animation : <strong className="text-slate-300">{show.hostName}</strong></span>
                          </p>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </>
  );
};

export default Programmes;
