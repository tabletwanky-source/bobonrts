import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Sponsor } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  MapPin, 
  Globe, 
  Sparkles,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Toast, { ToastType } from './Toast';

const AdminSponsorsManager: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Real-time listener for sponsors collection
  useEffect(() => {
    const sponsorsRef = collection(db, 'sponsors');
    
    const unsubscribe = onSnapshot(sponsorsRef, (snapshot) => {
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
      
      // Sort immediately by displayOrder ascending, then by createdAt descending
      list.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      
      setSponsors(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listening sponsors failed:", error);
      try {
        handleFirestoreError(error, OperationType.GET, 'sponsors');
      } catch (e: any) {
        showToast("Erreur d'accès aux sponsors: " + e.message, 'error');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Pre-fill form for editing or reset for adding
  const handleOpenAddForm = () => {
    setEditingSponsor(null);
    setName('');
    setImageUrl('');
    setDescription('');
    setWebsiteUrl('');
    setMapsUrl('');
    setIsActive(true);
    // Suggest displayOrder based on max existing order + 1
    const maxOrder = sponsors.length > 0 
      ? Math.max(...sponsors.map(s => s.displayOrder)) 
      : -1;
    setDisplayOrder(maxOrder + 1);
    setShowForm(true);
  };

  const handleOpenEditForm = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setName(sponsor.name);
    setImageUrl(sponsor.imageUrl);
    setDescription(sponsor.description);
    setWebsiteUrl(sponsor.websiteUrl || '');
    setMapsUrl(sponsor.mapsUrl || '');
    setIsActive(sponsor.isActive);
    setDisplayOrder(sponsor.displayOrder);
    setShowForm(true);
  };

  // Create or Update Sponsor Document
  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim() || !description.trim()) {
      showToast("Veuillez renseigner le nom, l'image et la description.", "error");
      return;
    }

    const payload = {
      name: name.trim(),
      imageUrl: imageUrl.trim(),
      description: description.trim(),
      websiteUrl: websiteUrl.trim(),
      mapsUrl: mapsUrl.trim(),
      isActive: isActive,
      displayOrder: Number(displayOrder),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingSponsor) {
        // Edit Mode
        const sponsorRef = doc(db, 'sponsors', editingSponsor.id);
        await updateDoc(sponsorRef, payload);
        showToast(`Le sponsor "${name}" a été mis à jour !`, 'success');
      } else {
        // Create Mode
        const newSponsorId = `sponsor_${Date.now()}`;
        const sponsorRef = doc(db, 'sponsors', newSponsorId);
        await setDoc(sponsorRef, {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast(`Le sponsor "${name}" a été ajouté avec succès !`, 'success');
      }
      setShowForm(false);
    } catch (err) {
      console.error("Error saving sponsor:", err);
      try {
        handleFirestoreError(err, editingSponsor ? OperationType.UPDATE : OperationType.CREATE, 'sponsors');
      } catch (e: any) {
        showToast("Erreur lors de l'enregistrement : " + e.message, 'error');
      }
    }
  };

  // Delete Sponsor Document
  const handleDeleteSponsor = async (sponsor: Sponsor) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le sponsor "${sponsor.name}" ?`)) return;
    try {
      await deleteDoc(doc(db, 'sponsors', sponsor.id));
      showToast(`Le sponsor "${sponsor.name}" a été supprimé.`, 'success');
    } catch (err) {
      console.error("Error deleting sponsor:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `sponsors/${sponsor.id}`);
      } catch (e: any) {
        showToast("Impossible de supprimer le sponsor : " + e.message, 'error');
      }
    }
  };

  // Toggle active helper
  const handleToggleActive = async (sponsor: Sponsor) => {
    try {
      const sponsorRef = doc(db, 'sponsors', sponsor.id);
      await updateDoc(sponsorRef, {
        isActive: !sponsor.isActive,
        updatedAt: serverTimestamp()
      });
      showToast(
        `Le sponsor "${sponsor.name}" est maintenant ${!sponsor.isActive ? 'actif' : 'inactif'}.`,
        'success'
      );
    } catch (err) {
      console.error("Error toggling sponsor state:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `sponsors/${sponsor.id}`);
      } catch (e: any) {
        showToast("Échec de la modification du statut : " + e.message, 'error');
      }
    }
  };

  // Move display order position up or down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const swapWithIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapWithIndex < 0 || swapWithIndex >= sponsors.length) return;

    const currentSponsor = sponsors[index];
    const otherSponsor = sponsors[swapWithIndex];

    try {
      const batch = writeBatch(db);
      
      const currentRef = doc(db, 'sponsors', currentSponsor.id);
      const otherRef = doc(db, 'sponsors', otherSponsor.id);

      // Swap their displayOrder values
      const currentOrder = currentSponsor.displayOrder;
      const otherOrder = otherSponsor.displayOrder;

      // Handle identical order collision fallback safely
      const finalCurrentOrder = currentOrder === otherOrder ? (direction === 'up' ? otherOrder - 1 : otherOrder + 1) : otherOrder;
      const finalOtherOrder = currentOrder;

      batch.update(currentRef, { displayOrder: finalCurrentOrder, updatedAt: serverTimestamp() });
      batch.update(otherRef, { displayOrder: finalOtherOrder, updatedAt: serverTimestamp() });

      await batch.commit();
      showToast("Ordre de présentation repositionné !", 'success');
    } catch (err) {
      console.error("Error swapping sponsor positions:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, 'sponsors');
      } catch (e: any) {
        showToast("Échec du repositionnement : " + e.message, 'error');
      }
    }
  };

  // Filter lists based on search
  const filteredSponsors = sponsors.filter(s => 
    s.name.toLowerCase().includes(searchText.toLowerCase()) || 
    s.description.toLowerCase().includes(searchText.toLowerCase())
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

      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center">
            <Sparkles className="w-5 h-5 text-orange-500 mr-2" />
            <span>Gestion des Sponsors Officiels</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gérez vos annonceurs et partenaires. Les modifications se répercutent instantanément sur la page d'accueil.
          </p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-orange-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Sponsor</span>
        </button>
      </div>

      {/* Main List & Controls */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs">Chargement des données publicitaires...</p>
        </div>
      ) : (
        <>
          {/* Filters/Search Row */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Rechercher par nom ou description..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {sponsors.length === 0 ? (
            <div className="py-20 text-center bg-slate-950/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-3xl mb-4">📢</span>
              <p className="text-sm font-semibold text-slate-400 mb-1">Aucun sponsor disponible actuellement.</p>
              <p className="text-xs text-slate-600 max-w-sm">
                Enregistrez un premier annonceur officiel pour faire apparaître le carrousel sur la page de couverture de Radio Sismique.
              </p>
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="py-12 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
              <p className="text-sm text-slate-500">Aucun résultat ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                    <th className="py-4 px-3 w-16">Ordre</th>
                    <th className="py-4 px-3">Logo</th>
                    <th className="py-4 px-3">Nom</th>
                    <th className="py-4 px-3 max-w-xs">Description</th>
                    <th className="py-4 px-3 text-center">Liens</th>
                    <th className="py-4 px-3">Statut</th>
                    <th className="py-4 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredSponsors.map((sponsor, index) => (
                    <tr key={sponsor.id} className="hover:bg-slate-950/20 transition-colors">
                      {/* Priority display order adjustments */}
                      <td className="py-4 px-3">
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-slate-400 w-4 block text-center font-mono">
                            {sponsor.displayOrder}
                          </span>
                          <div className="flex flex-col shrink-0">
                            <button
                              onClick={() => handleMoveOrder(index, 'up')}
                              disabled={index === 0}
                              className={`p-0.5 rounded hover:bg-slate-800 ${
                                index === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-orange-500 hover:text-white'
                              }`}
                              title="Monter"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(index, 'down')}
                              disabled={index === sponsors.length - 1}
                              className={`p-0.5 rounded hover:bg-slate-800 ${
                                index === sponsors.length - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-orange-500 hover:text-white'
                              }`}
                              title="Descendre"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Image Logo Preview */}
                      <td className="py-4 px-3">
                        <img 
                          src={sponsor.imageUrl} 
                          alt="Logo" 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-contain bg-slate-950/80 border border-slate-800 p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=300";
                          }}
                        />
                      </td>

                      {/* Name */}
                      <td className="py-4 px-3 font-semibold text-white whitespace-nowrap">
                        {sponsor.name}
                      </td>

                      {/* Description */}
                      <td className="py-4 px-3 max-w-xs text-slate-400 truncate" title={sponsor.description}>
                        {sponsor.description}
                      </td>

                      {/* Web and map links indicators */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex gap-2">
                          {sponsor.websiteUrl ? (
                            <a 
                              href={sponsor.websiteUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-1 px-2 bg-slate-800 hover:bg-orange-600 text-orange-400 hover:text-white rounded text-[10px] font-black flex items-center space-x-1"
                              title={sponsor.websiteUrl}
                            >
                              <Globe className="w-3 h-3" />
                              <span>Site</span>
                            </a>
                          ) : (
                            <span className="p-1 px-2 bg-slate-900 border border-slate-900 text-slate-700 rounded text-[10px]">aucun</span>
                          )}

                          {sponsor.mapsUrl ? (
                            <a 
                              href={sponsor.mapsUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-1 px-2 bg-slate-800 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[10px] font-black flex items-center space-x-1"
                              title={sponsor.mapsUrl}
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Carte</span>
                            </a>
                          ) : (
                            <span className="p-1 px-2 bg-slate-900 border border-slate-900 text-slate-700 rounded text-[10px]">aucun</span>
                          )}
                        </div>
                      </td>

                      {/* Activation Status */}
                      <td className="py-4 px-3">
                        <button
                          onClick={() => handleToggleActive(sponsor)}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            sponsor.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sponsor.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span>{sponsor.isActive ? 'Actif' : 'Inactif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditForm(sponsor)}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors border border-slate-800 hover:border-slate-700"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSponsor(sponsor)}
                            className="bg-red-950/20 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-red-400 hover:text-white p-2 rounded-lg transition-colors"
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
          )}
        </>
      )}

      {/* MODAL OVERLAY: ADD / EDIT SPONSOR DETAIL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden transition-all scale-100">
            {/* Ambient accent top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 via-purple-600 to-orange-600" />
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {editingSponsor ? '✏️ Modifier ' : '🤝 Ajouter '} un Sponsor Officiel
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSponsor} className="space-y-4">
                {/* Name field */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Nom du Sponsor <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Clinique Chirurgicale Sismique"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Cover / Logo Image representation */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Adresse URL du Logo / Image <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Ex: https://notresite.com/images/logo.png"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-1 pt-1">
                    <p className="text-[9px] uppercase font-black text-slate-500 mb-1 text-center">Aperçu</p>
                    <div className="w-full h-14 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden p-1.5">
                      {imageUrl.trim().startsWith('http') ? (
                        <img 
                          src={imageUrl.trim()} 
                          alt="Logo preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=300";
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-700 italic">Vide</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Description Courte <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Cabinet de cardiologie et soins intensifs ouvert 24h/24 en Floride."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>

                {/* Links layout row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center">
                      <Globe className="w-3.5 h-3.5 text-orange-500 mr-1" />
                      <span>Adresse Site Web (Optionnel)</span>
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="Ex: https://www.cliniquesismique.com"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 mr-1" />
                      <span>Lien Localisation Google Maps (Optionnel)</span>
                    </label>
                    <input
                      type="url"
                      value={mapsUrl}
                      onChange={(e) => setMapsUrl(e.target.value)}
                      placeholder="Ex: https://maps.app.goo.gl/..."
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Order and Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Ordre d'Affichage
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Number(e.target.value))}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                  </div>
                  <div className="flex items-center h-full pt-5">
                    <label className="relative flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-orange-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500/10 peer-checked:border-orange-500/25"></div>
                      <span className="ml-3 text-xs font-black uppercase text-slate-400 peer-checked:text-white">
                        {isActive ? 'Diffuser (Actif)' : 'Brouillon (Inactif)'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
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
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg hover:shadow-orange-500/15 flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingSponsor ? 'Actualiser' : 'Enregistrer'}</span>
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

export default AdminSponsorsManager;
