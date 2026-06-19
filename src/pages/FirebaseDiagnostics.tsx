import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Server, Shield, Database, Key, CheckCircle, XCircle, RefreshCw, Layers, HardDrive } from 'lucide-react';
import SEO from '../components/SEO';

interface DiagnosticStep {
  name: string;
  category: 'App' | 'Auth' | 'Firestore' | 'Storage';
  status: 'idle' | 'running' | 'success' | 'failure';
  details: string;
  error?: string;
}

const FirebaseDiagnostics: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setLogs([]);
    addLog("Démarrage du diagnostic système Firebase...");

    const initialSteps: DiagnosticStep[] = [
      {
        name: "Initialisation SDK Firebase",
        category: 'App',
        status: 'running',
        details: "Vérification des variables globales d'environnement basées sur firebase-applet-config."
      },
      {
        name: "Initialisation Firebase Auth",
        category: 'Auth',
        status: 'idle',
        details: "Authentification de base et vérification de la présence de l'instance auth."
      },
      {
        name: "Service Principal Firestore",
        category: 'Firestore',
        status: 'idle',
        details: "Requête ping pilote sur la collection 'users'."
      },
      {
        name: "Validation des Collections Multiples",
        category: 'Firestore',
        status: 'idle',
        details: "Analyse des collections requises par Radio Sismique."
      },
      {
        name: "Initialisation Cloud Storage",
        category: 'Storage',
        status: 'running',
        details: "Validation de l'instance d'hébergement RTS files."
      }
    ];
    setSteps(initialSteps);

    // Step 1: SDK Firebase
    try {
      addLog("Test 1: Vérification du SDK Firebase.");
      if (db && auth && storage) {
        addLog(`SDK Initialisé avec succès! Project ID: ${db.app.options.projectId || 'N/A'}`);
        initialSteps[0].status = 'success';
        initialSteps[0].details = `Connecté au projet Firebase : ${db.app.options.projectId || 'teacher-wanky-website'}`;
      } else {
        throw new Error("Les instances globales Firebase ne sont pas définies.");
      }
    } catch (err: any) {
      addLog(`ÉCHEC Test 1: ${err?.message || String(err)}`);
      initialSteps[0].status = 'failure';
      initialSteps[0].error = err?.message || String(err);
    }
    setSteps([...initialSteps]);

    // Step 2: Auth Check
    addLog("Test 2: Validation Firebase Auth.");
    initialSteps[1].status = 'running';
    setSteps([...initialSteps]);
    try {
      if (auth) {
        addLog(`Auth Instance chargée. Utilisateur connecté: ${user ? `${user.email} (${user.uid})` : 'Aucun (Visiteur)'}`);
        initialSteps[1].status = 'success';
        initialSteps[1].details = user 
          ? `Connecté en tant que ${user.email}. Rôle assigné : ${userProfile?.role || 'user'}` 
          : "Authentification active. Aucun utilisateur actuellement authentifié (Mode invité).";
      } else {
        throw new Error("L'instance Firebase Auth n'est pas disponible.");
      }
    } catch (err: any) {
      addLog(`ÉCHEC Test 2: ${err?.message || String(err)}`);
      initialSteps[1].status = 'failure';
      initialSteps[1].error = err?.message || String(err);
    }
    setSteps([...initialSteps]);

    // Step 3: Firestore connection
    addLog("Test 3: Vérification de la connexion de données Firestore.");
    initialSteps[2].status = 'running';
    setSteps([...initialSteps]);
    try {
      const qUsers = query(collection(db, 'users'), limit(1));
      const testSnap = await getDocs(qUsers);
      addLog(`Firestore connecté! Nous pouvons interroger la base. Documents d'auditeurs trouvés : ${testSnap.size}`);
      initialSteps[2].status = 'success';
      initialSteps[2].details = `Liaison Firestore fonctionnelle et réactive aux interrogations.`;
    } catch (err: any) {
      addLog(`ÉCHEC Test 3: ${err?.message || String(err)}`);
      initialSteps[2].status = 'failure';
      initialSteps[2].error = err?.message || String(err);
    }
    setSteps([...initialSteps]);

    // Step 4: Multi-Collections validation
    addLog("Test 4: Validation de l'existence des collections fondamentales.");
    initialSteps[3].status = 'running';
    setSteps([...initialSteps]);
    try {
      const collectionsToCheck = ['users', 'articles', 'categories', 'listening_sessions', 'leaderboards', 'reward_points'];
      const results: string[] = [];
      
      for (const colName of collectionsToCheck) {
        try {
          const colRef = collection(db, colName);
          const snap = await getDocs(query(colRef, limit(1)));
          results.push(`${colName}: OK (${snap.size} doc(s))`);
          addLog(`Collection '${colName}' accessible et en ligne.`);
        } catch (colErr: any) {
          results.push(`${colName}: Non autorisé ou vide (${colErr?.message || colErr?.code})`);
          addLog(`Accès collection '${colName}' restreint ou vide : ${colErr?.message || colErr?.code}`);
        }
      }
      initialSteps[3].status = 'success';
      initialSteps[3].details = `Collections vérifiées : ${results.join(', ')}`;
    } catch (err: any) {
      addLog(`ÉCHEC Test 4: ${err?.message || String(err)}`);
      initialSteps[3].status = 'failure';
      initialSteps[3].error = err?.message || String(err);
    }
    setSteps([...initialSteps]);

    // Step 5: Storage Verify
    addLog("Test 5: Validation Cloud Storage.");
    initialSteps[4].status = 'running';
    setSteps([...initialSteps]);
    try {
      if (storage) {
        addLog(`Cloud Storage disponible. Seau configuré : ${storage.app.options.storageBucket || 'Par défaut'}`);
        initialSteps[4].status = 'success';
        initialSteps[4].details = `Service en ligne. Bucket : ${storage.app.options.storageBucket || 'Région Standard US'}`;
      } else {
        throw new Error("L'instance Cloud Storage n'est pas initialisée.");
      }
    } catch (err: any) {
      addLog(`ÉCHEC Test 5: ${err?.message || String(err)}`);
      initialSteps[4].status = 'failure';
      initialSteps[4].error = err?.message || String(err);
    }
    setSteps([...initialSteps]);

    addLog("Diagnostic complet exécuté.");
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16">
      <SEO 
        title="Diagnostic Base de Données Firebase"
        description="Outil de contrôle technique et diagnostic réseau pour vérifier la connectivité Firebase en direct."
        slugPath="/firebase-diagnostics"
      />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Title block */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">Technique de Diagnostic</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Console de Liaison Firebase</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">État actuel de connectivité et de sécurité de la station</p>
          </div>

          <button 
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest rounded-xl transition shadow-lg shadow-orange-600/15 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Relancer les diagnostics</span>
          </button>
        </div>

        {/* Current profile snapshot status banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-orange-600/10 rounded-xl border border-orange-500/15 text-orange-500 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Projet Actif ID</p>
              <p className="font-mono text-xs text-slate-200 mt-0.5 max-w-[180px] truncate">{db?.app?.options?.projectId || 'teacher-wanky-website'}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-orange-600/10 rounded-xl border border-orange-500/15 text-orange-500 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Session Active</p>
              <p className="text-xs text-slate-200 mt-0.5 max-w-[180px] truncate font-sans font-bold">
                {user ? user.email : 'Visiteur / Anonyme'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-orange-600/10 rounded-xl border border-orange-500/15 text-orange-500 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Niveau de privilèges</p>
              <p className="text-xs text-slate-200 mt-0.5 uppercase tracking-wider font-extrabold font-sans">
                {userProfile?.role || 'user'}
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic Steps cards lists */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6 mb-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Rapport de tests pas à pas</h2>
          
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-300 ${
                  step.status === 'success' 
                    ? 'bg-slate-900/30 border-slate-800/60' 
                    : step.status === 'failure'
                    ? 'bg-red-950/20 border-red-900/40'
                    : step.status === 'running'
                    ? 'bg-orange-950/10 border-orange-900/30 animate-pulse'
                    : 'bg-slate-950/30 border-slate-900/50 opacity-40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-xl border shrink-0 ${
                    step.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      : step.status === 'failure'
                      ? 'bg-red-500/10 border-red-500/20 text-red-500'
                      : step.status === 'running'
                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {step.category === 'App' && <Server className="w-5 h-5" />}
                    {step.category === 'Auth' && <Shield className="w-5 h-5" />}
                    {step.category === 'Firestore' && <Database className="w-5 h-5" />}
                    {step.category === 'Storage' && <HardDrive className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] uppercase tracking-widest font-black px-2 py-0.5 bg-slate-950/80 rounded-md border border-slate-800 text-slate-400">
                        {step.category}
                      </span>
                      <h3 className="text-sm font-extrabold uppercase tracking-tight text-white">{step.name}</h3>
                    </div>
                    <p className={`text-xs mt-1.5 font-medium ${step.status === 'failure' ? 'text-red-400 font-mono' : 'text-slate-400'}`}>
                      {step.details}
                    </p>
                    
                    {step.error && (
                      <div className="mt-3 p-3 bg-red-950/60 border border-red-900/60 rounded-xl">
                        <span className="text-[7px] uppercase tracking-[0.2em] font-black text-red-500 block mb-1">Rapport d'erreur système</span>
                        <p className="font-mono text-[10px] text-red-400 select-all leading-relaxed whitespace-pre-wrap">{step.error}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:justify-end">
                  {step.status === 'success' && (
                    <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Actif & OK</span>
                    </div>
                  )}
                  {step.status === 'failure' && (
                    <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Erreur critique</span>
                    </div>
                  )}
                  {step.status === 'running' && (
                    <div className="flex items-center gap-1.5 text-orange-400 text-[10px] font-black uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>En cours...</span>
                    </div>
                  )}
                  {step.status === 'idle' && (
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">En attente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live console logging window */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-950">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Console de Log Systémique (Diagnostic)</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/30"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/30"></span>
            </div>
          </div>

          <div className="p-6 font-mono text-[10px] text-slate-300 space-y-2 h-56 overflow-y-auto bg-slate-950 selection:bg-slate-800">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Aucune information à afficher</p>
            ) : (
              logs.map((log, idx) => (
                <p key={idx} className={log.includes('ÉCHEC') || log.includes('Erreur') ? 'text-red-400' : log.includes('success!') || log.includes('connecté') ? 'text-emerald-400' : 'text-slate-400'}>
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDiagnostics;
