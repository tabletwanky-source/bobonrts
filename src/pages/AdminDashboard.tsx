import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Page, UserProfile, Article, Category, WelcomeAnnouncement } from "../types";
import { db } from "../lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  Users, 
  FileText, 
  FolderKey, 
  Clock, 
  Search, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  SlidersHorizontal,
  Eye,
  BarChart2,
  Megaphone,
  Award,
  Trophy,
  HeartHandshake,
  Calendar,
  ShieldAlert
} from "lucide-react";
import Toast, { ToastType } from "../components/Toast";
import { MOCK_NEWS } from "../constants";
import AdminGamificationCenter from "../components/AdminGamificationCenter";
import AdminSponsorsManager from "../components/AdminSponsorsManager";
import LoadingScreen from "../components/LoadingScreen";
import AdminProgramsManager from "../components/AdminProgramsManager";
import AdminBreakingNewsManager from "../components/AdminBreakingNewsManager";
import AdminCitizenReports from "../components/AdminCitizenReports";
import AdminSportsSettings from "../components/AdminSportsSettings";

interface AdminDashboardProps {
  setCurrentPage: (page: Page) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentPage }) => {
  const { user, userProfile, loading: authLoading, authError, retryAuth } = useAuth();
  
  // Tab Routing
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "articles" | "categories" | "popup" | "rewards" | "gamification" | "sponsors" | "programs" | "breakingnews" | "citizenreports" | "sports">("analytics");

  // Reward management states
  const [rewardRequestsList, setRewardRequestsList] = useState<any[]>([]);

  // Welcome Announcement settings states
  const [announcementSettings, setAnnouncementSettings] = useState<WelcomeAnnouncement | null>(null);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupContent, setPopupContent] = useState("");
  const [popupImageUrl, setPopupImageUrl] = useState("");
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [popupAutoCloseDuration, setPopupAutoCloseDuration] = useState(10);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Collections Store
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  
  // Loading & Seeding status
  const [loading, setLoading] = useState(true);
  const [seedingText, setSeedingText] = useState("");

  // Search & Filtering
  const [userSearchText, setUserSearchText] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [articleSearchText, setArticleSearchText] = useState("");
  const [articleCategoryFilter, setArticleCategoryFilter] = useState("all");

  // News Manager modal/forms
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleExcerpt, setArticleExcerpt] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articleFeaturedImage, setArticleFeaturedImage] = useState("");
  const [articlePublished, setArticlePublished] = useState(true);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Category Manager modal/forms
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // User Manager inline edits
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userEditFullName, setUserEditFullName] = useState("");
  const [userEditRole, setUserEditRole] = useState<"admin" | "listener" | "user">("user");

  // Notifications
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Redirect if not admin
  useEffect(() => {
    if (authLoading) {
      console.log("Firebase connection status: Wait for Auth state...");
      return;
    }

    // Add console logging:
    console.log("Auth state received.");
    console.log("User email: ", user ? user.email : "none");
    console.log("User role: ", userProfile?.role || "none");
    console.log("Firebase connection status: ", typeof navigator !== 'undefined' && navigator.onLine ? "ONLINE" : "OFFLINE");

    if (!user) {
      console.log("Redirect target: /login (user is not authenticated)");
      setCurrentPage(Page.Login);
      return;
    }
    
    if (userProfile && userProfile.role !== "admin") {
      console.log("Redirect target: /dashboard (user is authenticated but role is not admin)");
      setCurrentPage(Page.Dashboard);
      return;
    }

    console.log("Redirect target: Stay in Admin Dashboard (verified admin). Bootstrapping collections...");
    bootstrapCollections();
  }, [user, userProfile, authLoading]);

  // Load backend data. If empty, seed default categories & articles
  const bootstrapCollections = async () => {
    setLoading(true);
    
    try {
      // 1. Categories
      const categoriesSnap = await getDocs(collection(db, "categories"));
      let loadedCategories: Category[] = [];
      categoriesSnap.forEach((itemDoc) => {
        loadedCategories.push({ id: itemDoc.id, ...itemDoc.data() } as Category);
      });

      // 2. Articles
      const articlesSnap = await getDocs(collection(db, "articles"));
      let loadedArticles: Article[] = [];
      articlesSnap.forEach((itemDoc) => {
        loadedArticles.push({ id: itemDoc.id, ...itemDoc.data() } as Article);
      });

      // 3. User lists
      const usersSnap = await getDocs(collection(db, "users"));
      let loadedUsers: UserProfile[] = [];
      usersSnap.forEach((itemDoc) => {
        loadedUsers.push({ uid: itemDoc.id, ...itemDoc.data() } as UserProfile);
      });

      // Seeding Database if empty to allow testing right away!
      if (loadedCategories.length === 0) {
        setSeedingText("Création des catégories de départ...");
        const defaultCats = ["Sport", "Culture", "Actualités", "International", "Leadership", "Éducation"];
        for (const catName of defaultCats) {
          const docRef = await addDoc(collection(db, "categories"), {
            name: catName,
            description: `Actualités, informations rattachées à la thématique ${catName}`,
            createdAt: serverTimestamp()
          });
          loadedCategories.push({
            id: docRef.id,
            name: catName,
            description: `Actualités, informations rattachées à la thématique ${catName}`,
            createdAt: new Date()
          });
        }
      }

      if (loadedArticles.length === 0) {
        setSeedingText("Génération des articles par défaut en base...");
        for (const item of MOCK_NEWS) {
          const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
          const dummyArt = {
            title: item.title,
            slug: slug,
            content: item.content || item.excerpt,
            excerpt: item.excerpt,
            featuredImage: item.image,
            category: item.category,
            author: "Directeur RTS",
            published: true,
            views: Math.floor(Math.random() * 250) + 12,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, "articles"), dummyArt);
          loadedArticles.push({
            id: docRef.id,
            ...dummyArt,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      // Check users count
      setUsersList(loadedUsers);
      setArticlesList(loadedArticles);
      setCategoriesList(loadedCategories);

      // 4. Welcome Announcement Settings
      const announcementRef = doc(db, 'settings', 'announcement');
      const announcementSnap = await getDoc(announcementRef);
      let currentAnnouncement: WelcomeAnnouncement;
      
      if (announcementSnap.exists()) {
        const data = announcementSnap.data();
        currentAnnouncement = {
          title: data.title || "🎙️ AUDIO NOW – ÉCOUTEZ-NOUS PARTOUT !",
          content: data.content || "",
          imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop",
          enabled: data.enabled !== undefined ? data.enabled : true,
          autoCloseDuration: data.autoCloseDuration !== undefined ? Number(data.autoCloseDuration) : 10,
          views: data.views || 0,
          dismissals: data.dismissals || 0
        };
      } else {
        currentAnnouncement = {
          title: "🎙️ AUDIO NOW – ÉCOUTEZ-NOUS PARTOUT !",
          content: `📞 AUDIONOW : 1-518-801-1331

📱 Téléchargez notre application mobile et écoutez-nous en direct partout dans le monde.

📡 Dans les mois à venir, il est possible que notre signal soit disponible sur 93.1 FM ou 98.1 FM dans plusieurs zones d’Haïti.

📍 Zones concernées :
Kafou, Kafoufèy, Pòtoprens, Kanapevè, Matisan, Bizoton, Dègàn, Mariani, Potay ak lòt lokalite yo.

🎧 Rete konekte avèk nou pou tout nouvo anons ak mizajou yo.`,
          imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop",
          enabled: true,
          autoCloseDuration: 10,
          views: 0,
          dismissals: 0
        };
        await setDoc(announcementRef, currentAnnouncement).catch(e => {
          console.warn("Could not save announcement settings:", e);
        });
      }

      setAnnouncementSettings(currentAnnouncement);
      setPopupTitle(currentAnnouncement.title);
      setPopupContent(currentAnnouncement.content);
      setPopupImageUrl(currentAnnouncement.imageUrl);
      setPopupEnabled(currentAnnouncement.enabled);
      setPopupAutoCloseDuration(currentAnnouncement.autoCloseDuration);

      // 5. Fetch reward requests
      const rewardSnap = await getDocs(collection(db, "reward_requests"));
      let loadedRewardRequests: any[] = [];
      rewardSnap.forEach((itemDoc) => {
        loadedRewardRequests.push({ id: itemDoc.id, ...itemDoc.data() });
      });
      setRewardRequestsList(loadedRewardRequests);

    } catch (err: any) {
      console.error("Firestore database connection failed during Admin bootstrap:", err);
      showToast(`Erreur Base de Données Firestore : ${err?.message || String(err)}`, "error");
      
      setCategoriesList([]);
      setArticlesList([]);
      setUsersList([]);
      setRewardRequestsList([]);
    } finally {
      setSeedingText("");
      setLoading(false);
    }
  };

  // Convert aggregate listening duration
  const totalListeningHours = () => {
    const totalSeconds = usersList.reduce((sum, u) => sum + (u.totalListeningTime || 0), 0);
    return (totalSeconds / 3600).toFixed(1);
  };

  // Export auditeurs list as .csv
  const exportUsersToCSV = () => {
    if (usersList.length === 0) return;
    const headers = ["ID", "UID", "Nom Complet", "Email", "Rôle", "Statut", "Temps d'Écoute (sec)"];
    const rows = usersList.map(u => [
      u.uid,
      u.fullName,
      u.email,
      u.role,
      u.status,
      u.totalListeningTime || 0
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditeurs_radio_sismique_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Export de la liste des auditeurs réussi !", "success");
  };

  // Articles Database CRUD Operations
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle || !articleContent || !articleCategory) {
      showToast("Veuillez remplir le titre, le genre et la catégorie.", "error");
      return;
    }

    const slug = articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const values = {
      title: articleTitle,
      slug: slug,
      excerpt: articleExcerpt || articleContent.slice(0, 160) + "...",
      content: articleContent,
      category: articleCategory,
      featuredImage: articleFeaturedImage || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200",
      published: articlePublished,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingArticle) {
        // Edit Mode
        const articleRef = doc(db, "articles", editingArticle.id);
        await updateDoc(articleRef, values);
        showToast("Article mis à jour !", "success");
      } else {
        // Add Mode
        const newArt = {
          ...values,
          author: userProfile?.fullName || "Administrateur",
          views: 0,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "articles"), newArt);
        showToast("Nouvel article rédigé et catalogué !", "success");
      }
      setShowArticleForm(false);
      bootstrapCollections();
      resetArticleFormState();
    } catch (err: any) {
      showToast("Une erreur est survenue lors de la sauvegarde.", "error");
    }
  };

  const handleEditArticleClick = (item: Article) => {
    setEditingArticle(item);
    setArticleTitle(item.title);
    setArticleExcerpt(item.excerpt);
    setArticleContent(item.content);
    setArticleCategory(item.category);
    setArticleFeaturedImage(item.featuredImage);
    setArticlePublished(item.published);
    setShowArticleForm(true);
  };

  const handleDeleteArticle = async (artId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet article ?")) return;
    try {
      await deleteDoc(doc(db, "articles", artId));
      showToast("Article supprimé de la base.", "success");
      bootstrapCollections();
    } catch (e) {
      showToast("Échec de suppression.", "error");
    }
  };

  const togglePublishArticle = async (art: Article) => {
    try {
      await updateDoc(doc(db, "articles", art.id), {
        published: !art.published
      });
      showToast(`Article ${!art.published ? 'Publié' : 'Retiré de la publication'}.`, "success");
      bootstrapCollections();
    } catch (e) {
      showToast("Opération échouée.", "error");
    }
  };

  const resetArticleFormState = () => {
    setEditingArticle(null);
    setArticleTitle("");
    setArticleExcerpt("");
    setArticleContent("");
    setArticleCategory("");
    setArticleFeaturedImage("");
    setArticlePublished(true);
  };

  // Categories Database CRUD Operations
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    try {
      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), {
          name: categoryName,
          description: categoryDescription
        });
        showToast("Catégorie de presse mise à jour !", "success");
      } else {
        await addDoc(collection(db, "categories"), {
          name: categoryName,
          description: categoryDescription,
          createdAt: serverTimestamp()
        });
        showToast("Catégorie créée !", "success");
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryName("");
      setCategoryDescription("");
      bootstrapCollections();
    } catch (err: any) {
      showToast("Une erreur est survenue.", "error");
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm("Voulez-vous supprimer cette rubrique journalistique ?")) return;
    try {
      await deleteDoc(doc(db, "categories", catId));
      showToast("Catégorie supprimée.", "success");
      bootstrapCollections();
    } catch (e) {
      showToast("Échec de suppression.", "error");
    }
  };

  // Welcome Announcement CRUD Operation
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    try {
      const docRef = doc(db, 'settings', 'announcement');
      const payload = {
        title: popupTitle,
        content: popupContent,
        imageUrl: popupImageUrl,
        enabled: popupEnabled,
        autoCloseDuration: popupAutoCloseDuration,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, payload);
      showToast("Paramètres du pop-up enregistrés avec succès !", "success");
      
      // Update local settings state
      if (announcementSettings) {
        setAnnouncementSettings({
          ...announcementSettings,
          title: popupTitle,
          content: popupContent,
          imageUrl: popupImageUrl,
          enabled: popupEnabled,
          autoCloseDuration: popupAutoCloseDuration
        });
      }
    } catch (err: any) {
      console.error("Save announcement failed:", err);
      showToast("Impossible d'enregistrer les paramètres du pop-up.", "error");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleResetPopupStats = async () => {
    if (!window.confirm("Voulez-vous vraiment remettre à zéro les statistiques de vues et de rejets du pop-up ?")) return;
    try {
      const docRef = doc(db, 'settings', 'announcement');
      await updateDoc(docRef, {
        views: 0,
        dismissals: 0
      });
      showToast("Statistiques remises à zéro !", "success");
      if (announcementSettings) {
        setAnnouncementSettings({
          ...announcementSettings,
          views: 0,
          dismissals: 0
        });
      }
    } catch (err: any) {
      console.error("Reset popup stats failed:", err);
      showToast("Impossible de réinitialiser les statistiques.", "error");
    }
  };

  // Reward Approval / Rejection Operations
  const handleApproveRewardRequest = async (request: any) => {
    if (!window.confirm(`Voulez-vous approuver la demande de récompense de 5 $ USD pour ${request.userName} ?`)) return;
    try {
      await updateDoc(doc(db, "reward_requests", request.id), {
        status: "approved",
        approvedAt: serverTimestamp()
      });
      showToast(`Récompense approuvée avec succès pour ${request.userName} !`, "success");
      bootstrapCollections();
    } catch (err: any) {
      console.error(err);
      showToast("Impossible d'approuver la récompense.", "error");
    }
  };

  const handleRejectRewardRequest = async (request: any) => {
    if (!window.confirm(`Voulez-vous rejeter la demande de récompense pour ${request.userName} ? Les 1000 points lui seront restitués.`)) return;
    try {
      // Refund 1000 points to user
      const userRef = doc(db, "users", request.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uPoints = userSnap.data().points || 0;
        const refundedPoints = uPoints + 1000;
        
        await updateDoc(userRef, {
          points: refundedPoints
        });

        // Also refund in reward_points collection
        await setDoc(doc(db, "reward_points", request.userId), {
          points: refundedPoints,
          userId: request.userId,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Update state to 'rejected'
      await updateDoc(doc(db, "reward_requests", request.id), {
        status: "rejected",
        rejectedAt: serverTimestamp()
      });

      showToast(`Demande rejetée et points remboursés à ${request.userName} !`, "success");
      bootstrapCollections();
    } catch (err: any) {
      console.error(err);
      showToast("Impossible de rejeter la demande.", "error");
    }
  };

  const exportRewardRequestsToCSV = () => {
    if (rewardRequestsList.length === 0) return;
    const headers = ["ID Demande", "Auditeur", "Email", "Points consommes", "Valeur USD", "Statut", "Cree le"];
    const rows = rewardRequestsList.map(r => [
      r.id,
      r.userName,
      r.userEmail,
      r.pointsSpent,
      `$${r.amountUSD}`,
      r.status,
      r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : "Recemment"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_recompenses_sismique_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Export du registre des récompenses réussi !", "success");
  };

  // User Administration Operations
  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    const nextStatus = targetUser.status === "disabled" ? "active" : "disabled";
    if (!window.confirm(`Voulez-vous ${nextStatus === 'disabled' ? 'désactiver' : 'réactiver'} le compte de ${targetUser.fullName} ?`)) return;

    try {
      await updateDoc(doc(db, "users", targetUser.uid), {
        status: nextStatus
      });
      showToast(`Compte d'auditeur ${nextStatus === 'disabled' ? 'désactivé' : 'réactivé'}.`, "success");
      bootstrapCollections();
    } catch (e) {
      showToast("Impossible de configurer le statut.", "error");
    }
  };

  const handleUpdateUserProfileByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, "users", editingUser.uid), {
        fullName: userEditFullName,
        role: userEditRole
      });
      showToast("Profil auditeur ajusté d'office !", "success");
      setEditingUser(null);
      bootstrapCollections();
    } catch (e) {
      showToast("Mise à jour impossible par blocage d'autorisation.", "error");
    }
  };

  const handleDeleteUserRecord = async (userRecord: UserProfile) => {
    if (!window.confirm(`Voulez-vous éjecter et supprimer les données d'écoute de ${userRecord.fullName} de vos serveurs ?`)) return;
    try {
      await deleteDoc(doc(db, "users", userRecord.uid));
      showToast("Compte utilisateur purgé.", "success");
      bootstrapCollections();
    } catch (e) {
      showToast("Purge impossible.", "error");
    }
  };

  // Filter lists based on inputs
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(userSearchText.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearchText.toLowerCase());
    const matchesRole = userRoleFilter === "all" ? true : u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredArticles = articlesList.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(articleSearchText.toLowerCase()) || 
                          a.excerpt.toLowerCase().includes(articleSearchText.toLowerCase());
    const matchesCat = articleCategoryFilter === "all" ? true : a.category === articleCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Prepare Analytics structures for Recharts
  const chartDataListeningPerUser = usersList
    .map(u => ({
      name: u.fullName.split(" ")[0],
      durationHours: ((u.totalListeningTime || 0) / 3600).toFixed(2)
    }))
    .sort((a,b) => parseFloat(b.durationHours) - parseFloat(a.durationHours))
    .slice(0, 8);

  const chartDataViewsPerArticle = articlesList
    .map(a => ({
      title: a.title.slice(0, 15) + "...",
      viewsCount: a.views || 0
    }))
    .sort((a,b) => b.viewsCount - a.viewsCount)
    .slice(0, 6);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Authentification Administration & Chargement...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Synchronisation des collections administratives...</p>
          {seedingText && <p className="text-xs text-orange-400 font-mono italic">{seedingText}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-12 relative overflow-hidden">
      {/* Background radial spotlight lights */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage("")} 
        />
      )}

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {authError && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md" id="admin-db-connection-warning-banner">
            <div className="flex items-center gap-3 text-amber-200">
              <span className="p-2 bg-amber-950/50 border border-amber-800/30 rounded-xl text-amber-500 text-sm">⚠️</span>
              <div className="text-sm">
                <span className="font-semibold text-amber-400 block sm:inline">Avertissement de connexion :</span> Mode hors ligne activé pour la console d'administration. {authError}
              </div>
            </div>
            <button 
              onClick={retryAuth}
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs px-4 py-2 rounded-xl active:scale-95 transition-all whitespace-nowrap"
            >
              Réessayer la connexion
            </button>
          </div>
        )}
        
        {/* Top bar control links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-slate-800 gap-4">
          <div>
            <button 
              onClick={() => setCurrentPage(Page.Dashboard)}
              className="flex items-center text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest gap-2 mb-2"
              id="admin_back_user_btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tableau personnel</span>
            </button>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">CONSOLE CMS & AUDITEURS</h1>
            <p className="text-xs text-orange-400 font-medium">Gestion unifiée du contenu journalistique et du suivi des auditeurs.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportUsersToCSV}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              id="admin_export_users_btn"
            >
              <Download className="w-4 h-4 text-orange-500" />
              <span>Exporter Auditeurs</span>
            </button>
          </div>
        </div>

        {/* Highlight Stats Dashboard Widget */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <Users className="w-4 h-4 text-orange-500" />
              <span className="text-[9px] font-black uppercase text-slate-500">MÉDIAS</span>
            </div>
            <p className="text-lg font-black text-white font-mono">{usersList.length}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Auditeurs inscrits</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black uppercase text-slate-500">ACTIFS</span>
            </div>
            <p className="text-lg font-black text-white font-mono">
              {usersList.filter(u => u.status === 'active').length}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Utilisateurs actifs</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-[9px] font-black uppercase text-slate-500">DURÉE</span>
            </div>
            <p className="text-lg font-black text-white font-mono">{totalListeningHours()}h</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Temps d'Écoute</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <FileText className="w-4 h-4 text-pink-500" />
              <span className="text-[9px] font-black uppercase text-slate-500">ARTICLES</span>
            </div>
            <p className="text-lg font-black text-white font-mono">{articlesList.length}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Articles total</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <Eye className="w-4 h-4 text-purple-500" />
              <span className="text-[9px] font-black uppercase text-slate-500">LECTURE</span>
            </div>
            <p className="text-lg font-black text-white font-mono">
              {articlesList.reduce((sum, a) => sum + (a.views || 0), 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Lecture totale</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <FolderKey className="w-4 h-4 text-amber-500" />
              <span className="text-[9px] font-black uppercase text-slate-500">RUBRIQUE</span>
            </div>
            <p className="text-lg font-black text-white font-mono">{categoriesList.length}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Catégories d'infos</p>
          </div>
        </div>

        {/* Primary Row Grid Tabs Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Admin tab routes selector column left bar */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => { setActiveTab("analytics"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "analytics" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analyses & Rapports</span>
            </button>

            <button
              onClick={() => { setActiveTab("users"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "users" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Auditeurs ({usersList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("articles"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "articles" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Articles rédigés ({articlesList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("categories"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "categories" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <FolderKey className="w-4 h-4" />
              <span>Catégories d'infos ({categoriesList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("popup"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "popup" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
              id="admin_tab_popup_btn"
            >
              <Megaphone className="w-4 h-4" />
              <span>Annonce d'Accueil</span>
            </button>

            <button
              onClick={() => { setActiveTab("rewards"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "rewards" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
              id="admin_tab_rewards_btn"
            >
              <Award className="w-4 h-4" />
              <span>Récompenses & Retraits</span>
            </button>

            <button
              onClick={() => { setActiveTab("gamification"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "gamification" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
              id="admin_tab_gamification_btn"
            >
              <Trophy className="w-4 h-4" />
              <span>Gamification Center</span>
            </button>

            <button
              onClick={() => { setActiveTab("sponsors"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "sponsors" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
              id="admin_tab_sponsors_btn"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Sponsors Officiels</span>
            </button>

            <button
              onClick={() => { setActiveTab("programs"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "programs" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Grille Programmes</span>
            </button>

            <button
              onClick={() => { setActiveTab("breakingnews"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "breakingnews" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Breaking News Flash</span>
            </button>

            <button
              onClick={() => { setActiveTab("citizenreports"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "citizenreports" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Rapports Citoyens</span>
            </button>

            <button
              onClick={() => { setActiveTab("sports"); resetArticleFormState(); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "sports" ? "bg-orange-600 text-white shadow-xl shadow-orange-500/10" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Paramètres Sports</span>
            </button>
          </div>

          {/* Admin tab body columns right side */}
          <div className="lg:col-span-4 max-w-full">
            
            {/* 1. TAB ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Listening distribution and stats graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Listening time */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Temps cumulé d'Écoute (en Heures) - TOP Auditeurs</h3>
                    <div className="h-64">
                      {chartDataListeningPerUser.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500">Aucun auditeur trouvé</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataListeningPerUser}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }} />
                            <Bar dataKey="durationHours" fill="#f97316" radius={[4, 4, 0, 0]} name="Heures d'Écoute" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Views counts analytics */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Articles les plus consultés (Nombre de vues)</h3>
                    <div className="h-64">
                      {chartDataViewsPerArticle.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500">Aucun article enregistré</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartDataViewsPerArticle}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="title" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }} />
                            <Line type="monotone" dataKey="viewsCount" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} name="Vues" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Most active readers metrics leaderboard */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4">Classement des auditeurs les plus engagés</h3>
                  <div className="space-y-3">
                    {usersList
                      .sort((a,b) => (b.totalListeningTime || 0) - (a.totalListeningTime || 0))
                      .slice(0, 5)
                      .map((itemUser, index) => (
                        <div key={itemUser.uid} className="flex justify-between items-center bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl">
                          <div className="flex items-center gap-3.5">
                            <span className="text-xs font-bold font-mono text-orange-500">#0{index + 1}</span>
                            <img src={itemUser.avatar} className="w-8 h-8 rounded-full bg-slate-900" alt="" />
                            <div>
                              <p className="text-xs font-bold text-slate-200">{itemUser.fullName}</p>
                              <p className="text-[10px] text-slate-500">{itemUser.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-orange-400 font-mono">
                            {((itemUser.totalListeningTime || 0) / 3600).toFixed(2)}h d'écoute
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            )}

            {/* 2. TAB USERS (Auditeurs list and actions) */}
            {activeTab === "users" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in">
                
                {/* Search / Filters block */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                  {/* Search box */}
                  <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      placeholder="Rechercher par nom, email..."
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="bg-slate-950/60 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-white outline-none focus:border-orange-500"
                    >
                      <option value="all">Tous les rôles</option>
                      <option value="admin">Administrateurs</option>
                      <option value="user">Auditeurs</option>
                    </select>
                  </div>
                </div>

                {/* Inline modifying user modal panel if active */}
                {editingUser && (
                  <div className="bg-slate-950/85 border border-slate-700/60 p-4 rounded-xl mb-6 shadow-2xl">
                    <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3">Réajustement forcé du profil auditeur</h3>
                    <form onSubmit={handleUpdateUserProfileByAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nom complet d'auditeur</label>
                        <input 
                          type="text" 
                          value={userEditFullName}
                          onChange={(e) => setUserEditFullName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rôle Système</label>
                        <select 
                          value={userEditRole}
                          onChange={(e) => setUserEditRole(e.target.value as "admin" | "user")}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                        >
                          <option value="user">Auditeur (User)</option>
                          <option value="admin">Gérant (Admin)</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase px-4 py-1.5 rounded">Enregistrer</button>
                        <button type="button" onClick={() => setEditingUser(null)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase px-4 py-1.5 rounded border border-slate-700">Annuler</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Table of list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs gap-4 text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-3">Compte</th>
                        <th className="py-3 px-3">Rôle / Statut</th>
                        <th className="py-3 px-3">Temps d'Écoute</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredUsers.map((itemUser) => (
                        <tr key={itemUser.uid} className="hover:bg-slate-800/20 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <img src={itemUser.avatar} className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800" alt="" />
                              <div>
                                <p className="font-bold text-slate-200">{itemUser.fullName}</p>
                                <p className="text-[10px] text-slate-500">{itemUser.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[9px] font-bold text-center px-2 py-0.5 border rounded uppercase w-max tracking-wider ${
                                itemUser.role === 'admin' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-950 text-slate-400 border-slate-800'
                              }`}>
                                {itemUser.role}
                              </span>
                              <span className={`text-[8px] font-bold text-center px-1.5 py-0.5 rounded uppercase w-max tracking-wider ${
                                itemUser.status === 'disabled' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {itemUser.status || "active"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-orange-400">
                            {((itemUser.totalListeningTime || 0) / 3600).toFixed(2)}h
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditingUser(itemUser);
                                  setUserEditFullName(itemUser.fullName);
                                  setUserEditRole(itemUser.role);
                                }}
                                className="p-1.5 hover:bg-slate-850 hover:text-orange-400 rounded-lg transition"
                                title="Modifier profil"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleToggleUserStatus(itemUser)}
                                className={`p-1.5 rounded-lg transition ${
                                  itemUser.status === 'disabled' ? 'hover:bg-emerald-950/40 text-emerald-500' : 'hover:bg-red-950/40 text-red-500'
                                }`}
                                title={itemUser.status === 'disabled' ? 'Activer' : 'Suspendre d\'accès'}
                              >
                                {itemUser.status === 'disabled' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={() => handleDeleteUserRecord(itemUser)}
                                className="p-1.5 hover:bg-red-950/40 text-red-400 rounded-lg transition"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-slate-500 italic">Aucun auditeur ne correspond à votre filtre.</div>
                )}
              </div>
            )}

            {/* 3. TAB ARTICLES (CRUD management) */}
            {activeTab === "articles" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in relative">
                
                {/* Section header actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Journalisme & Actualités rédigées</h2>
                  
                  <button
                    onClick={() => { resetArticleFormState(); setShowArticleForm(true); }}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-1.5 self-start"
                    id="admin_create_article_btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer un Article</span>
                  </button>
                </div>

                {/* Form Overlay Modal or Side window */}
                {showArticleForm && (
                  <div className="bg-slate-950 border border-slate-700 rounded-2xl p-6 mb-8 shadow-2xl relative z-20">
                    <h3 className="text-sm font-black uppercase text-orange-400 tracking-wider mb-6">
                      {editingArticle ? `Edition de l'article` : `Nouveau de Presse`}
                    </h3>

                    <form onSubmit={handleSaveArticle} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Titre de l'Article</label>
                          <input 
                            type="text" 
                            required
                            value={articleTitle}
                            onChange={(e) => setArticleTitle(e.target.value)}
                            placeholder="Entrez un titre accrocheur..."
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-orange-500 outline-none text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Rubrique / Catégorie d'écriture</label>
                          <select
                            required
                            value={articleCategory}
                            onChange={(e) => setArticleCategory(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-1 focus:ring-orange-500 outline-none"
                          >
                            <option value="">-- Choisissez le genre --</option>
                            {categoriesList.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Adresse URL d'image à la une (Illustration)</label>
                          <input 
                            type="text" 
                            value={articleFeaturedImage}
                            onChange={(e) => setArticleFeaturedImage(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Statut initial d'office</label>
                          <div className="flex items-center gap-4 py-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                              <input 
                                type="radio" 
                                checked={articlePublished} 
                                onChange={() => setArticlePublished(true)} 
                                className="accent-orange-500" 
                              />
                              <span>Publié en direct</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                              <input 
                                type="radio" 
                                checked={!articlePublished} 
                                onChange={() => setArticlePublished(false)} 
                                className="accent-orange-500" 
                              />
                              <span>Brouillon / Masqué</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Accroche / Extrait court (Resumé)</label>
                        <input 
                          type="text" 
                          value={articleExcerpt}
                          onChange={(e) => setArticleExcerpt(e.target.value)}
                          placeholder="Bref extrait d'accroche listé en page actualités..."
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Contenu Editorial De l'Article (HTML ou Texte Brut)</label>
                        <textarea 
                          rows={6}
                          required
                          value={articleContent}
                          onChange={(e) => setArticleContent(e.target.value)}
                          placeholder="Écrivez le contenu journalistique complet ici..."
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-orange-500 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Control buttons */}
                      <div className="flex gap-3 justify-end pt-4">
                        <button 
                          type="button" 
                          onClick={() => { setShowArticleForm(false); resetArticleFormState(); }}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-850 px-5 py-2 rounded-xl text-xs font-bold uppercase transition"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit" 
                          className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase px-6 py-2 rounded-xl transition"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Article preview overlay modal */}
                {previewArticle && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                        <span className="text-[10px] font-bold bg-orange-500/10 text-orange-400 px-3 py-1 roundeduppercase uppercase">{previewArticle.category}</span>
                        <button onClick={() => setPreviewArticle(null)} className="text-xs font-bold uppercase text-slate-400 hover:text-white">Fermer</button>
                      </div>
                      <img src={previewArticle.featuredImage} className="w-full h-56 rounded-xl object-cover bg-slate-950 mb-4" alt="" />
                      <h4 className="text-lg font-black text-white">{previewArticle.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Auteur: {previewArticle.author} • Vues: {previewArticle.views || 0}</p>
                      <div className="mt-4 text-xs text-slate-350 leading-relaxed space-y-3 whitespace-pre-wrap">
                        {previewArticle.content}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search in Articles filters */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                  <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      placeholder="Rechercher par titre de presse..."
                      value={articleSearchText}
                      onChange={(e) => setArticleSearchText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <select
                    value={articleCategoryFilter}
                    onChange={(e) => setArticleCategoryFilter(e.target.value)}
                    className="bg-slate-950/60 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-white outline-none"
                  >
                    <option value="all">Toutes rubriques</option>
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs gap-4 text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-3">Article Rédigé</th>
                        <th className="py-3 px-3">Rubrique</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center">Vues</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredArticles.map((art) => (
                        <tr key={art.id} className="hover:bg-slate-800/20 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3 max-w-md">
                              <img src={art.featuredImage} className="w-10 h-10 rounded bg-slate-950 shrink-0 object-cover" alt="" />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-200 truncate">{art.title}</p>
                                <p className="text-[9px] text-slate-500 truncate mt-0.5">{art.excerpt.slice(0, 80)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold text-slate-400">{art.category}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => togglePublishArticle(art)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                art.published ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                              }`}
                            >
                              {art.published ? "En Ligne" : "Brouillon"}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {art.views || 0}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setPreviewArticle(art)}
                                className="p-1.5 hover:bg-slate-850 hover:text-blue-400 rounded-lg transition"
                                title="Aperçu rapide"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleEditArticleClick(art)}
                                className="p-1.5 hover:bg-slate-850 hover:text-orange-400 rounded-lg transition"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteArticle(art.id)}
                                className="p-1.5 hover:bg-red-950/40 text-red-400 rounded-lg transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredArticles.length === 0 && (
                  <div className="py-8 text-center text-slate-500 italic">Aucun article enregistré ne correspond à ce filtre.</div>
                )}
              </div>
            )}

            {/* 4. TAB CATEGORIES */}
            {activeTab === "categories" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Catégories d'écriture de presse</h2>
                  <button 
                    onClick={() => { setEditingCategory(null); setCategoryName(""); setCategoryDescription(""); setShowCategoryForm(true); }}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1 self-start"
                    id="admin_create_category_btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer une Catégorie</span>
                  </button>
                </div>

                {/* Add Category Form Panel inside */}
                {showCategoryForm && (
                  <form onSubmit={handleSaveCategory} className="bg-slate-950 border border-slate-800 p-5 rounded-xl mb-6 space-y-4">
                    <h3 className="text-xs font-black uppercase text-orange-400 tracking-wider">
                      {editingCategory ? "Modifier la rubrique" : "Créer une nouvelle rubrique de presse"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nom de la Catégorie</label>
                        <input 
                          type="text" 
                          required
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="Ex. Sport, Évangéliques, Politique..."
                          className="w-full bg-slate-900 border border-slate-800 px-3 py-2 text-xs rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Brève Description</label>
                        <input 
                          type="text" 
                          value={categoryDescription}
                          onChange={(e) => setCategoryDescription(e.target.value)}
                          placeholder="Description de la rubrique..."
                          className="w-full bg-slate-900 border border-slate-800 px-3 py-2 text-xs rounded text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} className="bg-slate-900 hover:bg-slate-800 text-xs font-bold uppercase border border-slate-850 px-4 py-2 rounded">Annuler</button>
                      <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase px-5 py-2 rounded">Enregistrer</button>
                    </div>
                  </form>
                )}

                {/* Listing of categories */}
                <div className="space-y-4">
                  {categoriesList.map((catItem) => (
                    <div key={catItem.id} className="flex justify-between items-center bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
                      <div>
                        <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">{catItem.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">{catItem.description || "Aucune description rattachée"}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => {
                            setEditingCategory(catItem);
                            setCategoryName(catItem.name);
                            setCategoryDescription(catItem.description || "");
                            setShowCategoryForm(true);
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-orange-500 rounded border border-slate-800 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(catItem.id)}
                          className="p-1.5 bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 rounded border border-slate-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* 5. TAB POPUP / WELCOME ANNOUNCEMENT */}
            {activeTab === "popup" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in space-y-8">
                {/* Header title */}
                <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Annonce Pop-up d'Accueil Premium</h2>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Configurez et analysez l'annonce d'accueil de la station</p>
                  </div>
                  
                  {/* Status pills */}
                  <div className="flex items-center gap-2">
                    <span id="popup_status_pill" className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      popupEnabled 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-md animate-pulse' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {popupEnabled ? '• EN SERVICE' : '• HORS LIGNE'}
                    </span>
                  </div>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* View count card */}
                  <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg" id="views_stat_card">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Vues Totales (Audience)</span>
                      <p className="text-2xl font-black text-white font-mono mt-2" id="pop_views_count">{announcementSettings?.views || 0}</p>
                    </div>
                    <div className="p-3 bg-orange-600/10 text-orange-500 rounded-xl border border-orange-500/10">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Dismissal count card */}
                  <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg" id="dismissals_stat_card">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Fermetures / Rejets</span>
                      <p className="text-2xl font-black text-white font-mono mt-2" id="pop_dismissals_count">{announcementSettings?.dismissals || 0}</p>
                    </div>
                    <div className="p-3 bg-amber-600/10 text-amber-500 rounded-xl border border-amber-500/10">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Auto-Close Timeout duration card */}
                  <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg" id="duration_stat_card">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Délai de fermeture auto</span>
                      <p className="text-2xl font-black text-white font-mono mt-2">{popupAutoCloseDuration} <span className="text-xs font-semibold text-slate-400">sec</span></p>
                    </div>
                    <div className="p-3 bg-sky-600/10 text-sky-500 rounded-xl border border-sky-500/10">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Form management section */}
                <form onSubmit={handleSaveAnnouncement} className="space-y-6" id="welcome_popup_mgmt_form">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left details fields */}
                    <div className="space-y-4">
                      {/* Title input */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Titre de l'Annonce</label>
                        <input
                          type="text"
                          required
                          id="announcement_title_input"
                          value={popupTitle}
                          onChange={(e) => setPopupTitle(e.target.value)}
                          placeholder="Ex: 🎙️ AUDIO NOW – ÉCOUTEZ-NOUS PARTOUT !"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 px-4 py-3 text-xs rounded-xl text-white outline-none transition"
                        />
                      </div>

                      {/* Image URL input */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">URL de l'Image de couverture (Hero Banner)</label>
                        <input
                          type="url"
                          required
                          id="announcement_image_input"
                          value={popupImageUrl}
                          onChange={(e) => setPopupImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 px-4 py-3 text-xs rounded-xl text-white outline-none transition font-sans"
                        />
                      </div>

                      {/* Row layout settings */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Auto-Close duration input */}
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Délai d'affichage (sec)</label>
                          <input
                            type="number"
                            required
                            min={2}
                            max={60}
                            id="announcement_duration_input"
                            value={popupAutoCloseDuration}
                            onChange={(e) => setPopupAutoCloseDuration(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 px-4 py-3 text-xs rounded-xl text-white outline-none transition font-mono"
                          />
                        </div>

                        {/* Enabled state check toggle */}
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Statut d'activation</label>
                          <div className="flex items-center h-11">
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                id="announcement_enabled_checkbox"
                                checked={popupEnabled} 
                                onChange={(e) => setPopupEnabled(e.target.checked)} 
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                              <span className="ms-3 text-xs font-black uppercase text-slate-300 tracking-wide select-none">
                                {popupEnabled ? "Actif" : "Inactif"}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right text-content rich text fields */}
                    <div className="flex flex-col h-full justify-between">
                      <div className="h-full flex flex-col">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Contenu (Texte multi-lignes, prend en charge les émojis)</label>
                        <textarea
                          rows={8}
                          required
                          id="announcement_content_textarea"
                          value={popupContent}
                          onChange={(e) => setPopupContent(e.target.value)}
                          placeholder="Entrez les détails de l'annonce d'accueil..."
                          className="w-full h-full min-h-[180px] bg-slate-950 border border-slate-800 focus:border-orange-500 px-4 py-3 text-xs rounded-xl text-white outline-none transition resize-none whitespace-pre-wrap font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reset analytics & Submit row */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-t border-slate-800/50 pt-5 gap-4">
                    <button 
                      type="button"
                      onClick={handleResetPopupStats}
                      className="px-4 py-3 border border-slate-800 bg-slate-950/20 hover:bg-slate-950 hover:border-red-900 text-slate-400 hover:text-red-400 text-xs uppercase font-extrabold tracking-wider rounded-xl transition duration-350"
                      id="reset_popup_stats_btn"
                    >
                      Remettre à zéro les statistiques
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingAnnouncement}
                      className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition shadow-lg self-end"
                      id="save_announcement_btn"
                    >
                      {isSavingAnnouncement ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 6. TAB REWARDS / FIDELITY PROGRAM */}
            {activeTab === "rewards" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in space-y-8" id="rewards_admin_panel">
                {/* Header title */}
                <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Programme de Fidélité & Récompenses</h2>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Gérez les réclamations de 5 $ USD et surveillez les points des auditeurs</p>
                  </div>
                  
                  {/* Export button */}
                  <button
                    onClick={exportRewardRequestsToCSV}
                    disabled={rewardRequestsList.length === 0}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-orange-500/30 hover:bg-slate-900 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition tracking-wider"
                    id="export_rewards_report_btn"
                  >
                    <Download className="w-4 h-4 text-orange-500" />
                    <span>Exporter CSV</span>
                  </button>
                </div>

                {/* Reward Statistics Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total claims count */}
                  <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total Réclamations</span>
                      <p className="text-2xl font-black text-white font-mono mt-2">{rewardRequestsList.length}</p>
                    </div>
                    <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/10">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Pending claims count */}
                  <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none animate-pulse">Demandes en attente</span>
                      <p className="text-2xl font-black text-amber-500 font-mono mt-2">{rewardRequestsList.filter(x => x.status === 'pending').length}</p>
                    </div>
                    <div className="p-3 bg-amber-600/10 text-amber-500 rounded-xl border border-amber-500/10">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Total rewarded USD */}
                  <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Montant Approuvé</span>
                      <p className="text-2xl font-black text-emerald-400 font-mono mt-2">
                        {rewardRequestsList.filter(x => x.status === 'approved').length * 5} <span className="text-xs font-semibold text-slate-400">$ USD</span>
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl border border-emerald-500/10">
                      <span className="text-xl font-bold font-mono">$</span>
                    </div>
                  </div>
                </div>

                {/* DEMANDES DE RÉCOMPENSES SECTION */}
                <div className="bg-slate-950 border border-slate-800/50 rounded-2xl p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>Demandes de Retraits (5 $ USD / 1000 Pts)</span>
                  </h3>

                  {rewardRequestsList.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 italic text-xs">Aucune demande de récompense soumise par les auditeurs pour le moment.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-850 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                            <th className="py-3 px-3">Auditeur / Email</th>
                            <th className="py-3 px-3">Date</th>
                            <th className="py-3 px-3">Points Déduits</th>
                            <th className="py-3 px-3">Valeur Réelle</th>
                            <th className="py-3 px-3">Statut</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {rewardRequestsList.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-900/40 transition">
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-slate-200">{req.userName}</div>
                                <div className="text-[10px] text-slate-500 font-sans">{req.userEmail}</div>
                              </td>
                              <td className="py-3.5 px-3 text-slate-400 font-medium">
                                {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Récemment"}
                              </td>
                              <td className="py-3.5 px-3 font-mono font-bold text-slate-300">1000 pts</td>
                              <td className="py-3.5 px-3 font-mono font-black text-emerald-400">5.00 $ USD</td>
                              <td className="py-3.5 px-3">
                                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                  req.status === "approved" 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                    : req.status === "rejected"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }`}>
                                  {req.status === "approved" ? "Approuvé" : req.status === "rejected" ? "Refusé" : "En attente"}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                {req.status === "pending" ? (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleRejectRewardRequest(req)}
                                      className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white rounded-lg text-[9px] font-bold uppercase transition hover:scale-105 active:scale-95"
                                    >
                                      Rejeter
                                    </button>
                                    <button
                                      onClick={() => handleApproveRewardRequest(req)}
                                      className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-lg text-[9px] font-bold uppercase transition hover:scale-105 active:scale-95"
                                    >
                                      Approuver
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500 italic font-sans">Traitée</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Classement Général des Auditeurs */}
                <div className="bg-slate-950 border border-slate-800/50 rounded-2xl p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span>Tableau d'Honneur des Meilleurs Scores</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                          <th className="py-3 px-3">Rang</th>
                          <th className="py-3 px-3">Auditeur</th>
                          <th className="py-3 px-3">Insigne Actuel</th>
                          <th className="py-3 px-3">Points Cumulés</th>
                          <th className="py-3 px-3">Temps d'Écoute Global</th>
                          <th className="py-3 px-3 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {usersList
                          .filter(u => u.role !== 'admin')
                          .slice()
                          .sort((a,b) => (b.points || 0) - (a.points || 0))
                          .map((u, i) => (
                            <tr key={u.uid} className="hover:bg-slate-900/40 transition">
                              <td className="py-3 px-3 font-mono font-black text-slate-400">
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                              </td>
                              <td className="py-3 px-3 font-sans font-bold text-slate-200">
                                {u.fullName}
                                <div className="text-[10px] text-slate-500 font-medium font-sans">{u.email}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                  (u.points || 0) >= 5000
                                    ? "bg-purple-600/10 text-purple-400 border-purple-500/20"
                                    : (u.points || 0) >= 1000
                                    ? "bg-amber-500/10 text-yellow-500 border-yellow-500/20"
                                    : (u.points || 0) >= 500
                                    ? "bg-slate-400/10 text-slate-200 border-slate-400/20"
                                    : (u.points || 0) >= 100
                                    ? "bg-amber-800/10 text-amber-200 border-amber-800/20"
                                    : "bg-slate-800/10 text-slate-500 border-slate-800"
                                }`}>
                                  {(u.points || 0) >= 5000
                                    ? "VIP"
                                    : (u.points || 0) >= 1000
                                    ? "Gold"
                                    : (u.points || 0) >= 500
                                    ? "Silver"
                                    : (u.points || 0) >= 100
                                    ? "Bronze"
                                    : "Auditeur"
                                  }
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-black text-orange-400">{u.points || 0} pts</td>
                              <td className="py-3 px-3 font-mono text-slate-400">
                                {Math.floor((u.totalListeningTime || 0) / 3600)}h {Math.floor(((u.totalListeningTime || 0) % 3600) / 60)}m
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${u.status === 'disabled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                  {u.status === 'disabled' ? 'Banni' : 'Actif'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gamification" && (
              <div className="space-y-8 animate-fade-in">
                <AdminGamificationCenter usersList={usersList} />
              </div>
            )}

            {activeTab === "sponsors" && (
              <div className="space-y-8 animate-fade-in">
                <AdminSponsorsManager />
              </div>
            )}

            {activeTab === "programs" && (
              <div className="space-y-8 animate-fade-in">
                <AdminProgramsManager />
              </div>
            )}

            {activeTab === "breakingnews" && (
              <div className="space-y-8 animate-fade-in">
                <AdminBreakingNewsManager />
              </div>
            )}

            {activeTab === "citizenreports" && (
              <div className="space-y-8 animate-fade-in">
                <AdminCitizenReports />
              </div>
            )}

            {activeTab === "sports" && (
              <div className="space-y-8 animate-fade-in">
                <AdminSportsSettings showToast={showToast} />
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
