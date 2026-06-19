import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { DbProgram } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Sparkles,
  Search,
  Grid
} from 'lucide-react';
import Toast, { ToastType } from './Toast';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' }
];

const PROGRAM_CATEGORIES = [
  'Information',
  'Musique',
  'Politique',
  'Culture',
  'Sport',
  'Divertissement',
  'Société',
  'Religion',
  'Santé',
  'Autre'
];

const AdminProgramsManager: React.FC = () => {
  const [programs, setPrograms] = useState<DbProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DbProgram | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hostName, setHostName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [category, setCategory] = useState('Information');
  const [isActive, setIsActive] = useState(true);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Real-time listener for programs
  useEffect(() => {
    const programsRef = collection(db, 'programs');
    const unsubscribe = onSnapshot(programsRef, (snapshot) => {
      const list: DbProgram[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
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
          isActive: data.isActive ?? true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      // Sort: Day of week (1 to 6 then 0), then start time
      list.sort((a, b) => {
        // Map 0 (Sunday) to 7 for chronological sorting starting from Monday
        const valA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
        const valB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
        if (valA !== valB) return valA - valB;
        return a.startTime.localeCompare(b.startTime);
      });
      
      setPrograms(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listening programs failed:", error);
      showToast("Impossible de charger les programmes : " + error.message, 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Open add form
  const handleOpenAddForm = () => {
    setEditingProgram(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setHostName('');
    setDayOfWeek(1);
    setStartTime('08:00');
    setEndTime('09:00');
    setCategory('Information');
    setIsActive(true);
    setShowForm(true);
  };

  // Open edit form
  const handleOpenEditForm = (prog: DbProgram) => {
    setEditingProgram(prog);
    setTitle(prog.title);
    setDescription(prog.description);
    setImageUrl(prog.imageUrl);
    setHostName(prog.hostName);
    setDayOfWeek(prog.dayOfWeek);
    setStartTime(prog.startTime);
    setEndTime(prog.endTime);
    setCategory(prog.category);
    setIsActive(prog.isActive);
    setShowForm(true);
  };

  // Duplicate program helper
  const handleDuplicateProgram = async (prog: DbProgram) => {
    try {
      const newId = `prog_dup_${Date.now()}`;
      const progRef = doc(db, 'programs', newId);
      const duplicatePayload = {
        title: `${prog.title} (Copie)`,
        description: prog.description,
        imageUrl: prog.imageUrl,
        hostName: prog.hostName,
        dayOfWeek: prog.dayOfWeek,
        startTime: prog.startTime,
        endTime: prog.endTime,
        category: prog.category,
        isActive: prog.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(progRef, duplicatePayload);
      showToast(`Le programme "${prog.title}" a été dupliqué !`, 'success');
    } catch (err: any) {
      console.error("Error duplicating program:", err);
      showToast("Impossible de dupliquer : " + err.message, 'error');
    }
  };

  // Create or Update Program
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hostName.trim() || !startTime || !endTime) {
      showToast("Veuillez remplir le titre, l'animateur et les horaires.", "error");
      return;
    }

    // Basic time format validation "HH:MM"
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      showToast("Les horaires doivent être de format valide (ex: 14:30)", "error");
      return;
    }

    if (startTime >= endTime) {
      showToast("L'heure de début doit être antérieure à l'heure de fin.", "error");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400",
      hostName: hostName.trim(),
      dayOfWeek: Number(dayOfWeek),
      startTime: startTime,
      endTime: endTime,
      category,
      isActive,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProgram) {
        const progRef = doc(db, 'programs', editingProgram.id);
        await updateDoc(progRef, payload);
        showToast(`Le programme "${title}" a été mis à jour !`, 'success');
      } else {
        const newId = `prog_${Date.now()}`;
        const progRef = doc(db, 'programs', newId);
        await setDoc(progRef, {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast(`Le programme "${title}" a été planifié avec succès !`, 'success');
      }
      setShowForm(false);
    } catch (err: any) {
      console.error("Error saving program:", err);
      showToast("Erreur lors de la sauvegarde : " + err.message, 'error');
    }
  };

  // Delete program
  const handleDeleteProgram = async (prog: DbProgram) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'émission "${prog.title}" ?`)) return;
    try {
      await deleteDoc(doc(db, 'programs', prog.id));
      showToast(`L'émission "${prog.title}" a été retirée de la grille.`, 'success');
    } catch (err: any) {
      console.error("Error deleting program:", err);
      showToast("Suppression impossible : " + err.message, 'error');
    }
  };

  // Quick state toggling
  const handleToggleActive = async (prog: DbProgram) => {
    try {
      const progRef = doc(db, 'programs', prog.id);
      await updateDoc(progRef, {
        isActive: !prog.isActive,
        updatedAt: serverTimestamp()
      });
      showToast(`Programme "${prog.title}" ${!prog.isActive ? 'activé' : 'désactivé'}.`, 'success');
    } catch (err: any) {
      console.error("Error toggling program state:", err);
      showToast("Erreur de statut : " + err.message, 'error');
    }
  };

  // Filters logic
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchText.toLowerCase()) || 
      p.hostName.toLowerCase().includes(searchText.toLowerCase()) || 
      p.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDay = dayFilter === 'all' || p.dayOfWeek === Number(dayFilter);
    return matchesSearch && matchesDay;
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
            <Calendar className="w-5 h-5 text-orange-500 mr-2" />
            <span>Grille des Programmes Hebdomadaires</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gérez et planifiez les émissions de Radio Télévision Sismique. Les auditeurs voient les émissions en temps réel.
          </p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-orange-500/15 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Planifier une Émission</span>
        </button>
      </div>

      {/* Search & Day filter controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text"
            placeholder="Rechercher par émission, animateur, description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
          />
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <label className="text-[10px] uppercase font-black text-slate-400 shrink-0">Filtrer par jour :</label>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
          >
            <option value="all">Tous les jours</option>
            {DAYS_OF_WEEK.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid view/Table view */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-semibold">Récupération de la grille de diffusion...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="py-20 text-center bg-slate-950/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-3xl mb-4">📻</span>
          <p className="text-sm font-semibold text-slate-400 mb-1">Aucune émission planifiée.</p>
          <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
            Configurez vos émissions de radio et télévision en définissant leurs tranches horaires, jours de programmation et animateurs.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                <th className="py-4 px-3">Jour</th>
                <th className="py-4 px-3">Horaires</th>
                <th className="py-4 px-3">Émission</th>
                <th className="py-4 px-3">Animateur</th>
                <th className="py-4 px-3">Catégorie</th>
                <th className="py-4 px-3">Diffusion</th>
                <th className="py-4 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPrograms.map((prog) => {
                const dayObj = DAYS_OF_WEEK.find(d => d.value === prog.dayOfWeek);
                return (
                  <tr key={prog.id} className="hover:bg-slate-950/20 transition-colors">
                    {/* Day */}
                    <td className="py-4 px-3 font-bold text-orange-400 uppercase tracking-widest text-[10px] font-mono">
                      {dayObj?.label || 'Inconnu'}
                    </td>

                    {/* Schedule times */}
                    <td className="py-4 px-3">
                      <div className="flex items-center text-white font-mono font-bold whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-xs text-slate-500 mr-1.5" />
                        <span>{prog.startTime} - {prog.endTime}</span>
                      </div>
                    </td>

                    {/* Program details */}
                    <td className="py-4 px-3 max-w-xs">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={prog.imageUrl} 
                          alt={prog.title} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate" title={prog.title}>{prog.title}</p>
                          <p className="text-[10px] text-slate-500 truncate" title={prog.description}>{prog.description}</p>
                        </div>
                      </div>
                    </td>

                    {/* Host */}
                    <td className="py-4 px-3 font-semibold text-slate-300 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-3 h-3 text-slate-500 mr-1" />
                        <span>{prog.hostName}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="p-1 px-2.5 bg-slate-950 text-slate-400 rounded-lg border border-slate-850 text-[10px] font-black uppercase">
                        {prog.category}
                      </span>
                    </td>

                    {/* Active Checkbox */}
                    <td className="py-4 px-3">
                      <button
                        onClick={() => handleToggleActive(prog)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          prog.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${prog.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span>{prog.isActive ? 'Actif' : 'Masqué'}</span>
                      </button>
                    </td>

                    {/* CRUD Actions */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleDuplicateProgram(prog)}
                          className="bg-slate-800 hover:bg-slate-700 text-orange-400 p-2 rounded-lg transition-colors border border-slate-800"
                          title="Dupliquer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(prog)}
                          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors border border-slate-800"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(prog)}
                          className="bg-red-950/20 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-red-400 hover:text-white p-2 rounded-lg transition-colors"
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

      {/* POPUP SCHEDULE FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden transition-all scale-100">
            {/* Ambient Line decoration */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 via-purple-600 to-orange-600" />
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center">
                  <Grid className="w-5 h-5 text-orange-500 mr-2" />
                  <span>{editingProgram ? '✏️ Éditer ' : '📻 Planifier '} une Émission</span>
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProgram} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Titre de l'émission <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Le Club de la Radio"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Host Name and category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Nom de l'animateur / Hôte <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Ex: Jean Michel"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Catégorie <span className="text-orange-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors font-bold"
                    >
                      {PROGRAM_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cover representation url */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      URL de l'image de couverture
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Ex: https://photos.unsplash.com/promo.png"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-1 pt-1">
                    <p className="text-[9px] uppercase font-black text-slate-500 mb-1 text-center">Aperçu</p>
                    <div className="w-full h-14 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden p-1">
                      {imageUrl.trim().startsWith('http') ? (
                        <img 
                          src={imageUrl.trim()} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-700 italic">Vide</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule planner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Jour de la Semaine <span className="text-orange-500">*</span>
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(Number(e.target.value))}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors font-bold"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Heure de Début <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: 14:00"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                      Heure de Fin <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: 15:30"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                    Description de l'émission
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez les thématiques, chroniques et invités de l'émission..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>

                {/* Activation status */}
                <div className="flex items-center pt-2">
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-orange-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500/10 peer-checked:border-orange-500/25"></div>
                    <span className="ml-3 text-xs font-black uppercase text-slate-400 peer-checked:text-white">
                      {isActive ? 'Actif - Diffuser immédiatement' : 'Brouillon - Masquer pour le moment'}
                    </span>
                  </label>
                </div>

                {/* Buttons */}
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
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg hover:shadow-orange-500/15 flex items-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingProgram ? 'Enregistrer les modifications' : 'Créer l\'émission'}</span>
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

export default AdminProgramsManager;
