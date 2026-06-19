import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { BreakingNewsAlert } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Flame, 
  BellRing,
  Pin,
  Clock,
  ExternalLink,
  ShieldAlert,
  Search
} from 'lucide-react';
import Toast, { ToastType } from './Toast';

const PRIORITIES = [
  { value: 'low', label: 'Faible (Bleu)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'medium', label: 'Modéré (Orange)', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'high', label: 'Urgent (Rouge)', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
];

const AdminBreakingNewsManager: React.FC = () => {
  const [alerts, setAlerts] = useState<BreakingNewsAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<BreakingNewsAlert | null>(null);
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [expiresAtInput, setExpiresAtInput] = useState(''); // Date and time input string
  const [isActive, setIsActive] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Listen to breaking news alerts collection
  useEffect(() => {
    const alertsRef = collection(db, 'breaking_news');
    const unsubscribe = onSnapshot(alertsRef, (snapshot) => {
      const list: BreakingNewsAlert[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Handle expiresAt either timestamp or custom formats
        let expDate = null;
        if (data.expiresAt) {
          if (data.expiresAt.toDate) {
            expDate = data.expiresAt.toDate();
          } else {
            expDate = new Date(data.expiresAt);
          }
        }

        list.push({
          id: docSnap.id,
          title: data.title || '',
          message: data.message || '',
          link: data.link || '',
          priority: data.priority || 'high',
          isActive: data.isActive ?? true,
          isPinned: data.isPinned ?? false,
          createdAt: data.createdAt,
          expiresAt: expDate
        });
      });
      
      // Sort: pinned first, then newest first
      list.sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime;
      });
      
      setAlerts(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listening alerts failed:", error);
      showToast("Impossible de charger les alertes : " + error.message, 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAddForm = () => {
    setEditingAlert(null);
    setTitle('🚨 DERNIÈRE MINUTE');
    setMessage('');
    setLink('');
    setPriority('high');
    
    // Default expiration: 2 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const tzoffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    setExpiresAtInput(localISOTime);
    
    setIsActive(true);
    setIsPinned(false);
    setShowForm(true);
  };

  const handleOpenEditForm = (alert: BreakingNewsAlert) => {
    setEditingAlert(alert);
    setTitle(alert.title);
    setMessage(alert.message);
    setLink(alert.link || '');
    setPriority(alert.priority);
    
    if (alert.expiresAt) {
      const tzoffset = alert.expiresAt.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(alert.expiresAt.getTime() - tzoffset)).toISOString().slice(0, 16);
      setExpiresAtInput(localISOTime);
    } else {
      setExpiresAtInput('');
    }
    
    setIsActive(alert.isActive);
    setIsPinned(alert.isPinned);
    setShowForm(true);
  };

  // Create or Update Alert
  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !expiresAtInput) {
      showToast("Veuillez renseigner le titre de l'alerte, le message et une date d'expiration.", "error");
      return;
    }

    const expDate = new Date(expiresAtInput);
    if (expDate <= new Date()) {
      showToast("La date d'expiration doit se situer dans le futur.", "error");
      return;
    }

    const payload = {
      title: title.trim(),
      message: message.trim(),
      link: link.trim(),
      priority,
      expiresAt: expDate.toISOString(), // Standard date format for simple storage
      isActive,
      isPinned,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingAlert) {
        const alertRef = doc(db, 'breaking_news', editingAlert.id);
        await updateDoc(alertRef, payload);
        showToast(`L'alerte flash de dernière minute a été mise à jour !`, 'success');
      } else {
        const newId = `alert_${Date.now()}`;
        const alertRef = doc(db, 'breaking_news', newId);
        await setDoc(alertRef, {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast(`L'alerte flash de dernière minute a été diffusée !`, 'success');
      }
      setShowForm(false);
    } catch (err: any) {
      console.error("Error saving alert:", err);
      showToast("Erreur d'enregistrement : " + err.message, 'error');
    }
  };

  // Delete alert
  const handleDeleteAlert = async (alert: BreakingNewsAlert) => {
    if (!window.confirm(`Voulez-vous supprimer cette alerte : "${alert.message}" ?`)) return;
    try {
      await deleteDoc(doc(db, 'breaking_news', alert.id));
      showToast("Alerte flash supprimée avec succès.", "success");
    } catch (err: any) {
      console.error("Error deleting alert:", err);
      showToast("Impossible de supprimer : " + err.message, 'error');
    }
  };

  // Toggle toggle-states
  const handleTogglePinned = async (alert: BreakingNewsAlert) => {
    try {
      const alertRef = doc(db, 'breaking_news', alert.id);
      await updateDoc(alertRef, {
        isPinned: !alert.isPinned,
        updatedAt: serverTimestamp()
      });
      showToast(alert.isPinned ? "Alerte détachée." : "Alerte épinglée en haut !", 'success');
    } catch (err: any) {
      console.error("Error pinning alert:", err);
      showToast("Status pin impossible : " + err.message, 'error');
    }
  };

  const handleToggleActive = async (alert: BreakingNewsAlert) => {
    try {
      const alertRef = doc(db, 'breaking_news', alert.id);
      await updateDoc(alertRef, {
        isActive: !alert.isActive,
        updatedAt: serverTimestamp()
      });
      showToast(`Alerte ${!alert.isActive ? 'réactivée' : 'suspendue'}.`, 'success');
    } catch (err: any) {
      console.error("Error status action:", err);
      showToast("Statut impossible : " + err.message, 'error');
    }
  };

  const filteredAlerts = alerts.filter(a => 
    a.title.toLowerCase().includes(searchText.toLowerCase()) ||
    a.message.toLowerCase().includes(searchText.toLowerCase())
  );

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
            <ShieldAlert className="w-5 h-5 text-red-500 mr-2 animate-pulse" />
            <span>Gestion des Alertes de Dernière Minute (Breaking News)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Émettez et gérez les flash d'informations d'urgence. Ces alertes s'affichent sous forme de bandeau défilant au sommet du site internet en temps réel.
          </p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-red-500/15 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Flash Info</span>
        </button>
      </div>

      {/* Search Input bar */}
      <div className="mb-6 relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <input 
          type="text"
          placeholder="Filtrer les flash infos..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-medium"
        />
      </div>

      {/* Grid view/Table view */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-semibold">Récupération des bandeaux d'information...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-20 text-center bg-slate-950/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-3xl mb-4">🚨</span>
          <p className="text-sm font-semibold text-slate-400 mb-1">Aucun flash d'information en cours.</p>
          <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
            Créez une alerte rouge de dernière minute pour annoncer des informations d'importance capitale pour Radio Télévision Sismique.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                <th className="py-4 px-3 w-8">Pin</th>
                <th className="py-4 px-3">Statut/Urgence</th>
                <th className="py-4 px-3">Alerte d'information</th>
                <th className="py-4 px-3">Expire le</th>
                <th className="py-4 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAlerts.map((alert) => {
                const priorityItem = PRIORITIES.find(p => p.value === alert.priority) || PRIORITIES[2];
                const isExpired = alert.expiresAt && alert.expiresAt < new Date();
                
                return (
                  <tr key={alert.id} className={`hover:bg-slate-950/20 transition-colors ${isExpired ? 'opacity-50' : ''}`}>
                    {/* Pin Status */}
                    <td className="py-4 px-3">
                      <button
                        onClick={() => handleTogglePinned(alert)}
                        className={`p-1.5 rounded-lg transition-transform hover:scale-110 ${
                          alert.isPinned ? 'text-red-500' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title={alert.isPinned ? "Détacher du haut" : "Épingler en première place"}
                      >
                        <Pin className="w-4 h-4 fill-current" />
                      </button>
                    </td>

                    {/* Status & Priority Badge */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${priorityItem.color}`}>
                          {priorityItem.label.split(' ')[0]}
                        </span>
                        
                        {isExpired ? (
                          <span className="bg-red-950/40 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider border border-red-950">
                            Expiré
                          </span>
                        ) : alert.isActive ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider border border-emerald-500/20">
                            Actif
                          </span>
                        ) : (
                          <span className="bg-slate-950 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider border border-slate-800">
                            Suspendu
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Content detail */}
                    <td className="py-4 px-3 max-w-md">
                      <div className="flex flex-col">
                        <span className="font-bold text-red-400 font-mono text-[10px] tracking-widest uppercase flex items-center">
                          <Flame className="w-3 h-3 text-red-500 mr-1 animate-pulse" />
                          {alert.title}
                        </span>
                        <p className="font-black text-white text-xs mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                        {alert.link && (
                          <a 
                            href={alert.link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-slate-500 hover:text-orange-400 text-[10px] font-bold mt-1 inline-flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Lien externe associé</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Time limit */}
                    <td className="py-4 px-3 font-mono font-bold text-slate-400 whitespace-nowrap">
                      <div className="flex items-center text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-600 mr-1.5" />
                        <span>
                          {alert.expiresAt ? alert.expiresAt.toLocaleString('fr-FR') : 'Inconnu'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleToggleActive(alert)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg border border-slate-800"
                          title={alert.isActive ? "Désactiver" : "Activer"}
                        >
                          <BellRing className={`w-3.5 h-3.5 ${alert.isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(alert)}
                          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-800"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert)}
                          className="bg-red-950/20 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-red-400 hover:text-white p-2 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* POPUP ALERT FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-orange-600 to-red-600" />
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center">
                  <Flame className="w-5 h-5 text-red-500 mr-2 animate-bounce" />
                  <span>{editingAlert ? '✏️ Modifier l' : '🚨 Émettre un'} Alerte Info</span>
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAlert} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Alert Header/Tagline */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      En-tête de l'Alerte <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: 🚨 DERNIÈRE MINUTE ou ⚠️ FLASH INFO"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  {/* Priority level */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Niveau d'Urgence / Gravité <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors font-bold"
                    >
                      {PRIORITIES.map(priv => (
                        <option key={priv.value} value={priv.value}>{priv.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Message d'Information Flash <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Entrez le texte capital à diffuser. Soyez concis et percutant..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors resize-none font-bold"
                  />
                </div>

                {/* Optional link */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Lien Web de Redirection (Optionnel)
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://radiotelevisionsismique.com/articles/news-du-jour"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                {/* Expiration date */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Délai d'Expiration (Disparition automatique) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={expiresAtInput}
                    onChange={(e) => setExpiresAtInput(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-bold font-mono transition-colors"
                  />
                </div>

                {/* Pinned / Active Switchers */}
                <div className="flex flex-wrap gap-6 pt-2">
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-red-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500/10 peer-checked:border-red-500/25"></div>
                    <span className="ml-3 text-xs font-black uppercase text-slate-400 peer-checked:text-white flex items-center">
                      <Pin className="w-3.5 h-3.5 mr-1 fill-current" />
                      Épingler l'alerte
                    </span>
                  </label>

                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-red-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500/10 peer-checked:border-red-500/25"></div>
                    <span className="ml-3 text-xs font-black uppercase text-slate-400 peer-checked:text-white">
                      Diffuser maintenant
                    </span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl border border-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg hover:shadow-red-500/15 flex items-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingAlert ? 'Sauvegarder l\'alerte' : 'Émettre l\'alerte rouge'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBreakingNewsManager;
