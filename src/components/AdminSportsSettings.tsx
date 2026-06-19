import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Settings2, 
  Eye, 
  EyeOff, 
  Save, 
  Plus, 
  Trash2, 
  Flag,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { db } from '../lib/firebase';

interface AdminSportsSettingsProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

const AVAILABLE_LEAGUES = [
  { code: 'PL', name: 'Premier League (Angleterre)', icon: '🇬🇧' },
  { code: 'PD', name: 'La Liga (Espagne)', icon: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga (Allemagne)', icon: '🇩🇪' },
  { code: 'SA', name: 'Serie A (Italie)', icon: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1 (France)', icon: '🇫🇷' },
  { code: 'CL', name: 'UEFA Champions League', icon: '🏆' },
  { code: 'WC', name: 'FIFA World Cup (Coupe du Monde)', icon: '🌍' },
  { code: 'DED', name: 'Eredivisie (Pays-Bas)', icon: '🇳🇱' },
  { code: 'PPL', name: 'Primeira Liga (Portugal)', icon: '🇵🇹' },
  { code: 'BSA', name: 'Brasileirão (Brésil)', icon: '🇧🇷' }
];

export const AdminSportsSettings: React.FC<AdminSportsSettingsProps> = ({ showToast }) => {
  // Config state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [enabledLeagues, setEnabledLeagues] = useState<string[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(60);
  
  // sportsConfig variables
  const [enabled, setEnabled] = useState(true);
  const [provider, setProvider] = useState("football-data.org");
  const [apiBaseUrl, setApiBaseUrl] = useState("https://api.football-data.org/v4");
  const [cacheMinutes, setCacheMinutes] = useState(15);
  
  // Custom Haiti matches
  const [haitiMatches, setHaitiMatches] = useState<any[]>([]);
  
  // New Haiti match form state
  const [opponent, setOpponent] = useState('');
  const [isHome, setIsHome] = useState(true);
  const [competition, setCompetition] = useState('Éliminatoires Coupe du Monde');
  const [matchDate, setMatchDate] = useState('');
  const [status, setStatus] = useState('SCHEDULED'); // SCHEDULED, FINISHED
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Load configs
  useEffect(() => {
    const loadSportsConfig = async () => {
      try {
        setLoading(true);
        // Load settings/sports
        const configRes = await fetch('/api/sports/config');
        if (configRes.ok) {
          const config = await configRes.json();
          setEnabledLeagues(config.enabledCompetitions || []);
          setRefreshInterval(config.refreshInterval || 60);
          setHaitiMatches(config.customHaitiFixtures || []);
          
          // Populate sportsConfig values
          setEnabled(config.enabled !== undefined ? config.enabled : true);
          setProvider(config.provider || "football-data.org");
          setApiBaseUrl(config.apiBaseUrl || "https://api.football-data.org/v4");
          setCacheMinutes(config.cacheMinutes !== undefined ? config.cacheMinutes : (config.refreshInterval ? Math.round(config.refreshInterval / 60) : 15));
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to load sports config in admin:", err);
        showToast("Erreur lors de la récupération des paramètres sportifs.", "error");
        setLoading(false);
      }
    };

    loadSportsConfig();
  }, []);

  // Save secure API key
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;

    try {
      setSavingKey(true);
      
      // We pass the logged in admin user's JWT ID Token in Authorization header
      const idToken = window.sessionStorage.getItem('idToken') || ''; 
      // If session storage lacks ID token, let's get it from firebase auth
      let bearerToken = idToken;
      try {
        const { auth } = await import('../lib/firebase');
        if (auth.currentUser) {
          bearerToken = await auth.currentUser.getIdToken(true);
        }
      } catch (e) {
        console.warn("Could not retrieve fresh ID token:", e);
      }

      const res = await fetch('/api/sports/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify({ apiKey })
      });

      if (!res.ok) throw new Error("API-KEY-SAVE-FAILED");
      
      showToast("La clé API de football-data.org a été enregistrée de manière sécurisée !", "success");
      setApiKey('');
    } catch (err) {
      console.error(err);
      showToast("Droit d'administration requis ou échec de communication.", "error");
    } finally {
      setSavingKey(false);
    }
  };

  // Toggle championship checks
  const handleLeagueToggle = (code: string) => {
    setEnabledLeagues((prev) => 
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Add a Haiti match
  const handleAddHaitiMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent || !matchDate) {
      showToast("Veuillez renseigner un adversaire et une date.", "error");
      return;
    }

    const newMatch = {
      id: Date.now(),
      opponent: opponent.trim(),
      isHome,
      competition: competition.trim(),
      date: matchDate,
      utcDate: new Date(matchDate).toISOString(),
      status,
      teamScore: Number(teamScore),
      opponentScore: Number(opponentScore)
    };

    setHaitiMatches((prev) => [...prev, newMatch]);
    
    // Reset form
    setOpponent('');
    setMatchDate('');
    setTeamScore(0);
    setOpponentScore(0);
    setStatus('SCHEDULED');

    showToast("Rencontre ajoutée à la liste (cliquez sur Enregistrer pour persister) ! ", "success");
  };

  // Remove Haiti match from list
  const handleRemoveHaitiMatch = (id: number) => {
    setHaitiMatches((prev) => prev.filter((m) => m.id !== id));
    showToast("Rencontre retirée de la liste.", "info");
  };

  // Save entire settings/sports config
  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      
      const payload = {
        enabled,
        provider,
        apiBaseUrl,
        cacheMinutes: Number(cacheMinutes),
        enabledCompetitions: enabledLeagues,
        refreshInterval: Number(cacheMinutes * 60), // Match refresh interval to cache minutes
        customHaitiFixtures: haitiMatches
      };

      // Apply locally immediately
      const { updateSportsConfig } = await import('../config/sportsConfig');
      updateSportsConfig({
        enabled,
        provider,
        apiBaseUrl,
        cacheMinutes: Number(cacheMinutes),
      });

      let bearerToken = '';
      try {
        const { auth } = await import('../lib/firebase');
        if (auth.currentUser) {
          bearerToken = await auth.currentUser.getIdToken();
        }
      } catch (e) {
        console.warn(e);
      }

      const res = await fetch('/api/sports/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("CONFIG-SAVE-FAILED");

      showToast("La configuration sportive a été enregistrée avec succès !", "success");
    } catch (err) {
      console.error(err);
      showToast("Échec de sauvegarde des paramètres.", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto mb-2" />
        Chargement des configurations sportives...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-slate-200">
      
      {/* Overview Head */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <Settings2 className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-tight">Paramètres du Centre Sportif</h3>
            <p className="text-slate-400 text-xs font-semibold">Gérez les authentifications, ligues supportées et entrées pour Haïti.</p>
          </div>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={savingConfig}
          className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center space-x-1.5 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{savingConfig ? "Enregistrement..." : "Enregistrer tout"}</span>
        </button>
      </div>

      {/* 1. Secure API Key Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>⚙️</span> Clé API Football-Data.Org
        </h4>
        <p className="text-xs text-slate-450 leading-relaxed max-w-2xl font-semibold">
          Pour des raisons de sécurité, la clé API n'est jamais exposée sur le front-end. Saisissez votre nouvelle clé ci-dessous pour la crypter et l'enregistrer dans nos coffres-forts Firestore.
        </p>

        <form onSubmit={handleSaveApiKey} className="flex gap-3 max-w-xl">
          <div className="relative flex-grow">
            <input 
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Saisissez la clé API secrète..."
              className="w-full bg-slate-950 border border-slate-800 font-bold focus:border-orange-500 rounded-xl py-2.5 pl-4 pr-10 text-xs text-slate-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={savingKey || !apiKey}
            className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-orange-500 hover:text-orange-400 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl duration-200 shrink-0"
          >
            {savingKey ? "Cryptage..." : "Enregistrer Clé"}
          </button>
        </form>
      </div>

      {/* Configuration Dynamique de l'API sportive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>⚙️</span> Configuration Globale du Centre Sportif
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-400">Statut du Module Sportif</label>
            <div className="flex items-center space-x-3 bg-slate-950 border border-slate-850 p-3 rounded-xl">
              <input
                type="checkbox"
                id="sportsEnabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer animate-pulse"
              />
              <label htmlFor="sportsEnabled" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                {enabled ? '✅ Module Actif' : '❌ Module Désactivé (les requêtes renverront indisponible)'}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-400">Fournisseur de Données (Provider)</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 text-xs font-bold text-slate-300 p-3 rounded-xl focus:outline-none focus:border-orange-500"
            >
              <option value="football-data.org">football-data.org</option>
              <option value="api-football">api-football (Alternative)</option>
            </select>
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-xs font-black uppercase text-slate-400">URL de Base de l'API (apiBaseUrl)</label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 p-3 rounded-xl focus:outline-none focus:border-orange-500"
              placeholder="https://api.football-data.org/v4"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-400">Durée du Cache (minutes)</label>
            <input
              type="number"
              value={cacheMinutes}
              onChange={(e) => setCacheMinutes(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-850 text-xs font-bold text-slate-300 p-3 rounded-xl focus:outline-none focus:border-orange-500"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* 2. League Activator Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500" /> Activation des championnats
        </h4>
        <p className="text-xs text-slate-450 font-semibold leading-relaxed">
          Cochez les compétitions autorisées à être explorées par le public. (La formule gratuite restreint à ces 10 compétitions majeures).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 pt-2">
          {AVAILABLE_LEAGUES.map((l) => {
            const checked = enabledLeagues.includes(l.code);
            return (
              <div 
                key={l.code}
                onClick={() => handleLeagueToggle(l.code)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-center gap-2 select-none justify-between ${
                  checked 
                    ? 'bg-orange-600/10 border-orange-500/40 text-white' 
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-sm shrink-0">{l.icon}</span>
                  <span className="text-xs font-bold truncate">{l.name}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={checked}
                  onChange={() => {}} // toggled on container click
                  className="accent-orange-500 rounded border-slate-800 shrink-0 pointer-events-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Haiti Fixtures Curator Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-4 gap-3">
          <div>
            <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <span>🇭🇹</span> Gestion des Rencontres d'Haïti (FHF)
            </h4>
            <p className="text-xs text-slate-450 font-semibold mt-1">
              Puisque l'API de football gratuit n'intègre pas les dates de la CONCACAF, enregistrez manuellement les dates réelles ou résultats des Grenadiers.
            </p>
          </div>
          <span className="bg-white/5 border border-white/10 text-orange-400 font-bold text-[10px] uppercase py-1 px-3 rounded-full shrink-0">
            {haitiMatches.length} Rencontre(s)
          </span>
        </div>

        {/* Add Match Form inside layout */}
        <form onSubmit={handleAddHaitiMatch} className="bg-slate-950/50 border border-slate-850 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-12 font-black text-xs text-orange-500 uppercase tracking-wider pb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-bounce" />
            <span>Formulaire d'ajout rapide</span>
          </div>

          <div className="col-span-12 sm:col-span-4 space-y-1.5">
            <label className="block text-[10px] text-slate-450 font-black uppercase">Adversaire</label>
            <input 
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="e.g. Jamaïque"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="col-span-12 sm:col-span-4 space-y-1.5">
            <label className="block text-[10px] text-slate-450 font-black uppercase">Championnat / Étape</label>
            <input 
              type="text"
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              placeholder="e.g. Éliminatoires Coupe du Monde"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="col-span-12 sm:col-span-4 space-y-1.5">
            <label className="block text-[10px] text-slate-450 font-black uppercase">Date & Heure du Match</label>
            <input 
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="col-span-12 sm:col-span-3 space-y-1.5">
            <label className="block text-[10px] text-slate-450 font-black uppercase">Lieu</label>
            <select
              value={isHome ? "true" : "false"}
              onChange={(e) => setIsHome(e.target.value === "true")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="true">🏡 À Domicile (Haïti)</option>
              <option value="false">✈️ À l'Extérieur (Visiteur)</option>
            </select>
          </div>

          <div className="col-span-12 sm:col-span-3 space-y-1.5">
            <label className="block text-[10px] text-slate-450 font-black uppercase">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="SCHEDULED">⏰ Planifié</option>
              <option value="FINISHED">✅ Terminé / Joué</option>
            </select>
          </div>

          <div className="col-span-6 sm:col-span-2 space-y-1.5">
            <label className="block text-[10px] text-slate-450 font-black uppercase">Buts Haïti</label>
            <input 
              type="number"
              min="0"
              value={teamScore}
              onChange={(e) => setTeamScore(Number(e.target.value))}
              disabled={status === 'SCHEDULED'}
              className="w-full bg-slate-950 border border-slate-800 disabled:opacity-40 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="col-span-6 sm:col-span-2 space-y-1.5">
            <label className="block text-[10px] text-slate-450 font-black uppercase">Buts Adversaire</label>
            <input 
              type="number"
              min="0"
              value={opponentScore}
              onChange={(e) => setOpponentScore(Number(e.target.value))}
              disabled={status === 'SCHEDULED'}
              className="w-full bg-slate-950 border border-slate-800 disabled:opacity-40 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="col-span-12 sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1 shrink-0 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>
        </form>

        {/* Haiti fixtures table */}
        {haitiMatches.length === 0 ? (
          <p className="text-[11px] text-slate-500 font-bold italic py-2 text-center">Aucune rencontre haïtienne personnalisée enregistrée.</p>
        ) : (
          <div className="border border-slate-850 rounded-xl overflow-hidden">
            <table className="w-full text-left font-semibold text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 font-black text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-850 select-none">
                  <th className="py-2.5 px-4 w-12">Type</th>
                  <th className="py-2.5 px-4">Adversaire</th>
                  <th className="py-2.5 px-4">Championnat</th>
                  <th className="py-2.5 px-4 text-center">Lieu</th>
                  <th className="py-2.5 px-4 text-center">Statut</th>
                  <th className="py-2.5 px-4 text-center w-24">Score (H - A)</th>
                  <th className="py-2.5 px-4 text-center w-16">Effacer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-950">
                {haitiMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-mono select-none text-[10px]">🇭🇹</td>
                    <td className="py-2.5 px-4 font-bold text-white">{m.opponent}</td>
                    <td className="py-2.5 px-4 block max-w-xs truncate text-[11px] text-slate-400 font-semibold">{m.competition}</td>
                    <td className="py-2.5 px-4 text-center text-[10px]">{m.isHome ? "🏡 Domicile" : "✈️ Extérieur"}</td>
                    <td className="py-2.5 px-4 text-center select-none">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        m.status === 'FINISHED' ? 'bg-emerald-600/10 text-emerald-400' : 'bg-blue-600/10 text-blue-400'
                      }`}>
                        {m.status === 'FINISHED' ? "Terminé" : "Planifié"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-black text-orange-400">
                      {m.status === 'FINISHED' ? `${m.isHome ? m.teamScore : m.opponentScore} - ${!m.isHome ? m.teamScore : m.opponentScore}` : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button 
                        onClick={() => handleRemoveHaitiMatch(m.id)}
                        className="p-1 text-slate-500 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminSportsSettings;
