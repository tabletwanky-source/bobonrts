import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { CitizenReport } from '../types';
import { 
  FileText, 
  MapPin, 
  UploadCloud, 
  Check, 
  ShieldAlert, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Paperclip, 
  Trash2, 
  Clock, 
  Search,
  UserCheck,
  Megaphone
} from 'lucide-react';
import SEO from '../components/SEO';
import Toast, { ToastType } from '../components/Toast';

const CATEGORIES = [
  'Actualités',
  'Politique',
  'Culture',
  'Éducation',
  'Sport',
  'Santé',
  'Religion',
  'Sécurité',
  'Événements',
  'Autres'
];

interface AttachmentFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

const EspaceCitoyen: React.FC = () => {
  const { user, userProfile } = useAuth();
  
  // Tab states: 'submit' (Default form), 'my-reports' (For logged-in users tracking)
  const [activeTab, setActiveTab] = useState<'submit' | 'my-reports'>('submit');
  
  // Tracking reports for authenticated users
  const [myReports, setMyReports] = useState<CitizenReport[]>([]);
  const [myReportsLoading, setMyReportsLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Actualités');
  const [location, setLocation] = useState('');
  
  // Selected files array
  const [isUrgent, setIsUrgent] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Populate info if user is logged in
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      setEmail(userProfile.email || '');
    }
  }, [userProfile]);

  // Read submitted reports for this user in real-time
  useEffect(() => {
    if (!user) {
      setMyReports([]);
      return;
    }

    setMyReportsLoading(true);
    const q = query(
      collection(db, 'citizen_reports'),
      where('userId', '==', user.uid)
    );

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
          userId: data.userId || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      // Sort newest first
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return bTime - aTime;
      });
      setMyReports(list);
      setMyReportsLoading(false);
    }, (error) => {
      console.error("Firestore listening user citizen reports failed:", error);
      setMyReportsLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'citizen_reports');
      } catch (errInfo: any) {
        showToast("Erreur d'accès aux signalements : " + errInfo.message, "error");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // File Upload Drag and Drop processing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const processFiles = (fileList: FileList) => {
    const fileLoadPromises: Promise<AttachmentFile>[] = [];

    // Max file size: 2MB to keep inline firestore payloads reasonably packaged
    const maxFileSize = 2.2 * 1024 * 1024; 

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // File type checks
      const allowedImage = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
      const allowedVideo = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
      const allowedDocs = ['application/pdf', 'application/msword', 'text/plain'];

      const isValidType = 
        allowedImage.includes(file.type) || 
        allowedVideo.includes(file.type) || 
        allowedDocs.includes(file.type);

      if (!isValidType) {
        showToast(`Format non pris en charge pour "${file.name}".`, 'error');
        continue;
      }

      if (file.size > maxFileSize) {
        showToast(`Le fichier "${file.name}" dépasse la taille limite autorisée (2 Mo max).`, 'error');
        continue;
      }

      // Read as DataUrl
      const reader = new FileReader();
      const loadPromise = new Promise<AttachmentFile>((resolve, reject) => {
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: event.target.result as string
            });
          } else {
            reject(new Error("Empty loaded asset"));
          }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(file);
      });

      fileLoadPromises.push(loadPromise);
    }

    if (fileLoadPromises.length === 0) return;

    setUploadProgress(true);
    Promise.all(fileLoadPromises)
      .then((loaded) => {
        setAttachments(prev => [...prev, ...loaded]);
        showToast(`${loaded.length} fichier(s) associé(s) !`, 'success');
      })
      .catch((err) => {
        console.error(err);
        showToast("Impossible de charger certains fichiers.", "error");
      })
      .finally(() => {
        setUploadProgress(false);
      });
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit report to Firebase
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !title.trim() || !description.trim() || !location.trim()) {
      showToast("Veuillez remplir tous les champs obligatoires (*).", "error");
      return;
    }

    // Split media files and docs 
    const isMedia = (type: string) => type.startsWith('image/') || type.startsWith('video/');
    const mediaUrls = attachments.filter(a => isMedia(a.type)).map(a => a.dataUrl);
    const supportingFilesUrls = attachments.filter(a => !isMedia(a.type)).map(a => a.dataUrl);

    const reportPayload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      title: title.trim(),
      description: description.trim(),
      category: category,
      location: location.trim(),
      mediaUrls,
      supportingFilesUrls,
      status: 'pending', // Pending admin moderation approval
      isUrgent: isUrgent,
      userId: user ? user.uid : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      setUploadProgress(true);
      await addDoc(collection(db, 'citizen_reports'), reportPayload);
      
      // Reset form variables
      setTitle('');
      setDescription('');
      setLocation('');
      setPhone('');
      setIsUrgent(false);
      setAttachments([]);

      showToast("Reportage citoyen soumis avec succès ! Notre équipe de modération va examiner vos informations.", "success");
      
      if (user) {
        // Redirect to track tab
        setActiveTab('my-reports');
      }
    } catch (err: any) {
      console.error("Citizen Submission Error:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'citizen_reports');
      } catch (errInfo: any) {
        showToast("Erreur lors de la soumission : " + errInfo.message, 'error');
      }
    } finally {
      setUploadProgress(false);
    }
  };

  return (
    <>
      <SEO 
        title="Espace Citoyen - Journalisme Participatif" 
        description="Devenez reporter pour la radio de la communauté ! Partagez vos exclusivités, alertes urgentes locales, photos, actualités ou événements."
      />

      {/* Toast notifications rendering */}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage('')} 
        />
      )}

      <div className="bg-slate-950 min-h-screen text-white pb-24 pt-12">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Page Title & Mission */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="bg-orange-600/10 text-orange-400 border border-orange-500/15 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest font-mono">
              📢 JOURNALISME CITOYEN ACTIF
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mt-3">
              Espace Citoyen
            </h1>
            <p className="text-slate-400 text-xs mt-2.5 font-medium leading-relaxed">
              Faites entendre votre voix ! Partagez des rapports exclusifs, alertes, photos d'événements, nouvelles ou vidéos culturelles pour enrichir l'information de Radio Sismique. Tout est vérifié par nos journalistes.
            </p>
          </div>

          {/* Tab buttons tracker */}
          <div className="flex border-b border-slate-900 justify-center mb-8">
            <button
              onClick={() => setActiveTab('submit')}
              className={`py-3.5 px-6 font-bold uppercase text-[11px] tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === 'submit'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              📝 Soumettre un Signalement
            </button>
            <button
              onClick={() => {
                if (!user) {
                  showToast("Veuillez vous connecter pour suivre l'historique de vos dépôts.", "error");
                  return;
                }
                setActiveTab('my-reports');
              }}
              className={`py-3.5 px-6 font-bold uppercase text-[11px] tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'my-reports'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              📌 Suivi de mes Soumissions
              {user && myReports.length > 0 && (
                <span className="bg-orange-500 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {myReports.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: SUBMISSION FORM */}
          {activeTab === 'submit' ? (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
              
              <div className="flex items-center space-x-2 text-xs font-bold text-orange-400 uppercase tracking-widest font-mono mb-6 pb-4 border-b border-slate-850">
                <FileText className="w-4 h-4 text-orange-500" />
                <span>FORMULAIRE DE SIGNALEMENT DIRECT</span>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-6">
                
                {/* Visual warning alerts about moderation */}
                <div className="p-4 bg-orange-600/5 border border-orange-550/15 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    <strong>Règle de publication :</strong> Pour préserver la rigueur de recherche journalistique, aucun message citoyen n'est diffusé automatiquement sans la relecture attentive d'un administrateur officiel de Radio Télévision Sismique.
                  </p>
                </div>

                {/* Submitter User basic details info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Votre Nom Complet <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Alcius Wood"
                      disabled={!!userProfile}
                      className="w-full bg-slate-950/60 border border-slate-800 disabled:opacity-60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Adresse Email <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: reporter@gmail.com"
                      disabled={!!userProfile}
                      className="w-full bg-slate-950/60 border border-slate-800 disabled:opacity-60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Numéro de Téléphone (Optionnel)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +509 3755-9080"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                    />
                  </div>
                </div>

                {/* Article core parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                  <div className="sm:col-span-8">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Titre du Signalement ou de la Nouvelle <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Événement culturel à Jacmel ce weekend"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4.5 py-3 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Catégorie Associée <span className="text-orange-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Local coordinates references */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Lieu ou Localisation Initiale <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex: Gonaïves, Département de l'Artibonite, Haïti"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                    />
                  </div>
                </div>

                {/* News Narrative */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Description & Faits Observés <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détaillez les circonstances avec le plus de précisions possible : Quoi ? Qui ? Quand ? Où ? Comment ?"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4.5 py-3 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                {/* File dragging section */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-2">
                    Ajouter des fichiers médias ou preuves d'appui (Images, Vidéos, Documents)
                  </label>
                  
                  <div className="border border-dashed border-slate-800 hover:border-orange-550/40 bg-slate-950/30 hover:bg-slate-950/60 transition-all rounded-2xl p-8 text-center relative flex flex-col items-center justify-center cursor-pointer group">
                    <input 
                      type="file" 
                      multiple
                      accept="image/*,video/*,application/pdf,text/plain"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-orange-400 transition-colors mb-3" />
                    <p className="text-xs font-bold text-slate-300">Glissez-déposez ou cliquez ici pour sélectionner des fichiers</p>
                    <p className="text-[10px] text-slate-600 mt-1 font-semibold">Formats autorisés : JPG, PNG, WEBP, MP4, MOV, WEBM, PDF. Taille max : 2 Mo par fichier.</p>
                  </div>

                  {/* Upload list preview widgets */}
                  {attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {attachments.map((file, idx) => {
                        const isImg = file.type.startsWith('image/');
                        const isVid = file.type.startsWith('video/');
                        
                        return (
                          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 relative flex flex-col group shadow-md">
                            
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white p-1 rounded-md opacity-90 transition-transform scale-90"
                              title="Retirer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            {/* Show image representation */}
                            <div className="h-20 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-850">
                              {isImg ? (
                                <img src={file.dataUrl} alt="preview" className="max-h-full max-w-full object-contain" />
                              ) : isVid ? (
                                <div className="flex flex-col items-center text-slate-500">
                                  <VideoIcon className="w-6 h-6 text-orange-500" />
                                  <span className="text-[8px] font-bold uppercase mt-1">Séquence</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-slate-500">
                                  <Paperclip className="w-6 h-6 text-sky-400" />
                                  <span className="text-[8px] font-bold uppercase mt-1">Fichier d'appui</span>
                                </div>
                              )}
                            </div>

                            <p className="text-[9px] text-slate-400 font-bold mt-2 truncate w-full" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[8px] text-slate-600 font-black font-mono">
                              {(file.size / 1024 / 1024).toFixed(2)} Mo
                            </p>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                {/* Signal urgent flag */}
                <div className="flex items-center p-3 bg-red-600/5 border border-red-500/10 rounded-2xl">
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-red-600 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500/10 peer-checked:border-red-500/25"></div>
                    <span className="ml-3 text-xs font-black uppercase text-red-400 peer-checked:text-red-500 flex items-center">
                      <Megaphone className="w-4 h-4 mr-1 animate-pulse" />
                      Signaler ce signalement comme hautement critique (Urgence nationale)
                    </span>
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end pt-4 border-t border-slate-850/80">
                  <button
                    type="submit"
                    disabled={uploadProgress}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/15 flex items-center space-x-2.5 disabled:opacity-50 cursor-pointer"
                  >
                    {uploadProgress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Création du dossier...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Transmettre mon dossier citoyen</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          ) : (
            /* TAB 2: MY TRACKING REPORTS SUBMISSIONS */
            <div className="space-y-6">
              
              <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-900">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  <span>Dossiers de journalisme de : <strong className="text-white">{userProfile?.fullName || 'Utilisateur'}</strong></span>
                </div>
                <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  {myReports.length} rapports soumis
                </span>
              </div>

              {myReportsLoading ? (
                <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-semibold">Récupération de vos archives citoyennes...</p>
                </div>
              ) : myReports.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/40 border border-slate-850 p-8 rounded-3xl flex flex-col items-center justify-center">
                  <span className="text-3xl mb-3">📰</span>
                  <p className="text-sm font-bold text-slate-400">Aucun signalement en cours.</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium max-w-sm leading-relaxed">
                    Vous n'avez pas encore soumis de reportage participatif dans cet espace. Remplissez le formulaire de transmission d'information pour commencer.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myReports.map((report) => {
                    
                    // State translations
                    let badgeColor = "bg-slate-950 text-slate-400 border-slate-800";
                    let label = "En attente";
                    
                    if (report.status === 'review') {
                      badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      label = "En cours d'étude";
                    } else if (report.status === 'approved') {
                      badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                      label = "Approuvé";
                    } else if (report.status === 'published') {
                      badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      label = "Publié comme article";
                    } else if (report.status === 'rejected') {
                      badgeColor = "bg-red-500/10 text-red-500 border-red-500/20";
                      label = "Écarté";
                    }

                    return (
                      <div 
                        key={report.id}
                        className="bg-slate-900 border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="p-1 px-2.5 bg-slate-950 text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-wide">
                              {report.category}
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                              {label}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-white uppercase text-sm tracking-tight leading-tight mb-2 truncate">
                            {report.title}
                          </h4>

                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3 mb-4">
                            {report.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-850/60 mt-auto flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold">
                          <p className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 mr-1.5" />
                            <span>Lieu : <strong className="text-slate-350">{report.location}</strong></span>
                          </p>

                          <p className="flex items-center font-mono mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-orange-500 mr-1.5" />
                            <span>Déposé le : {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'En attente'}</span>
                          </p>

                          {report.mediaUrls.length > 0 && (
                            <p className="text-emerald-500 text-[9px] font-extrabold flex items-center mt-1">
                              <ImageIcon className="w-3.5 h-3.5 mr-1" />
                              <span>{report.mediaUrls.length} image(s)/vidéo(s) de justification déposée(s)</span>
                            </p>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default EspaceCitoyen;
