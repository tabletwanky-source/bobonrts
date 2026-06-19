import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { sportsConfig } from '../config/sportsConfig';

interface ServiceStatus {
  name: string;
  label: string;
  status: 'checking' | 'ok' | 'error' | 'warning';
  detail: string;
}

const ADMIN_EMAILS = ['renejohnmike33@gmail.com', 'thefunniest2020@gmail.com'];

const SystemStatus: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'firebase_auth', label: 'Firebase Auth', status: 'checking', detail: 'Vérification...' },
    { name: 'firestore', label: 'Firestore Database', status: 'checking', detail: 'Vérification...' },
    { name: 'storage', label: 'Firebase Storage', status: 'checking', detail: 'Vérification...' },
    { name: 'football_api', label: 'Football API (football-data.org)', status: 'checking', detail: 'Vérification...' },
    { name: 'env_vars', label: 'Environment Variables', status: 'checking', detail: 'Vérification...' },
    { name: 'admin_detection', label: 'Admin Detection', status: 'checking', detail: 'Vérification...' },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const updateService = (name: string, patch: Partial<ServiceStatus>) => {
    setServices(prev => prev.map(s => s.name === name ? { ...s, ...patch } : s));
  };

  const runChecks = async () => {
    setRunning(true);
    setServices(prev => prev.map(s => ({ ...s, status: 'checking', detail: 'Vérification...' })));

    // 1. Firebase Auth
    try {
      const currentUser = auth.currentUser;
      updateService('firebase_auth', {
        status: 'ok',
        detail: currentUser
          ? `Connecté: ${currentUser.email}`
          : 'Service actif — aucun utilisateur connecté (normal)',
      });
    } catch (e: any) {
      updateService('firebase_auth', { status: 'error', detail: e.message });
    }

    // 2. Firestore
    try {
      const testRef = doc(db, 'settings', 'system_status_ping');
      await setDoc(testRef, { ping: true, at: serverTimestamp() }, { merge: true });
      const snap = await getDoc(testRef);
      if (snap.exists()) {
        updateService('firestore', { status: 'ok', detail: 'Lecture et écriture Firestore réussies.' });
      } else {
        updateService('firestore', { status: 'warning', detail: 'Écriture OK mais le document est introuvable.' });
      }
    } catch (e: any) {
      updateService('firestore', {
        status: 'error',
        detail: `Erreur Firestore: ${e.message}`,
      });
    }

    // 3. Firebase Storage
    try {
      const testRef = ref(storage, '_system_status_test/ping.txt');
      await uploadString(testRef, 'ping');
      await deleteObject(testRef);
      updateService('storage', { status: 'ok', detail: 'Upload/delete Storage réussis.' });
    } catch (e: any) {
      const msg = e.message || String(e);
      if (msg.includes('unauthorized') || msg.includes('permission')) {
        updateService('storage', { status: 'warning', detail: 'Accès Storage restreint (normal si non-admin).' });
      } else {
        updateService('storage', { status: 'error', detail: `Erreur Storage: ${msg}` });
      }
    }

    // 4. Football API (via server proxy)
    try {
      const res = await fetch('/api/sports/config');
      if (res.ok) {
        const apiKey = sportsConfig.apiKey;
        if (apiKey) {
          updateService('football_api', {
            status: 'ok',
            detail: `Proxy actif. Clé API chargée (${apiKey.substring(0, 4)}...${apiKey.slice(-4)}).`,
          });
        } else {
          updateService('football_api', {
            status: 'warning',
            detail: 'Proxy actif mais VITE_FOOTBALL_API_KEY non détectée côté client.',
          });
        }
      } else {
        updateService('football_api', { status: 'error', detail: `Proxy inaccessible (HTTP ${res.status}).` });
      }
    } catch (e: any) {
      updateService('football_api', { status: 'error', detail: `Erreur proxy sportif: ${e.message}` });
    }

    // 5. Environment Variables
    const envChecks: string[] = [];
    const missing: string[] = [];
    const vars = [
      'VITE_FOOTBALL_API_KEY',
    ] as const;
    for (const v of vars) {
      const val = (import.meta as any).env[v];
      if (val) envChecks.push(v);
      else missing.push(v);
    }
    if (missing.length === 0) {
      updateService('env_vars', { status: 'ok', detail: `Toutes les variables VITE_* sont définies: ${envChecks.join(', ')}` });
    } else {
      updateService('env_vars', {
        status: 'warning',
        detail: `Variables manquantes côté client: ${missing.join(', ')}. Le serveur peut les charger via process.env.`,
      });
    }

    // 6. Admin Detection
    const currentUser = auth.currentUser;
    if (!currentUser) {
      updateService('admin_detection', {
        status: 'warning',
        detail: 'Non connecté — impossible de vérifier le rôle admin.',
      });
    } else {
      const email = currentUser.email?.toLowerCase() || '';
      const isAdmin = ADMIN_EMAILS.includes(email);
      if (isAdmin) {
        updateService('admin_detection', {
          status: 'ok',
          detail: `Accès admin confirmé pour: ${currentUser.email}`,
        });
      } else {
        updateService('admin_detection', {
          status: 'warning',
          detail: `Connecté en tant que: ${currentUser.email} (non-admin). Admins: ${ADMIN_EMAILS.join(', ')}`,
        });
      }
    }

    setLastChecked(new Date());
    setRunning(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const statusIcon = (s: ServiceStatus['status']) => {
    if (s === 'checking') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-500 animate-pulse" />;
    if (s === 'ok') return <span className="text-green-400 text-lg">✅</span>;
    if (s === 'warning') return <span className="text-yellow-400 text-lg">⚠️</span>;
    return <span className="text-red-400 text-lg">❌</span>;
  };

  const statusBadge = (s: ServiceStatus['status']) => {
    if (s === 'checking') return 'bg-slate-800 text-slate-400 border-slate-700';
    if (s === 'ok') return 'bg-green-950/60 text-green-400 border-green-800';
    if (s === 'warning') return 'bg-yellow-950/60 text-yellow-400 border-yellow-800';
    return 'bg-red-950/60 text-red-400 border-red-900';
  };

  const statusLabel = (s: ServiceStatus['status']) => {
    if (s === 'checking') return 'Vérification...';
    if (s === 'ok') return 'Opérationnel';
    if (s === 'warning') return 'Avertissement';
    return 'Erreur';
  };

  const overall = services.every(s => s.status === 'ok')
    ? 'ok'
    : services.some(s => s.status === 'error')
    ? 'error'
    : services.some(s => s.status === 'checking')
    ? 'checking'
    : 'warning';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <span className="text-orange-500 text-xs font-black tracking-widest uppercase">Infrastructure</span>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
          Statut du Système
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">
          Vérification en temps réel de tous les services de la plateforme Radio Télévision Sismique.
        </p>
      </div>

      {/* Overall Banner */}
      <div className={`rounded-2xl border p-5 mb-8 flex items-center gap-4 shadow-xl ${
        overall === 'ok'
          ? 'bg-green-950/30 border-green-800'
          : overall === 'error'
          ? 'bg-red-950/30 border-red-900'
          : overall === 'checking'
          ? 'bg-slate-900 border-slate-700'
          : 'bg-yellow-950/20 border-yellow-800'
      }`}>
        <div className="text-3xl">
          {overall === 'ok' ? '✅' : overall === 'error' ? '❌' : overall === 'checking' ? '🔄' : '⚠️'}
        </div>
        <div>
          <p className="font-black text-white text-base">
            {overall === 'ok'
              ? 'Tous les services sont opérationnels'
              : overall === 'error'
              ? 'Un ou plusieurs services sont en erreur'
              : overall === 'checking'
              ? 'Vérification des services en cours...'
              : 'Certains services nécessitent une attention'}
          </p>
          {lastChecked && (
            <p className="text-xs text-slate-400 mt-0.5">
              Dernière vérification: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className={`ml-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border transition-all ${
            running
              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-500 border-orange-500 text-white cursor-pointer'
          }`}
        >
          {running ? 'En cours...' : 'Relancer'}
        </button>
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {services.map(service => (
          <div
            key={service.name}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4 shadow"
          >
            <div className="mt-0.5 flex-shrink-0">
              {statusIcon(service.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white text-sm">{service.label}</span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusBadge(service.status)}`}>
                  {statusLabel(service.status)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 font-mono leading-relaxed break-all">
                {service.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Environment Info */}
      <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-black text-white text-sm uppercase tracking-wider mb-4">Informations Techniques</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Firebase Project</span>
            <span className="text-slate-300">teacher-wanky-website</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Sports Provider</span>
            <span className="text-slate-300">{sportsConfig.provider}</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Sports API Base URL</span>
            <span className="text-slate-300 break-all">{sportsConfig.apiBaseUrl}</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Cache Duration</span>
            <span className="text-slate-300">{sportsConfig.cacheMinutes} minutes</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Admins autorisés</span>
            <span className="text-slate-300 break-all">{ADMIN_EMAILS.join(', ')}</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Hostname</span>
            <span className="text-slate-300 break-all">{typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
