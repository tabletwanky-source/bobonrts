import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BADGES, getBadgeByPoints } from '../lib/gamification';
import { Crown, Trophy, Flame, Users, Award, Shield, Zap } from 'lucide-react';

interface LeaderboardUser {
  uid: string;
  fullName: string;
  avatar: string;
  listeningTime: number; // in seconds
  points: number;
}

interface ListeningSession {
  id: string;
  userId: string;
  duration: number;
  startTime: any;
  endTime: any;
}

const HallOfFame: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [usersList, setUsersList] = useState<LeaderboardUser[]>([]);
  const [sessionsList, setSessionsList] = useState<ListeningSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates for both collections
  useEffect(() => {
    let active = true;

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snap) => {
      if (!active) return;
      const list: LeaderboardUser[] = [];
      snap.forEach((docSnap) => {
        if (docSnap.id === '_init_placeholder') return;
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          fullName: d.fullName || d.displayName || 'Auditeur',
          avatar: d.photoURL || d.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${docSnap.id}`,
          listeningTime: typeof d.listeningTime === 'number' ? d.listeningTime : (typeof d.totalListeningTime === 'number' ? d.totalListeningTime : 0),
          points: d.points || 0
        });
      });

      // Sort users by listeningTime descending
      list.sort((a, b) => b.listeningTime - a.listeningTime);
      setUsersList(list);
    }, (err) => {
      console.warn("Firestore live users stream active fallback.", err);
    });

    const unsubscribeSessions = onSnapshot(collection(db, 'listening_sessions'), (snap) => {
      if (!active) return;
      const list: ListeningSession[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: d.userId || '',
          duration: d.duration || 0,
          startTime: d.startTime,
          endTime: d.endTime
        });
      });
      setSessionsList(list);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore live sessions stream active fallback.", err);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribeUsers();
      unsubscribeSessions();
    };
  }, []);

  // Compute leaderboard and dynamic gamification statistics via useMemo
  const {
    leaderboard,
    myRank,
    liveListeners,
    listeningHoursToday,
    listeningHoursWeek,
    rewardsDistributed,
    auditeurSemaine,
    auditeurJour,
    auditeurMois
  } = useMemo(() => {
    const leaderboardData = [...usersList]; // Users are pre-sorted by listeningTime descending

    // Find current user's global rank
    let computedMyRank: number | null = null;
    if (user && leaderboardData.length > 0) {
      const myId = user.uid || userProfile?.uid;
      if (myId) {
        const myPos = leaderboardData.findIndex((u) => u.uid === myId);
        if (myPos !== -1) {
          computedMyRank = myPos + 1;
        }
      }
    }

    // Dynamic dates boundaries calculations for live periods
    const now = new Date();
    
    // Start of Today (local timezone midnight)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of current Week (Monday midnight)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Start of current Month (1st of month midnight)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const timeToday = startOfToday.getTime();
    const timeWeek = startOfWeek.getTime();
    const timeMonth = startOfMonth.getTime();

    // Cumulative period trackers
    const durToday: Record<string, number> = {};
    const durWeek: Record<string, number> = {};
    const durMonth: Record<string, number> = {};
    let totalSecondsToday = 0;
    let totalSecondsWeek = 0;

    // Active streaming is defined as standard updates in the last 15 minutes
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const activeListenerIds = new Set<string>();

    sessionsList.forEach((sess) => {
      const getSessionDate = (val: any): Date => {
        if (!val) return new Date();
        if (typeof val.toDate === 'function') return val.toDate();
        if (val.seconds) return new Date(val.seconds * 1000);
        return new Date(val);
      };

      const sessionDate = getSessionDate(sess.startTime || sess.endTime);
      const timeMs = sessionDate.getTime();
      const durationSec = sess.duration || 0;
      const uid = sess.userId;

      if (!uid || durationSec <= 0) return;

      if (timeMs >= timeToday) {
        durToday[uid] = (durToday[uid] || 0) + durationSec;
        totalSecondsToday += durationSec;
      }
      if (timeMs >= timeWeek) {
        durWeek[uid] = (durWeek[uid] || 0) + durationSec;
        totalSecondsWeek += durationSec;
      }
      if (timeMs >= timeMonth) {
        durMonth[uid] = (durMonth[uid] || 0) + durationSec;
      }

      // Live stream online state checks based on end/update times
      const endSessionDate = getSessionDate(sess.endTime || sess.startTime);
      if (endSessionDate.getTime() >= fifteenMinutesAgo) {
        activeListenerIds.add(uid);
      }
    });

    // Helper to calculate top user with highest duration in a given map
    const getLeaderForPeriod = (durationsMap: Record<string, number>) => {
      let bestUserId = '';
      let maxDuration = -1;
      
      for (const [uid, dur] of Object.entries(durationsMap)) {
        if (dur > maxDuration) {
          maxDuration = dur;
          bestUserId = uid;
        }
      }

      if (!bestUserId) return null;
      const matchedUser = leaderboardData.find((u) => u.uid === bestUserId);
      if (!matchedUser) return null;

      return {
        ...matchedUser,
        listeningTime: maxDuration, // override with the specific period's duration only
        points: matchedUser.points
      };
    };

    const parsedAuditeurJour = getLeaderForPeriod(durToday);
    const parsedAuditeurSemaine = getLeaderForPeriod(durWeek);
    const parsedAuditeurMois = getLeaderForPeriod(durMonth);

    // Sum points of all real registered listeners
    let totalPointsDistributed = 0;
    leaderboardData.forEach((u) => {
      totalPointsDistributed += u.points || 0;
    });

    const hoursToday = parseFloat((totalSecondsToday / 3600).toFixed(1));
    const hoursWeek = parseFloat((totalSecondsWeek / 3600).toFixed(1));

    return {
      leaderboard: leaderboardData,
      myRank: computedMyRank,
      liveListeners: activeListenerIds.size,
      listeningHoursToday: hoursToday,
      listeningHoursWeek: hoursWeek,
      rewardsDistributed: totalPointsDistributed,
      auditeurSemaine: parsedAuditeurSemaine,
      auditeurJour: parsedAuditeurJour,
      auditeurMois: parsedAuditeurMois
    };
  }, [usersList, sessionsList, userProfile, user]);

  // Compute current user local styling values to display target progress correctly
  const currentPoints = userProfile?.points || 0;
  const currentBadge = getBadgeByPoints(currentPoints) || { name: 'Bronze Listener', pointsRequired: 100 };
  const currentBadgeName = userProfile?.badge || currentBadge.name;

  // Next badge calculation state
  const nextBadge = BADGES.find(b => b.pointsRequired > currentPoints) || null;
  const progressPercent = nextBadge 
    ? Math.min(100, Math.floor((currentPoints / nextBadge.pointsRequired) * 100))
    : 100;
  
  const pointsRemaining = nextBadge 
    ? nextBadge.pointsRequired - currentPoints 
    : 0;

  // Formatting helper utilities
  const formatMinutes = (seconds: number) => {
    return Math.floor(seconds / 60).toLocaleString('fr-FR');
  };

  const formatHours = (seconds: number) => {
    return Math.floor(seconds / 3600).toLocaleString('fr-FR');
  };

  return (
    <section className="py-20 bg-slate-950 border-t border-slate-900 overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-500 border border-orange-500/25 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Trophy className="w-4 h-4 mr-1" />
            <span>Gamification Premium</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 uppercase">
            🏆 Hall of Fame Sismique
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Écoutez, gagnez des points d’auditoire, débloquez des badges de diffusion et gravez votre nom au sommet de la communauté.
          </p>
        </div>

        {/* Master Row Panel: Live stats and User context */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          
          {/* PROFILE CARD */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient indicator */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/20 rounded-full blur-[40px] pointer-events-none group-hover:scale-125 transition-transform" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Mon Statut</span>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              </div>

              {userProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={user?.photoURL || userProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Me"} 
                      alt={user?.displayName || userProfile.fullName} 
                      className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-orange-500/40 p-0.5 object-cover"
                    />
                    <div>
                      <h4 className="text-lg font-black text-white leading-tight truncate max-w-[150px]">
                        {user?.displayName || userProfile.fullName}
                      </h4>
                      <span className="inline-block mt-1 text-[10px] font-black uppercase px-2.5 py-0.5 bg-orange-600/20 text-orange-400 rounded-full border border-orange-500/30">
                        {currentBadgeName}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/60">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Points</p>
                      <p className="text-2xl font-black text-orange-500">{currentPoints.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Écoute</p>
                      <p className="text-xl font-black text-white">{formatHours(userProfile.listeningTime || userProfile.totalListeningTime || 0)} <span className="text-xs text-slate-400">h</span></p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Prochain palier ({nextBadge?.name || 'MAX'})</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-1000 origin-left"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {nextBadge && (
                      <p className="text-[10px] text-slate-500 text-right">
                        Encore <strong>{pointsRemaining} points</strong> restants
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Flame className="w-10 h-10 text-orange-500/40 mx-auto mb-4" />
                  <p className="text-sm font-semibold text-slate-400 mb-4 font-sans">Connectez-vous pour rejoindre le classement Sismique en direct !</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Marquez des points à chaque seconde d'écoute stable de notre radio.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
              <span>Rang global</span>
              <span className="font-bold text-white">
                {userProfile ? (myRank !== null ? `#${myRank}` : 'Optionnel') : 'Créer un compte'}
              </span>
            </div>
          </div>

          {/* COMMUNITY LIVE STATS */}
          <div className="lg:col-span-3 bg-slate-900/20 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-400 mb-6">
                <Users className="w-4 h-4 text-orange-500" />
                <span>Indicateurs de la Communauté Radio Sismique</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                
                <div className="bg-slate-900/60 border border-slate-800/40 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="mb-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">Actifs en Ligne</p>
                    <p className="text-3xl font-black text-white tracking-tight">{liveListeners}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full inline-block font-bold self-start animate-pulse">
                    ● En ligne
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/40 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="mb-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">Écoute du Jour</p>
                    <p className="text-3xl font-black text-orange-500 tracking-tight">{listeningHoursToday} <span className="text-xs text-slate-400">h</span></p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Audience cumulée</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/40 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="mb-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">Écoute Hebdo</p>
                    <p className="text-3xl font-black text-purple-400 tracking-tight">{listeningHoursWeek} <span className="text-xs text-slate-400">h</span></p>
                  </div>
                  <span className="text-[10px] text-orange-400/80 font-black flex items-center">
                    <Zap className="w-3 h-3 mr-0.5" /> +12% hausse
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/40 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="mb-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">Points Distribués</p>
                    <p className="text-3xl font-black text-yellow-500 tracking-tight">{rewardsDistributed.toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Tous les auditeurs</span>
                </div>

              </div>
            </div>

            {/* BADGES & LEVELS PREVIEW PANEL CHEAT SHEET */}
            <div className="mt-8 pt-6 border-t border-slate-800/50">
              <h5 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-wider">Hiérarchie des Insignes Sismiques</h5>
              <div className="flex flex-wrap gap-2.5">
                {BADGES.map((b) => (
                  <div key={b.id} className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-xl hover:border-orange-500/50 transition-colors">
                    <span className="text-sm">{b.icon}</span>
                    <span className={`text-[10px] font-black whitespace-nowrap ${b.color}`}>{b.name}</span>
                    <span className="text-[9px] text-slate-500">({b.pointsRequired} pts)</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Class Cards (Auditeur Semaine, Jour, Mois, Top 5) */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* THE BIG THREE (Semaine, Jour, Mois) */}
          <div className="xl:col-span-3 space-y-6">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Award className="w-5 h-5 text-orange-500" />
              <span>Les Trônes d’Audience Sismique</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* AUDITEUR DE LA SEMAINE */}
              {auditeurSemaine ? (
                <div className="bg-slate-900/60 border-2 border-yellow-500/40 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between group shadow-xl hover:shadow-yellow-500/5 transition-all">
                  <div className="absolute -top-3 -right-3 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none" />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-extrabold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full flex items-center space-x-1">
                        <Crown className="w-3 h-3 text-yellow-500 mr-0.5" />
                        <span>Auditeur Semaine</span>
                      </span>
                      <span className="text-xs text-slate-500 font-black">👑 #1</span>
                    </div>

                    <div className="flex items-center space-x-4 my-6">
                      <div className="relative">
                        <img 
                          src={auditeurSemaine.avatar} 
                          alt={auditeurSemaine.fullName} 
                          className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-yellow-500 p-0.5 object-cover"
                        />
                        <span className="absolute -top-2.5 -right-2 bg-yellow-500 text-slate-950 p-1 rounded-full text-xs font-black shadow-lg">
                          🏆
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white">{auditeurSemaine.fullName}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                          {getBadgeByPoints(auditeurSemaine.points)?.name || 'Bronze Listener'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Durée d'écoute:</span>
                        <span className="font-extrabold text-white">{formatMinutes(auditeurSemaine.listeningTime)} mins</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Points acquis:</span>
                        <span className="font-extrabold text-yellow-500">+{auditeurSemaine.points} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Insigne Hebdomadaire:</span>
                    <span className="font-black text-yellow-500">Sismique Excellence</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-center items-center group shadow-xl hover:shadow-yellow-500/5 transition-all text-center min-h-[300px]">
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-full text-yellow-500/50 mb-4">
                    <Crown className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-400 font-extrabold uppercase text-xs tracking-wider">Auditeur Semaine</h4>
                  <p className="text-slate-600 text-[10px] mt-2 font-medium max-w-[170px] leading-relaxed">
                    Aucun leader cette semaine. Écoutez le direct pour briguer cette place !
                  </p>
                </div>
              )}

              {/* AUDITEUR DU JOUR */}
              {auditeurJour ? (
                <div className="bg-slate-900/60 border border-orange-500/30 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between group shadow-xl hover:shadow-orange-500/5 transition-all">
                  <div className="absolute -top-3 -right-3 w-32 h-32 bg-orange-600/10 rounded-full blur-[40px] pointer-events-none" />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-extrabold uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full flex items-center">
                        <Flame className="w-3 h-3 text-orange-500 mr-1 animate-pulse" />
                        <span>Auditeur du Jour</span>
                      </span>
                      <span className="text-xs text-slate-500 font-black">🔥 #2</span>
                    </div>

                    <div className="flex items-center space-x-4 my-6">
                      <div className="relative">
                        <img 
                          src={auditeurJour.avatar} 
                          alt={auditeurJour.fullName} 
                          className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-orange-500 p-0.5 object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white">{auditeurJour.fullName}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                          {getBadgeByPoints(auditeurJour.points)?.name || 'Bronze Listener'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Écoute Aujourd'hui:</span>
                        <span className="font-extrabold text-white">{formatMinutes(auditeurJour.listeningTime)} mins</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Points cumulés:</span>
                        <span className="font-extrabold text-orange-500">+{auditeurJour.points} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Statut du Jour:</span>
                    <span className="font-black text-orange-500">Le Doigt Sur l'Onde</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-center items-center group shadow-xl hover:shadow-orange-500/5 transition-all text-center min-h-[300px]">
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-full text-orange-500/50 mb-4">
                    <Flame className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-400 font-extrabold uppercase text-xs tracking-wider">Auditeur du Jour</h4>
                  <p className="text-slate-600 text-[10px] mt-2 font-medium max-w-[170px] leading-relaxed">
                    Aucun auditeur actif aujourd'hui. Marquez le premier point d'écoute !
                  </p>
                </div>
              )}

              {/* AUDITEUR DU MOIS */}
              {auditeurMois ? (
                <div className="bg-slate-900/60 border border-purple-500/30 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between group shadow-xl hover:shadow-purple-500/5 transition-all">
                  <div className="absolute -top-3 -right-3 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full flex items-center">
                        <Award className="w-3 h-3 text-purple-400 mr-1" />
                        <span>Auditeur du Mois</span>
                      </span>
                      <span className="text-xs text-slate-500 font-black">🏅 #3</span>
                    </div>

                    <div className="flex items-center space-x-4 my-6">
                      <div className="relative">
                        <img 
                          src={auditeurMois.avatar} 
                          alt={auditeurMois.fullName} 
                          className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-purple-500 p-0.5 object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white">{auditeurMois.fullName}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                          {getBadgeByPoints(auditeurMois.points)?.name || 'Bronze Listener'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Écoute mensuelle:</span>
                        <span className="font-extrabold text-white">{formatHours(auditeurMois.listeningTime)} heures</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Points acquis:</span>
                        <span className="font-extrabold text-purple-400">+{auditeurMois.points} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Titre Honorifique:</span>
                    <span className="font-black text-purple-400">Insigne Mensuel</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-center items-center group shadow-xl hover:shadow-orange-500/5 transition-all text-center min-h-[300px]">
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-full text-purple-500/50 mb-4">
                    <Award className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-400 font-extrabold uppercase text-xs tracking-wider">Auditeur du Mois</h4>
                  <p className="text-slate-600 text-[10px] mt-2 font-medium max-w-[170px] leading-relaxed">
                    Aucun auditeur classé ce mois-ci. Rejoignez l'antenne radio !
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* TOP 5 RANKINGS CARD LIST */}
          <div className="xl:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Top 5 Auditeurs</h4>
                <div className="flex items-center space-x-1.5 text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full font-bold">
                  <span>Classé</span>
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic text-xs uppercase bg-slate-950/40 rounded-2xl border border-slate-900 p-4">
                  Aucun auditeur classé pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((userRank, index) => {
                    const medalMap = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                    let borderStyle = "border-slate-800/60";
                    let bgGlow = "";
                    
                    if (index === 0) {
                      borderStyle = "border-yellow-500/30";
                      bgGlow = "hover:shadow-yellow-500/5 hover:border-yellow-500/50";
                    } else if (index === 1) {
                      borderStyle = "border-slate-300/30";
                      bgGlow = "hover:shadow-slate-300/5 hover:border-slate-300/50";
                    } else if (index === 2) {
                      borderStyle = "border-amber-600/30";
                      bgGlow = "hover:shadow-amber-600/5 hover:border-amber-600/55";
                    }

                    return (
                      <div 
                        key={userRank.uid} 
                        className={`flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border ${borderStyle} transition-all duration-300 ${bgGlow}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-black w-6 text-center">{medalMap[index]}</span>
                          <img 
                            src={userRank.avatar} 
                            alt={userRank.fullName} 
                            className="w-10 h-10 rounded-xl bg-slate-800 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate max-w-[100px]">{userRank.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-semibold">{formatMinutes(userRank.listeningTime)} mins</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] font-extrabold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                            +{userRank.points}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CLASS BONUS REWARDS NOTE */}
            <div className="mt-6 pt-4 border-t border-slate-800/60 bg-slate-950/40 p-4 rounded-xl text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
              <p className="font-extrabold text-white text-[11px] mb-1">🎁 Récompenses Hebdomadaires</p>
              <div className="flex justify-between items-center">
                <span>🥇 Auditeur #1</span>
                <span className="text-yellow-500 font-black">+50 Points Bonus</span>
              </div>
              <div className="flex justify-between items-center">
                <span>🥈 Auditeur #2</span>
                <span className="text-slate-300 font-black">+30 Points Bonus</span>
              </div>
              <div className="flex justify-between items-center">
                <span>🥉 Auditeur #3</span>
                <span className="text-amber-600 font-black">+20 Points Bonus</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default HallOfFame;
