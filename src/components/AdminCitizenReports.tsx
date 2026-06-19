import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CitizenReport } from '../types';
import { 
  FileText, 
  MapPin, 
  Users, 
  Check, 
  X, 
  BookOpen, 
  Mail, 
  Phone, 
  Edit, 
  Clock, 
  Trash2, 
  Archive,
  Megaphone,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import Toast, { ToastType } from './Toast';

const AdminCitizenReports: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected single report overlay details
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  
  // Form values for editing a report
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isEditingForm, setIsEditingForm] = useState(false);

  // Convert/Publish to actual article state
  const [isPublishingToArticle, setIsPublishingToArticle] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [articleCategory, setArticleCategory] = useState('Information');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Real-time listener for citizen reports
  useEffect(() => {
    const q = collection(db, 'citizen_reports');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CitizenReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'Actualités',
          location: data.location || '',
          mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
          supportingFilesUrls: Array.isArray(data.supportingFilesUrls) ? data.supportingFilesUrls : [],
          status: data.status || 'pending',
          userId: data.userId || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      // Sort newest submissions first
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return bTime - aTime;
      });

      setReports(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listening citizen reports failed:", error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'citizen_reports');
      } catch (errInfo: any) {
        showToast("Impossible de charger les signalements : " + errInfo.message, "error");
      }
    });

    return () => unsubscribe();
  }, []);

  // Update Report Status
  const handleUpdateStatus = async (reportId: string, newStatus: CitizenReport['status']) => {
    try {
      const reportRef = doc(db, 'citizen_reports', reportId);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      showToast(`Le rapport citoyen a été passé en statut: "${newStatus}" !`, 'success');
      
      // Update local overlay too
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, 'citizen_reports');
      } catch (errInfo: any) {
        showToast("Action de statut échouée : " + errInfo.message, 'error');
      }
    }
  };

  // Edit core submission properties before approving
  const handleStartEdit = (rep: CitizenReport) => {
    setEditTitle(rep.title);
    setEditDescription(rep.description);
    setEditCategory(rep.category);
    setIsEditingForm(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReport) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      showToast("Le titre et la description ne peuvent être vides.", 'error');
      return;
    }

    try {
      const reportRef = doc(db, 'citizen_reports', selectedReport.id);
      await updateDoc(reportRef, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        updatedAt: serverTimestamp()
      });
      
      setSelectedReport(prev => prev ? { 
        ...prev, 
        title: editTitle.trim(), 
        description: editDescription.trim(),
        category: editCategory
      } : null);

      setIsEditingForm(false);
      showToast("Le rapport du citoyen a été édité avec succès.", 'success');
    } catch (err: any) {
      console.error("Error editing report doc:", err);
      showToast("Édition impossible: " + err.message, 'error');
    }
  };

  // Publish as standard Article inside "articles" system
  const handleOpenPublishFlow = (rep: CitizenReport) => {
    setArticleContent(
      `### Rapport citoyen par ${rep.fullName}\n` +
      `**Lieu :** ${rep.location}\n\n` +
      `${rep.description}\n\n` +
      `*Cet article a été rédigé et transmis dans l'Espace Citoyen de Radio Télévision Sismique.*`
    );
    setArticleCategory(rep.category === 'Autres' ? 'Information' : rep.category);
    setIsPublishingToArticle(true);
  };

  const handleConfirmPublishArticle = async () => {
    if (!selectedReport) return;
    if (!articleContent.trim()) {
      showToast("Le texte de l'article est requis pour la publication.", 'error');
      return;
    }

    try {
      // Build slug
      const cleanSlug = selectedReport.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
      
      const slugCandidate = `${cleanSlug}-${Date.now().toString().slice(-4)}`;

      // Thumbnail check
      const firstMedia = selectedReport.mediaUrls.length > 0 
        ? selectedReport.mediaUrls[0] 
        : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400";

      // Build article payload
      const articlePayload = {
        title: selectedReport.title,
        slug: slugCandidate,
        content: articleContent.trim(),
        excerpt: selectedReport.description.slice(0, 150) + "...",
        featuredImage: firstMedia,
        category: articleCategory,
        author: selectedReport.fullName,
        published: true,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to articles collection
      await addDoc(collection(db, 'articles'), articlePayload);

      // Pass citizen report status to "published"
      const reportRef = doc(db, 'citizen_reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'published',
        updatedAt: serverTimestamp()
      });

      showToast(`Le reportage citoyen a été rédigé et publié en tant qu'article d'actualités !`, 'success');
      setIsPublishingToArticle(false);
      setSelectedReport(null);
    } catch (err: any) {
      console.error("Converting article error:", err);
      showToast("Publication de l'article impossible : " + err.message, 'error');
    }
  };

  // Delete Citizen Report
  const handleDeleteReport = async (repId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce rapport ?")) return;
    try {
      await deleteDoc(doc(db, 'citizen_reports', repId));
      setSelectedReport(null);
      showToast("Le signalement citoyen a été supprimé.", 'success');
    } catch (err: any) {
      console.error("Error deleting doc:", err);
      showToast("Suppression impossible: " + err.message, 'error');
    }
  };

  // Filter lists
  const filteredReports = reports.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in relative">
      {/* Toast alert display */}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage('')} 
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center">
            <Megaphone className="w-5 h-5 text-orange-500 mr-2" />
            <span>Contributions et Reportages des Citoyens</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Modérez les alertes et reportages envoyés par la communauté. Vous pouvez les modifier, les approuver ou les convertir en véritables articles de presse.
          </p>
        </div>
        
        {/* Status Category Switcher */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">⏳ En attente (Nouveaux)</option>
          <option value="review">🔍 En cours d'étude</option>
          <option value="approved">✅ Approuvés</option>
          <option value="rejected">❌ Écartés</option>
          <option value="published">📰 Publiés sur le site</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-semibold">Récupération des rapports de presse citoyenne...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 text-center bg-slate-950/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-3xl mb-4">📰</span>
          <p className="text-sm font-semibold text-slate-400 mb-1">Aucune contribution citoyenne.</p>
          <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
            Les rapports soumis par les auditeurs d'Haïti et de la diaspora s'afficheront ici en temps réel pour validation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => {
            
            // Submissions styles attributes
            let statusStyle = "bg-slate-950 text-slate-400 border-slate-850";
            if (rep.status === 'pending') statusStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
            if (rep.status === 'review') statusStyle = "bg-sky-500/10 text-sky-400 border-sky-500/20";
            if (rep.status === 'approved') statusStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
            if (rep.status === 'published') statusStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            if (rep.status === 'rejected') statusStyle = "bg-red-500/10 text-red-500 border-red-500/20";

            return (
              <div 
                key={rep.id} 
                className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 font-black text-[9px] uppercase rounded text-orange-400 tracking-wider font-mono">
                      {rep.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider border ${statusStyle}`}>
                      {rep.status === 'pending' ? 'Attente vérification' : rep.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {rep.createdAt?.seconds ? new Date(rep.createdAt.seconds * 1000).toLocaleString('fr-FR') : 'En attente'}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white uppercase tracking-tight truncate max-w-lg">
                    {rep.title}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {rep.description}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      <span>Reporter : <strong className="text-slate-300">{rep.fullName}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span>Lieu : <strong className="text-slate-350">{rep.location}</strong></span>
                    </span>
                    {rep.mediaUrls.length > 0 && (
                      <span className="text-emerald-500 font-black flex items-center gap-1">
                        📁 {rep.mediaUrls.length} médias disponibles
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions triggers */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 self-stretch sm:justify-center border-t sm:border-t-0 border-slate-800/40 pt-3 sm:pt-0">
                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-orange-500/10 cursor-pointer"
                  >
                    Examiner le dossier
                  </button>
                  <button
                    onClick={() => handleDeleteReport(rep.id)}
                    className="bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white p-2.5 rounded-xl border border-red-500/20 hover:border-red-600 transition-colors"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERLAY DOSSIER INSPECTOR */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 to-purple-600" />
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between mt-2">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center">
                  <FileText className="w-5 h-5 text-orange-500 mr-2" />
                  <span>Dossier citoyen n°: {selectedReport.id.slice(-8)}</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase font-mono">
                  En_provenance_de : {selectedReport.fullName} ({selectedReport.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setIsEditingForm(false);
                  setIsPublishingToArticle(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scroll container */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">

              {/* Editing block form if visual requested */}
              {isEditingForm ? (
                <div className="space-y-4 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Edit className="w-4 h-4" />
                    <span>Modifier la soumission avant validation</span>
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Titre de l'article</label>
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Thématique / Catégorie</label>
                    <input 
                      type="text" 
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Corps de texte</label>
                    <textarea 
                      rows={5} 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingForm(false)}
                      className="bg-slate-900 hover:bg-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-400"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer les corrections</span>
                    </button>
                  </div>
                </div>
              ) : isPublishingToArticle ? (
                /* Publish to actual Articles/Blog workflow */
                <div className="space-y-4 bg-slate-950/40 border border-purple-550/15 p-5 rounded-2xl animate-fade-in text-xs font-medium">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Rédiger et Publier en tant qu'article d'Actualités</span>
                  </h4>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Thématique de l'article</label>
                    <select
                      value={articleCategory}
                      onChange={(e) => setArticleCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500 font-bold"
                    >
                      <option value="Information">Information</option>
                      <option value="Politique">Politique</option>
                      <option value="Culture">Culture</option>
                      <option value="Sport">Sport</option>
                      <option value="Santé">Santé</option>
                      <option value="Divertissement">Divertissement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Rédaction finale de l'Article (Markdown pris en charge)</label>
                    <textarea 
                      rows={8} 
                      value={articleContent}
                      onChange={(e) => setArticleContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-medium leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPublishingToArticle(false)}
                      className="bg-slate-900 hover:bg-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-400"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPublishArticle}
                      className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-5 py-2.5 font-black uppercase text-[10px] tracking-wider flex items-center gap-1 border border-purple-550/15 shadow-lg hover:shadow-purple-600/10"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Publier sur le site Web</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Static view details showing what the citizen submitted */
                <div className="space-y-6">
                  
                  {/* Title and location */}
                  <div>
                    <span className="p-1 px-2.5 bg-slate-950 text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-wide">
                      {selectedReport.category}
                    </span>
                    <h2 className="text-xl font-extrabold text-white uppercase tracking-tight mt-1.5 leading-tight">
                      {selectedReport.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center">
                      <MapPin className="w-4 h-4 text-orange-500 mr-1.5 shrink-0" />
                      <span>Lieu du constat : <strong>{selectedReport.location}</strong></span>
                    </p>
                  </div>

                  {/* Narrative content block */}
                  <div className="p-4.5 bg-slate-950/60 border border-slate-850 rounded-2xl text-slate-300 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>

                  {/* Citizen information box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl text-xs space-y-2">
                      <p className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-widest">COORDONNÉES DU DÉPOSANT</p>
                      <p className="text-white font-bold">{selectedReport.fullName}</p>
                      
                      <p className="text-slate-400 flex items-center">
                        <Mail className="w-3.5 h-3.5 text-orange-500 mr-2" />
                        <span>{selectedReport.email}</span>
                      </p>
                      {selectedReport.phone && (
                        <p className="text-slate-400 flex items-center">
                          <Phone className="w-3.5 h-3.5 text-orange-500 mr-2" />
                          <span>{selectedReport.phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl text-[10px] text-slate-400 flex flex-col justify-between font-bold">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-widest mb-1.5">HISTORIQUE D'AUDIT</p>
                        <p className="flex items-center gap-1.5">
                          <span>Statut actuel :</span>
                          <span className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-orange-400 font-black uppercase text-[9px] rounded-lg">
                            {selectedReport.status}
                          </span>
                        </p>
                      </div>

                      <p className="flex items-center font-mono mt-3 text-[9px] text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-700 mr-1.5" />
                        <span>Créé le : {selectedReport.createdAt?.seconds ? new Date(selectedReport.createdAt.seconds * 1000).toLocaleString('fr-FR') : 'En attente'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Media representations preview */}
                  {selectedReport.mediaUrls.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-widest">MÉDIAS & PREUVES AUDIOVISUELLES</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedReport.mediaUrls.map((url, idx) => (
                          <div key={idx} className="bg-slate-950 border border-slate-850 p-1.5 rounded-2xl overflow-hidden h-36 flex items-center justify-center p-1 relative shadow-md group">
                            
                            {url.startsWith('data:image/') || url.startsWith('http') ? (
                              <img 
                                src={url} 
                                alt={`Media ${idx}`} 
                                referrerPolicy="no-referrer"
                                className="max-h-full max-w-full object-contain cursor-zoom-in rounded-xl transition-transform duration-300 group-hover:scale-105"
                                onClick={() => window.open(url, '_blank')}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                                🎬 Video Citoyenne
                                <span className="text-[8px] mt-1 text-slate-700 font-mono font-bold block truncate w-24">{url.slice(0, 16)}...</span>
                              </div>
                            )}

                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/20 flex flex-wrap gap-3.5 items-center justify-between shrink-0">
              
              {/* Quick corrective and publish buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(selectedReport)}
                  className="bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider px-4.5 py-3 rounded-xl border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-4 h-4 text-orange-500" />
                  <span>Corriger/Éditer</span>
                </button>

                {selectedReport.status !== 'published' && (
                  <button
                    type="button"
                    onClick={() => handleOpenPublishFlow(selectedReport)}
                    className="bg-purple-650 hover:bg-purple-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-4.5 py-3 rounded-xl border border-purple-550/15 flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-purple-600/10"
                  >
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span>Publier comme Article</span>
                  </button>
                )}
              </div>

              {/* Moderation approval state changers */}
              <div className="flex gap-2">
                {selectedReport.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedReport.id, 'review')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg cursor-pointer"
                  >
                    🔍 Mettre à l'étude
                  </button>
                )}

                {selectedReport.status !== 'approved' && selectedReport.status !== 'published' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedReport.id, 'approved')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approuver</span>
                  </button>
                )}

                {selectedReport.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                    className="bg-red-950/20 hover:bg-red-650 text-red-400 hover:text-white p-3 rounded-xl border border-red-500/25 transition-colors cursor-pointer"
                    title="Écarter / Rejeter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCitizenReports;
