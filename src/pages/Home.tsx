
import React, { useState, useEffect } from 'react';
import { Page, Article, Sponsor } from '../types';
import { PROGRAMS, STREAM_URL } from '../constants';
import AnnouncementTicker from '../components/AnnouncementTicker';
import SEO from '../components/SEO';
import HallOfFame from '../components/HallOfFame';
import ListenerMap from '../components/ListenerMap';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  MapPin, 
  HeartHandshake, 
  X,
  Clock,
  User,
  Calendar
} from 'lucide-react';

interface HomeProps {
  setCurrentPage: (page: Page) => void;
  onSelectNews: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ setCurrentPage, onSelectNews }) => {
  const [latestNews, setLatestNews] = useState<Article[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Sponsors hook states
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  // Active Program scheduler states
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [remainingTimeText, setRemainingTimeText] = useState<string>("");
  const [loadingProgram, setLoadingProgram] = useState(true);

  // Active Program real-time listener & calculation
  useEffect(() => {
    const q = query(
      collection(db, 'programs'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      const findActiveAndCalcTime = () => {
        const daysOfWeekFrench = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const now = new Date();
        const currentDayName = daysOfWeekFrench[now.getDay()];
        
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentMinutesSinceMidnight = currentHours * 60 + currentMinutes;

        let found: any = null;

        for (const prog of list) {
          if (prog.dayOfWeek !== currentDayName) continue;
          
          // Parse startTime (e.g., "08:00")
          const [startH, startM] = prog.startTime.split(':').map(Number);
          const startMinutes = startH * 60 + startM;

          // Parse endTime (e.g., "10:00")
          const [endH, endM] = prog.endTime.split(':').map(Number);
          const endMinutes = endH * 60 + endM;

          if (currentMinutesSinceMidnight >= startMinutes && currentMinutesSinceMidnight < endMinutes) {
            found = { ...prog, endMinutes };
            break;
          }
        }

        if (found) {
          setActiveProgram(found);
          const remainingMinutesTotal = found.endMinutes - currentMinutesSinceMidnight;
          const remHours = Math.floor(remainingMinutesTotal / 60);
          const remMins = remainingMinutesTotal % 60;
          if (remHours > 0) {
            setRemainingTimeText(`${remHours}h ${remMins}m restant(s)`);
          } else {
            setRemainingTimeText(`${remMins}m restant(s)`);
          }
        } else {
          setActiveProgram(null);
          setRemainingTimeText("");
        }
      };

      findActiveAndCalcTime();
      setLoadingProgram(false);

      const interval = setInterval(findActiveAndCalcTime, 10000);
      return () => clearInterval(interval);
    }, (error) => {
      console.error("Firestore listening programs failed:", error);
      setLoadingProgram(false);
    });

    return () => unsubscribe();
  }, []);

  // Sponsors real-time subscription listener
  useEffect(() => {
    const q = query(
      collection(db, 'sponsors'),
      where('isActive', '==', true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Sponsor[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || '',
          imageUrl: data.imageUrl || '',
          description: data.description || '',
          websiteUrl: data.websiteUrl || '',
          mapsUrl: data.mapsUrl || '',
          isActive: data.isActive ?? true,
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      // Sort by displayOrder ascending
      list.sort((a, b) => a.displayOrder - b.displayOrder);
      setSponsors(list);
      setCurrentSponsorIndex(0);
    }, (error) => {
      console.error("Home page sponsors real-time listener error:", error);
      try {
        handleFirestoreError(error, OperationType.GET, 'sponsors');
      } catch (e: any) {
        // Log and propagate/ignore if necessary or rethrow
        throw e;
      }
    });

    return () => unsubscribe();
  }, []);

  // Sponsors automatic rotation every 8 seconds
  useEffect(() => {
    if (sponsors.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSponsorIndex((prev) => (prev + 1) % sponsors.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [sponsors]);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          limit(2)
        );
        const snap = await getDocs(q);
        const articles: Article[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          articles.push({
            id: docSnap.id,
            title: data.title,
            slug: data.slug || docSnap.id,
            content: data.content || '',
            excerpt: data.excerpt || '',
            category: data.category || '',
            featuredImage: data.featuredImage || '',
            published: data.published ?? true,
            views: data.views || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            author: data.author || 'Administrateur'
          });
        });
        setLatestNews(articles);
      } catch (err: any) {
        console.error("Home page news fetch error:", err);
        setNewsError(err?.message || String(err));
      }
    };
    fetchLatestNews();
  }, []);
  return (
    <div>
      <SEO 
        title="Radio Télévision Sismique | Radio en Direct, Actualités et Émissions"
        slugPath="/"
        type="website"
      />
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent z-10"></div>
        <img 
          src="https://i.postimg.cc/cKz6bw2r/11.png" 
          alt="Studio" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-2xl">
            <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] mb-4 inline-block">
              Jacksonville, Florida
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              La vibration de <span className="text-orange-500">votre cœur</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
              Radio Télévision Sismique vous informe, vous forme et vous divertit. 
              Le média caribéen qui donne une voix aux sans-voix.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setCurrentPage(Page.Live)}
                className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-orange-600/20 flex items-center space-x-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                <span>ÉCOUTER EN DIRECT</span>
              </button>
              <button 
                onClick={() => setCurrentPage(Page.About)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold transition-all"
              >
                NOTRE MISSION
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Announcement Banner */}
      <AnnouncementTicker />

      {/* Platforms Section (Branchez votre meilleur choix) */}
      <section className="py-24 bg-slate-900 border-y border-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Écoutez Radio Sismique FM partout</h2>
             <p className="text-orange-500 font-bold max-w-3xl mx-auto italic text-lg leading-relaxed">
               "Branchez votre meilleur choix quelque soit l'endroit où vous situez et suivez-nous sur toutes les plateformes 🎙️📻📺😉🤝"
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Block 1: Live */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-orange-500 transition-colors flex flex-col items-center text-center group">
               <div className="w-16 h-16 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-6">📻</div>
               <h3 className="text-xl font-bold text-white mb-4">Écoute en direct</h3>
               <p className="text-slate-400 text-sm mb-6 flex-grow">
                 Radio Sismique FM est disponible sur TuneIn, Zeno FM, Online Radio Box, MyTuner Radio, Radio.net, et bien d'autres.
               </p>
               <a href={STREAM_URL} target="_blank" className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full font-bold text-sm w-full transition-all">
                 ▶ Écouter en direct
               </a>
            </div>

            {/* Block 2: Replays */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-orange-500 transition-colors flex flex-col items-center text-center group">
               <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center text-3xl mb-6">🎧</div>
               <h3 className="text-xl font-bold text-white mb-4">Podcasts & Replays</h3>
               <p className="text-slate-400 text-sm mb-6 flex-grow">
                 Retrouvez nos émissions cultes sur Podbean, SoundCloud et Audiomack pour ne rien manquer de nos analyses.
               </p>
               <a href="https://audiomack.com/radiotelevisionsismique" target="_blank" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold text-sm w-full transition-all">
                 🎧 Écouter les rediffusions
               </a>
            </div>

            {/* Block 3: Social */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-orange-500 transition-colors flex flex-col items-center text-center group">
               <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center text-3xl mb-6">📲</div>
               <h3 className="text-xl font-bold text-white mb-4">Suivez-nous</h3>
               <p className="text-slate-400 text-sm mb-6 flex-grow">
                 Rejoignez notre communauté sur YouTube, Instagram, TikTok, Facebook et Twitter (X). Vibration garantie !
               </p>
               <div className="flex w-full gap-2">
                 <button onClick={() => setCurrentPage(Page.Contact)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full font-bold text-sm flex-grow transition-all">
                   📲 Suivez-nous
                 </button>
                 <button onClick={() => setCurrentPage(Page.Contact)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 rounded-full font-bold text-sm flex-grow transition-all">
                   📩 Contact
                 </button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Announcement Banner */}
      <AnnouncementTicker />

      {/* 📻 En Direct Maintenant Section */}
      <section className="py-12 bg-slate-950 border-b border-slate-900 border-t border-slate-900/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl" />
            
            <div className="flex items-center gap-4 shrink-0">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-650 animate-pulse"></span>
              </span>
              <h3 className="text-sm font-black uppercase text-red-500 tracking-wider">
                📻 En Direct Maintenant
              </h3>
            </div>

            {loadingProgram ? (
              <div className="text-xs text-slate-500 select-none">Mise à jour de la grille d'antenne...</div>
            ) : activeProgram ? (
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto flex-grow md:justify-center px-4">
                <img 
                  src={activeProgram.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200"} 
                  alt={activeProgram.title} 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-cover rounded-xl border border-slate-800 shrink-0 shadow-md"
                />
                <div className="text-center sm:text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 font-mono bg-orange-600/10 px-2 py-0.5 rounded-md">
                    {activeProgram.category || 'Émission'}
                  </span>
                  <h4 className="text-base font-black text-white uppercase mt-1 leading-snug">
                    {activeProgram.title}
                  </h4>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1 text-[11px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeProgram.hostName}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-350 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-850/60">
                      {activeProgram.startTime} - {activeProgram.endTime}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto flex-grow md:justify-center px-4">
                <img 
                  src="https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?q=80&w=200" 
                  alt="RTS Globale" 
                  className="w-14 h-14 object-cover rounded-xl border border-slate-800 shrink-0 shadow-md"
                />
                <div className="text-center sm:text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 font-mono bg-orange-600/10 px-2 py-0.5 rounded-md">
                    Non-Stop
                  </span>
                  <h4 className="text-base font-black text-white uppercase mt-1 leading-snug">
                    La Voix Sismique Globale
                  </h4>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-1 text-[11px] text-slate-400 font-bold">
                    <span>Par l'équipe Radio Sismique</span>
                    <span>•</span>
                    <span className="font-mono text-slate-350">Mode Automatique 24h/7</span>
                  </div>
                </div>
              </div>
            )}

            {activeProgram && remainingTimeText && (
              <div className="bg-slate-950 border border-slate-850 rounded-xl px-4.5 py-2 shrink-0 flex items-center space-x-2 shadow-sm">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black font-mono text-orange-400 uppercase tracking-wider">
                  {remainingTimeText}
                </span>
              </div>
            )}

            <button 
              onClick={() => setCurrentPage(Page.Programmes)}
              className="bg-slate-950 border border-slate-800 hover:border-orange-500 hover:bg-orange-600 hover:text-white transition-all text-xs font-black uppercase tracking-wider px-5 py-3 rounded-2xl shrink-0 cursor-pointer"
            >
              Grille d'Antenne 🗓️
            </button>

          </div>
        </div>
      </section>

      {/* Platforms Section (Branchez votre meilleur choix) */}
      <section className="py-24 bg-slate-900 border-t border-slate-850 relative overflow-hidden" id="homepage-sponsors-section">
        {/* Decorative background light rays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16 animate-fade-in">
            <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2.5 flex items-center justify-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nos Partenaires</span>
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">🤝 Nos Sponsors</h2>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Découvrez les annonceurs et sponsors officiels qui soutiennent la voix sismique de la communauté.
            </p>
          </div>

          {sponsors.length === 0 ? (
            <div className="text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl p-12 max-w-md mx-auto animate-fade-in" id="no-sponsors-placeholder">
              <span className="text-3xl mb-3 block">📢</span>
              <p className="text-sm font-bold text-slate-400">Aucun sponsor disponible actuellement.</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Devenez sponsor de Radio Sismique en nous contactant directement.</p>
            </div>
          ) : (
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                  
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative aspect-square w-full max-w-[240px] bg-slate-900/60 border border-slate-800/40 rounded-2xl flex items-center justify-center p-6 shadow-inner hover:scale-[1.02] transition-all duration-300">
                      <img 
                        src={sponsors[currentSponsorIndex].imageUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=300"} 
                        alt={sponsors[currentSponsorIndex].name} 
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain rounded-xl select-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=300";
                        }}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-7 flex flex-col pt-2 md:pt-0">
                    <div className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-2 font-mono">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Sponsor Officiel</span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mb-4 leading-tight">
                      {sponsors[currentSponsorIndex].name}
                    </h3>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium line-clamp-3">
                      {sponsors[currentSponsorIndex].description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-auto">
                      {sponsors[currentSponsorIndex].websiteUrl && (
                        <a 
                          href={sponsors[currentSponsorIndex].websiteUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-slate-900 hover:bg-orange-600 hover:text-white text-slate-300 border border-slate-800 hover:border-orange-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shadow-sm"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Visiter le site web</span>
                        </a>
                      )}

                      {sponsors[currentSponsorIndex].mapsUrl && (
                        <a 
                          href={sponsors[currentSponsorIndex].mapsUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 hover:border-blue-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shadow-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>Voir la localisation</span>
                        </a>
                      )}

                      <button
                        onClick={() => setSelectedSponsor(sponsors[currentSponsorIndex])}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-orange-500/10 active:scale-95 ml-auto cursor-pointer"
                      >
                        En savoir plus
                      </button>
                    </div>
                  </div>

                </div>

                {sponsors.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentSponsorIndex((prev) => (prev - 1 + sponsors.length) % sponsors.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                      title="Précédent"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentSponsorIndex((prev) => (prev + 1) % sponsors.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                      title="Suivant"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {sponsors.length > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  {sponsors.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      onClick={() => setCurrentSponsorIndex(dotIndex)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        dotIndex === currentSponsorIndex 
                          ? 'w-6 bg-orange-500' 
                          : 'w-2 bg-slate-800 hover:bg-slate-700'
                      }`}
                      title={`Aller au sponsor ${dotIndex + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* MORE DETAILS MODAL OVERLAY: SPONSOR PROFILE */}
      {selectedSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in" id="sponsor-details-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 via-blue-600 to-orange-600" />
            
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <HeartHandshake className="w-4 h-4 text-orange-500" />
                  <span>Sponsor Officiel de RTS</span>
                </div>
                <button
                  onClick={() => setSelectedSponsor(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="w-full h-40 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center p-6 shadow-inner">
                  <img 
                    src={selectedSponsor.imageUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=300"} 
                    alt={selectedSponsor.name} 
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-xl animate-fade-in"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=300";
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                    {selectedSponsor.name}
                  </h3>
                  <p className="text-slate-350 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedSponsor.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-800">
                  <div className="flex flex-wrap items-center gap-3 font-medium">
                    {selectedSponsor.websiteUrl && (
                      <a 
                        href={selectedSponsor.websiteUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-slate-950 hover:bg-orange-600 hover:text-white text-slate-300 border border-slate-800 hover:border-orange-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5"
                      >
                        <Globe className="w-4 h-4 text-orange-500 hover:text-white" />
                        <span>Visiter le site</span>
                      </a>
                    )}

                    {selectedSponsor.mapsUrl && (
                      <a 
                        href={selectedSponsor.mapsUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-slate-950 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 hover:border-blue-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5"
                      >
                        <MapPin className="w-4 h-4 text-blue-400 hover:text-white" />
                        <span>Ouvrir dans Maps</span>
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedSponsor(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl text-center cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Programs */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-2">À ne pas manquer</p>
              <h2 className="text-3xl md:text-4xl font-black text-white">Nos Émissions Phares</h2>
            </div>
            <button 
              onClick={() => setCurrentPage(Page.Emissions)}
              className="text-slate-400 hover:text-white font-bold text-sm underline underline-offset-8"
            >
              Voir toute la grille
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.slice(0, 4).map((prog) => (
              <div key={prog.id} className="group cursor-pointer">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 shadow-lg">
                  <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                  <span className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                    {prog.category}
                  </span>
                </div>
                <h3 className="text-white font-bold text-xl group-hover:text-orange-500 transition-colors mb-2">{prog.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2">{prog.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mb-16">
            <p className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-2">Actualités</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Restez informés sur RTS</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {newsError && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400 text-xs">
                  <span className="font-extrabold uppercase tracking-widest text-red-500 block mb-1">Erreur de Connexion Base de Données</span>
                  <p className="font-mono">{newsError}</p>
                </div>
              )}

              {latestNews.length === 0 && !newsError && (
                <div className="py-12 text-center text-slate-500 italic text-xs uppercase tracking-widest">
                  Récupération des actualités en cours...
                </div>
              )}

              {latestNews.map((news) => (
                <div key={news.id} className="flex flex-col md:flex-row gap-8 group">
                  <div className="w-full md:w-80 h-48 flex-shrink-0 overflow-hidden rounded-2xl cursor-pointer" onClick={() => onSelectNews(news.id)}>
                    <img src={news.featuredImage} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div>
                    <span className="text-orange-500 text-xs font-bold uppercase tracking-widest">
                      {news.category} • {new Date(news.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <h3 className="text-2xl font-black text-white mt-2 mb-4 group-hover:text-orange-400 transition-colors leading-tight cursor-pointer uppercase" onClick={() => onSelectNews(news.id)}>
                      {news.title}
                    </h3>
                    <p className="text-slate-400 mb-6">{news.excerpt}</p>
                    <button 
                      onClick={() => onSelectNews(news.id)}
                      className="text-white font-bold flex items-center space-x-2 group/btn"
                    >
                      <span>Lire l'article</span>
                      <svg className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800">
              <h3 className="text-white font-black text-xl mb-8">Newsletter</h3>
              <p className="text-slate-400 text-sm mb-6">Recevez les dernières infos et le programme de la semaine directement dans votre boîte mail.</p>
              <form className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Votre adresse email" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all">
                  S'ABONNER
                </button>
              </form>
              <p className="text-[10px] text-slate-600 mt-6 text-center">En vous inscrivant, vous acceptez notre politique de confidentialité.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
