import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Page, ListeningSession, Article } from "../types";
import { db } from "../lib/firebase";
import LoadingScreen from "../components/LoadingScreen";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  getDoc,
  updateDoc,
  arrayRemove,
  addDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { 
  Radio, 
  Clock, 
  Calendar, 
  LogOut, 
  User, 
  ShieldAlert, 
  Settings, 
  History, 
  Bookmark, 
  Lock, 
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import Toast, { ToastType } from "../components/Toast";

// Premium Avatars list that users can quickly select
const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jack",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Ginger",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pepper",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cookie",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Princess",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Midnight"
];

interface DashboardProps {
  setCurrentPage: (page: Page) => void;
  onSelectNews?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage, onSelectNews }) => {
  const { user, userProfile, logout, isStreaming, updateUserAvatar, updateProfileDetails, loading: authLoading, authError, retryAuth } = useAuth();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "favorites" | "settings">("overview");

  // State
  const [sessions, setSessions] = useState<ListeningSession[]>([]);
  const [favoriteArticles, setFavoriteArticles] = useState<Article[]>([]);
  const [recentViewedArticles, setRecentViewedArticles] = useState<Article[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Loyalty and reward states
  const [listenerRank, setListenerRank] = useState<number | null>(null);
  const [totalListeners, setTotalListeners] = useState<number>(0);
  const [rewardClaimsList, setRewardClaimsList] = useState<any[]>([]);
  const [claimingStatus, setClaimingStatus] = useState(false);

  // Settings forms
  const [newName, setNewName] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Stats
  const [dailyStats, setDailyStats] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState(0);

  // Alerts feedback
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCurrentPage(Page.Login);
    } else {
      if (userProfile) {
        setNewName(userProfile.fullName);
        setAvatarInput(userProfile.avatar);
      }
      fetchUserData();
    }
  }, [user, userProfile?.uid, authLoading]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      // 1. Fetch listening sessions
      const sessionsQuery = query(
        collection(db, "listening_sessions"),
        where("userId", "==", user.uid),
        orderBy("startTime", "desc"),
        limit(50)
      );
      const querySnap = await getDocs(sessionsQuery);
      const loadedSessions: ListeningSession[] = [];
      
      let daySum = 0;
      let weekSum = 0;
      let monthSum = 0;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        const startTimestamp = data.startTime?.toDate() || new Date();
        const duration = data.duration || 0;

        const sessionItem: ListeningSession = {
          id: docSnap.id,
          userId: data.userId,
          startTime: startTimestamp,
          endTime: data.endTime?.toDate() || new Date(),
          duration: duration,
          date: data.date
        };
        loadedSessions.push(sessionItem);

        // Aggregate statistics
        if (startTimestamp >= oneDayAgo) {
          daySum += duration;
        }
        if (startTimestamp >= oneWeekAgo) {
          weekSum += duration;
        }
        if (startTimestamp >= oneMonthAgo) {
          monthSum += duration;
        }
      });

      setSessions(loadedSessions);
      setDailyStats(daySum);
      setWeeklyStats(weekSum);
      setMonthlyStats(monthSum);

      // 2. Fetch Favorite Articles dynamically based on User field 'favorites'
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const favIds: string[] = userSnap.data().favorites || [];
        if (favIds.length > 0) {
          const articlesList: Article[] = [];
          for (const favId of favIds) {
            const articleRef = doc(db, "articles", favId);
            const artSnap = await getDoc(articleRef);
            if (artSnap.exists()) {
              articlesList.push({ id: artSnap.id, ...artSnap.data() } as Article);
            }
          }
          setFavoriteArticles(articlesList);
        } else {
          setFavoriteArticles([]);
        }

        // Fetch user recently viewed content as well
        const viewedIds: string[] = userSnap.data().viewedArticles || [];
        if (viewedIds.slice().length > 0) {
          const viewsList: Article[] = [];
          for (const vId of viewedIds.slice(0, 5)) {
            const articleRef = doc(db, "articles", vId);
            const artSnap = await getDoc(articleRef);
            if (artSnap.exists()) {
              viewsList.push({ id: artSnap.id, ...artSnap.data() } as Article);
            }
          }
          setRecentViewedArticles(viewsList);
        }
      }

      // 3. Fetch User Rank among all listeners sorted by points desc
      const usersQuery = query(collection(db, "users"), orderBy("points", "desc"));
      const usersSnap = await getDocs(usersQuery);
      let rank = 1;
      let total = 0;
      usersSnap.forEach((docSnap) => {
        total++;
        if (docSnap.id === user.uid) {
          rank = total;
        }
      });
      setListenerRank(rank);
      setTotalListeners(total);

      // 4. Fetch reward claims history
      const claimsQuery = query(
        collection(db, "reward_requests"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const claimsSnap = await getDocs(claimsQuery);
      const claimsList: any[] = [];
      claimsSnap.forEach((docSnap) => {
        claimsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRewardClaimsList(claimsList);

    } catch (e: any) {
      const isOfflineErr = e?.message?.toLowerCase().includes("offline") || 
                           e?.message?.toLowerCase().includes("network") || 
                           e?.code === "unavailable" ||
                           (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isOfflineErr) {
        console.info("Information: App offline. Dashboard statistics loaded with default / local state cache.");
      } else {
        console.error("Error retrieving dashboard stats:", e);
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const getListeningStreak = () => {
    if (sessions.length === 0) return 0;
    const uniqueDates = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    const expectedDate = new Date();
    const todayStr = expectedDate.toISOString().split("T")[0];
    let hasToday = uniqueDates.includes(todayStr);

    let checkDateStr = todayStr;
    
    if (!hasToday) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const yesterdayStr = expectedDate.toISOString().split("T")[0];
      if (uniqueDates.includes(yesterdayStr)) {
        checkDateStr = yesterdayStr;
      } else {
        return 0;
      }
    }

    while (uniqueDates.includes(checkDateStr)) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
      checkDateStr = expectedDate.toISOString().split("T")[0];
    }
    return streak;
  };

  const handleClaimReward = async () => {
    if (!userProfile) return;
    const currentPoints = userProfile.points || 0;
    if (currentPoints < 1000) {
      showToast("Vous devez accumuler au moins 1000 points pour réclamer une récompense.", "error");
      return;
    }

    setClaimingStatus(true);
    try {
      const nextPoints = currentPoints - 1000;
      
      // Deduct from users collection
      const userRef = doc(db, "users", user!.uid);
      await updateDoc(userRef, {
        points: nextPoints
      });

      // Deduct from reward_points collection
      const scoreRef = doc(db, "reward_points", user!.uid);
      await setDoc(scoreRef, {
        points: nextPoints,
        userId: user!.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Add to reward_requests collection
      await addDoc(collection(db, "reward_requests"), {
        userId: user!.uid,
        userEmail: user!.email,
        userName: userProfile.fullName,
        pointsSpent: 1000,
        amountUSD: 5,
        status: "pending",
        createdAt: serverTimestamp()
      });

      showToast("Votre demande de récompense de 5 $ USD a été soumise !", "success");
      fetchUserData();
    } catch (err: any) {
      console.error("Reward claim failed:", err);
      showToast("Une erreur est survenue lors de la soumission de la demande.", "error");
    } finally {
      setClaimingStatus(false);
    }
  };

  // Convert seconds to readable Duration
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Handle Log Out
  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage(Page.Home);
    } catch (e: any) {
      showToast(e.message || "Erreur de déconnexion", "error");
    }
  };

  // Save Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      showToast("Veuillez renseigner votre nom complet.", "error");
      return;
    }

    setUpdatingProfile(true);
    try {
      await updateProfileDetails(newName);
      showToast("Votre profil a été enregistré avec succès !", "success");
    } catch (err: any) {
      showToast(err.message || "Échec de sauvegarde.", "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    try {
      await updateUserAvatar(avatarUrl);
      setAvatarInput(avatarUrl);
      showToast("Avatar mis à jour !", "success");
    } catch (err: any) {
      showToast(err.message || "Échec de mise à jour de l'avatar.", "error");
    }
  };

  const handleCustomAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarInput) return;
    try {
      await updateUserAvatar(avatarInput);
      showToast("Avatar personnalisé mis à jour !", "success");
    } catch (err: any) {
      showToast(err.message || "Échec de mise à jour.", "error");
    }
  };

  // Update password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast("Veuillez remplir tous les champs de sécurité.", "error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast("Les nouveaux mots de passe ne correspondent pas.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Le mot de passe doit faire au moins 6 caractères.", "error");
      return;
    }

    setUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user!.email!, currentPassword);
      await reauthenticateWithCredential(user!, credential);
      await updatePassword(user!, newPassword);
      showToast("Votre mot de passe a bien été modifié !", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Échec de la modification du mot de passe. Vérifiez vos identifiants.", "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Remove Favorite Article
  const handleRemoveFavorite = async (artId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        favorites: arrayRemove(artId)
      });
      showToast("Article supprimé de vos favoris.", "success");
      fetchUserData();
    } catch (err: any) {
      showToast("Échec de suppression.", "error");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Authentification & Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Synchronisation du compte Auditeur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-12 relative overflow-hidden">
      {/* Background radial spotlights */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage("")} 
        />
      )}

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* Header Widget */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {userProfile.role === "admin" && (
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setCurrentPage(Page.AdminDashboard)}
                className="bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transform active:scale-95 transition-all shadow-lg shadow-orange-600/20"
                id="user_dash_admin_panel_trigger"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Console Administrateur</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <img 
                src={userProfile.avatar} 
                alt={userProfile.fullName} 
                className="relative w-20 h-20 bg-slate-950 border border-slate-800 rounded-full shrink-0 object-cover" 
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping"></span>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>

            <div className="text-center sm:text-left mt-2 sm:mt-0">
              <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Auditeur {userProfile.role === 'admin' ? 'Administrateur' : 'Sismique'}
              </span>
              <h1 className="text-2xl font-black text-white mt-1.5 uppercase tracking-tight">{userProfile.fullName}</h1>
              <p className="text-xs text-slate-400 font-medium">{userProfile.email}</p>
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center justify-between sm:justify-start gap-4 mt-6 md:mt-0 pt-6 md:pt-0 border-t border-slate-800 md:border-none">
            {/* Live streaming overlay indicator */}
            {isStreaming ? (
              <div className="flex items-center gap-3 bg-orange-600/10 border border-orange-500/30 px-4 py-2.5 rounded-2xl">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5 antialiased">
                  Écoute en cours! 🎙️
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-semibold italic">Radio inactive - Allumez le player</div>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-400 px-3 py-2 border border-slate-800 hover:border-red-500/30 rounded-xl transition-all uppercase tracking-wider"
              id="user_dash_logout_btn"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Dashboard Left Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm tracking-wide transition-all ${
                activeTab === "overview" 
                  ? "bg-orange-600 text-white shadow-xl shadow-orange-600/10" 
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4.5 h-4.5" />
                <span>Statistiques & Suivi</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm tracking-wide transition-all ${
                activeTab === "history" 
                  ? "bg-orange-600 text-white shadow-xl shadow-orange-600/10" 
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4.5 h-4.5" />
                <span>Historique d'Écoute</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm tracking-wide transition-all ${
                activeTab === "favorites" 
                  ? "bg-orange-600 text-white shadow-xl shadow-orange-600/10" 
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4.5 h-4.5" />
                <span>Articles Favoris ({favoriteArticles.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm tracking-wide transition-all ${
                activeTab === "settings" 
                  ? "bg-orange-600 text-white shadow-xl shadow-orange-600/10" 
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4.5 h-4.5" />
                <span>Configuration de Profil</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </div>

          {/* Dashboard Main Content Area */}
          <div className="lg:col-span-3">
            
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Total Stats Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total listening */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                    <div className="absolute top-4 right-4 bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20">
                      <Clock className="w-5 h-5 text-orange-500 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Durée totale cumulée</p>
                    <p className="text-2xl font-black text-white mt-3 font-mono">
                      {formatTime(userProfile.totalListeningTime || 0)}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold mt-2.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Fidélité Niveau Platine</span>
                    </div>
                  </div>

                  {/* Weekly metrics */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                    <div className="absolute top-4 right-4 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">7 Derniers Jours</p>
                    <p className="text-2xl font-black text-white mt-3 font-mono">
                      {formatTime(weeklyStats)}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold mt-2.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Moyenne d'assiduité stable</span>
                    </div>
                  </div>

                  {/* Monthly metrics */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                    <div className="absolute top-4 right-4 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <Radio className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">30 Derniers Jours</p>
                    <p className="text-2xl font-black text-white mt-3 font-mono">
                      {formatTime(monthlyStats)}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-2.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Participation intensive</span>
                    </div>
                  </div>
                </div>

                {/* FIDÉLITÉ & RÉCOMPENSES BENTO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* points widget */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Points de Fidélité</span>
                        <h3 className="text-3xl font-black text-white mt-1 font-mono">{userProfile.points || 0} <span className="text-xs text-orange-400 font-bold uppercase font-sans">Pts</span></h3>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-orange-600 to-amber-500 rounded-xl text-white shadow-lg shadow-orange-500/15">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Progress to next reward */}
                    <div className="mt-5">
                      <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1.5 uppercase font-sans">
                        <span>Objectif Récompense (5$ USD)</span>
                        <span>{userProfile.points || 0} / 1000 Pts</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 p-0.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (((userProfile.points || 0) / 1000) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-slate-800/50">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 italic font-sans leading-relaxed">Dès 1000 points, vous êtes éligible pour recevoir un transfert de 5 $ USD !</p>
                      </div>
                      <button
                        onClick={handleClaimReward}
                        disabled={claimingStatus || (userProfile.points || 0) < 1000}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition transform active:scale-95 shrink-0 ${
                          (userProfile.points || 0) >= 1000 
                            ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:opacity-90"
                            : "bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed"
                        }`}
                      >
                        {claimingStatus ? "Traitement..." : "Réclamer 5$"}
                      </button>
                    </div>
                  </div>

                  {/* gamification details */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Badge Display */}
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-2 font-sans">Votre Insigne Actuel</span>
                        <div className={`p-4 rounded-xl bg-gradient-to-r border text-center ${
                          (userProfile.points || 0) >= 5000 
                            ? "from-purple-600/10 to-indigo-600/10 text-purple-200 border-purple-500/30" 
                            : (userProfile.points || 0) >= 1000 
                            ? "from-amber-500/10 to-yellow-600/10 text-yellow-200 border-yellow-500/30 shadow-yellow-500/10 shadow-lg animate-pulse" 
                            : (userProfile.points || 0) >= 500 
                            ? "from-slate-400/10 to-slate-500/10 text-slate-100 border-slate-400/30" 
                            : (userProfile.points || 0) >= 100 
                            ? "from-amber-800/10 to-amber-900/10 text-amber-200 border-amber-800/30" 
                            : "from-slate-800/10 to-slate-900/10 text-slate-400 border-slate-800"
                        }`}>
                          <Award className="w-8 h-8 mx-auto mb-1.5 opacity-90" />
                          <p className="text-sm font-black uppercase tracking-tight font-sans">
                            {(userProfile.points || 0) >= 5000 
                              ? "VIP Listener" 
                              : (userProfile.points || 0) >= 1000 
                              ? "Gold Listener" 
                              : (userProfile.points || 0) >= 500 
                              ? "Silver Listener" 
                              : (userProfile.points || 0) >= 100 
                              ? "Bronze Listener" 
                              : "Auditeur Actif"
                            }
                          </p>
                          <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-0.5 font-sans">
                            {(userProfile.points || 0) >= 5000 
                              ? "Badge VIP" 
                              : (userProfile.points || 0) >= 1000 
                              ? "Badge d'Or" 
                              : (userProfile.points || 0) >= 500 
                              ? "Badge d'Argent" 
                              : (userProfile.points || 0) >= 100 
                              ? "Badge de Bronze" 
                              : "Aucun badge"
                            }
                          </p>
                        </div>
                      </div>

                      {/* Rank & Streak column */}
                      <div className="col-span-1 space-y-4 flex flex-col justify-center">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block font-sans">Série d'Écoute</span>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-base">🔥</span>
                            <span className="text-sm font-black text-orange-400 font-mono">{getListeningStreak()} <span className="text-[10px] font-sans text-slate-400 uppercase">Jrs</span></span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block font-sans">Classement</span>
                          <p className="text-sm font-black text-white mt-1 font-mono">
                            #{listenerRank || "-"} <span className="text-[10px] text-slate-500 font-sans font-medium">/ {totalListeners || "0"}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-sans">Niveaux :</span>
                      <div className="flex gap-2 font-mono">
                        <span className="text-amber-800">Bronze (100)</span>
                        <span className="text-slate-400">Silver (500)</span>
                        <span className="text-amber-500">Gold (1000)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORIQUE DES DEMANDES DE RÉCOMPENSE */}
                {rewardClaimsList.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-500" />
                      <span>Historique de vos réclamations de récompenses</span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="py-2.5 px-3">Date de Réclamation</th>
                            <th className="py-2.5 px-3">Valeur de Transfert</th>
                            <th className="py-2.5 px-3">Points Consommés</th>
                            <th className="py-2.5 px-3 text-right">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {rewardClaimsList.map((claim) => (
                            <tr key={claim.id} className="hover:bg-slate-850/50 transition">
                              <td className="py-3 px-3 text-slate-300 font-semibold">
                                {claim.createdAt?.toDate ? claim.createdAt.toDate().toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Récemment"}
                              </td>
                              <td className="py-3 px-3 font-mono text-emerald-400 font-bold">5.00 $ USD</td>
                              <td className="py-3 px-3 font-mono">1000 pts</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                  claim.status === "approved" 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                    : claim.status === "rejected"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-md animate-pulse"
                                }`}>
                                  {claim.status === "approved" ? "Approuvé" : claim.status === "rejected" ? "Refusé" : "En cours"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Daily listeners note block */}
                <div className="bg-gradient-to-r from-orange-950/20 to-amber-950/25 border border-orange-500/20 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-3 bg-orange-600/10 border border-orange-500/30 rounded-full text-orange-400 shrink-0">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-orange-400 tracking-wider">À propos de votre temps d'écoute</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Chaque fois que vous écoutez votre radio préférée avec le lecteur audio en direct en étant connecté, votre tableau d'écoute enregistre automatiquement les secondes accumulées. Ces métriques soutiennent la pérennité de notre média !
                    </p>
                  </div>
                </div>

                {/* Dashboard recent activity list */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-orange-500" />
                    <span>Dernières Activités d'Écoute</span>
                  </h3>

                  {loadingStats ? (
                    <div className="py-8 text-center text-xs text-slate-500">Chargement de votre historique...</div>
                  ) : sessions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">Aucune session d'écoute enregistrée. Allumez la radio pour commencer !</div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex justify-between items-center bg-slate-950/60 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition duration-300">
                          <div>
                            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">{session.date}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Session id: {session.id.slice(0, 8)}...</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-orange-400 font-mono">
                              +{formatTime(session.duration)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Recently Viewed Node */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <span>Activités de Lecture Récents</span>
                  </h3>
                  {recentViewedArticles.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 italic">Aucun article récemment consulté. Explorez les Actualités !</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentViewedArticles.map((article) => (
                        <div 
                          key={article.id} 
                          onClick={() => onSelectNews && onSelectNews(article.id)}
                          className="bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center gap-3.5 cursor-pointer transition-all shrink-0"
                        >
                          <img src={article.featuredImage} className="w-12 h-12 rounded bg-slate-800 object-cover" alt="" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{article.title}</h4>
                            <span className="text-[9px] font-bold text-orange-400 px-1.5 py-0.5 bg-orange-500/10 rounded uppercase mt-1 inline-block">{article.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tap History */}
            {activeTab === "history" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in">
                <h2 className="text-base font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-800">
                  <History className="w-5 h-5 text-orange-500" />
                  <span>Registre d'Écoute Global</span>
                </h2>

                {sessions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-sm italic">Aucun enregistrement d'écoute trouvé.</p>
                    <button 
                      onClick={() => setCurrentPage(Page.Live)}
                      className="mt-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl"
                    >
                      Aller Écouter le Direct
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-4">Session ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Heure de Début</th>
                          <th className="py-3 px-4">Durée Réelle d'Écoute</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {sessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 font-mono text-slate-500">#{sess.id.slice(0, 10)}</td>
                            <td className="py-3 px-4 font-semibold text-slate-200">{sess.date}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {sess.startTime ? sess.startTime.toLocaleTimeString() : "-"}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-orange-400">
                              {formatTime(sess.duration)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Favorite articles */}
            {activeTab === "favorites" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in">
                <h2 className="text-base font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-800">
                  <Bookmark className="w-5 h-5 text-orange-500" />
                  <span>Vos Articles Favoris</span>
                </h2>

                {favoriteArticles.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 italic">
                    Aucun article mis de côté pour le moment. Explorez la section Actualités pour en sauvegarder.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favoriteArticles.map((article) => (
                      <div key={article.id} className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-lg transition flex flex-col justify-between">
                        <img 
                          src={article.featuredImage} 
                          alt={article.title} 
                          className="h-40 w-full object-cover bg-slate-900"
                        />
                        <div className="p-4 flex-grow">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 px-2 py-0.5 bg-orange-500/10 rounded">
                            {article.category}
                          </span>
                          <h3 
                            className="text-sm font-bold text-white mt-2 hover:text-orange-400 cursor-pointer transition line-clamp-2"
                            onClick={() => onSelectNews && onSelectNews(article.id)}
                          >
                            {article.title}
                          </h3>
                        </div>
                        <div className="px-4 pb-4 flex justify-between gap-4">
                          <button 
                            onClick={() => onSelectNews && onSelectNews(article.id)}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-orange-400 transition"
                          >
                            Lire l'article
                          </button>
                          <button 
                            onClick={() => handleRemoveFavorite(article.id)}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Configurations */}
            {activeTab === "settings" && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. Profile information */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-black uppercase tracking-wider text-white mb-6">
                    Mise à jour du profil
                  </h3>
                  
                  {/* Select premium avatars */}
                  <div className="mb-8">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-orange-500" />
                      <span>Choisissez un avatar premium</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {PRESET_AVATARS.map((avUrl, i) => (
                        <button
                          key={i}
                          onClick={() => handleAvatarSelect(avUrl)}
                          className={`p-1 bg-slate-950 border rounded-full transition-all shrink-0 ${
                            userProfile.avatar === avUrl ? "border-orange-500 ring-2 ring-orange-500/40 scale-105" : "border-slate-800 hover:border-slate-600"
                          }`}
                        >
                          <img src={avUrl} className="w-10 h-10 rounded-full bg-slate-900" alt="" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual details */}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Votre Nom Complet</label>
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase px-6 py-3 rounded-xl transition"
                    >
                      {updatingProfile ? "Enregistrement..." : "Sauvegarder les détails"}
                    </button>
                  </form>
                </div>

                {/* 2. Custom Avatar url input */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">
                    Adresse URL d'avatar personnalisée
                  </h3>
                  <form onSubmit={handleCustomAvatarSubmit} className="flex gap-4">
                    <input 
                      type="text"
                      placeholder="https://..."
                      value={avatarInput}
                      onChange={(e) => setAvatarInput(e.target.value)}
                      className="flex-grow px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <button 
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl border border-slate-700 shrink-0"
                    >
                      Enregistrer URL
                    </button>
                  </form>
                </div>

                {/* 3. Security Password Change */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-orange-500" />
                    <span>Sécurité & Mot de passe</span>
                  </h3>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mot de passe actuel</label>
                      <input 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nouveau mot de passe</label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Confirmer le nouveau mot de passe</label>
                      <input 
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase px-6 py-3 rounded-xl transition"
                    >
                      {updatingPassword ? "Mise à jour de sécurité..." : "Changer mon mot de passe"}
                    </button>
                  </form>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
