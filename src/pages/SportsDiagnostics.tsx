import React, { useState, useEffect } from 'react';
import { sportsService } from '../services/sportsService';
import { sportsConfig } from '../config/sportsConfig';

interface DiagnosticResult {
  apiKey: {
    loaded: boolean;
    source: string;
    masked: string;
    error: string | null;
  };
  reachable: {
    ok: boolean;
    status: number | null;
    error: string | null;
  };
  competitions: {
    ok: boolean;
    status: number | null;
    error: string | null;
    rawResponse: string | null;
  };
  fixtures: {
    ok: boolean;
    status: number | null;
    error: string | null;
    rawResponse: string | null;
  };
  standings: {
    ok: boolean;
    status: number | null;
    error: string | null;
    rawResponse: string | null;
  };
}

const SportsDiagnostics: React.FC = () => {
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(true);
  const [internalLogs, setInternalLogs] = useState<Array<{ type: 'info' | 'success' | 'warn' | 'error'; message: string; timestamp: string }>>([]);

  const addLog = (type: 'info' | 'success' | 'warn' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setInternalLogs((prev) => [{ type, message, timestamp }, ...prev]);
  };

  const runDiagnostics = async () => {
    setRunning(true);
    setError(null);
    setInternalLogs([]);
    addLog('info', 'Démarrage du processus de diagnostic d\'intégration sportive...');
    addLog('info', `Config client active: enabled=${sportsConfig.enabled}, provider=${sportsConfig.provider}, apiBaseUrl=${sportsConfig.apiBaseUrl}`);

    try {
      addLog('info', 'Appel du point de terminaison de test serveur /api/sports/test-diagnostics...');
      const data = await sportsService.runDiagnostics();
      setResults(data);

      // Analyze and log results
      if (data.apiKey?.loaded) {
        addLog('success', `Clé API détectée et chargée via : ${data.apiKey.source} (${data.apiKey.masked})`);
      } else {
        addLog('error', `Aucune clé API chargée sur le serveur ! Détails : ${data.apiKey?.error || 'Inconnu'}`);
      }

      if (data.reachable?.ok) {
        addLog('success', `Connexion réseau directe établie vers le fournisseur. Code HTTP : ${data.reachable.status}`);
      } else {
        addLog('error', `Impossible de ping api.football-data.org. Erreur : ${data.reachable?.error}`);
      }

      if (data.competitions?.ok) {
        addLog('success', 'Point de terminaison des compétitions (/v4/competitions) vérifié avec succès.');
      } else {
        const errCode = data.competitions?.status;
        const msg = data.competitions?.error;
        addLog('error', `Échec du test compétitions (Status ${errCode}) : ${msg}`);
        analyzeErrorDetails('Competitions', errCode, msg);
      }

      if (data.fixtures?.ok) {
        addLog('success', 'Point de terminaison des rencontres (/v4/matches) vérifié avec succès.');
      } else {
        const errCode = data.fixtures?.status;
        const msg = data.fixtures?.error;
        addLog('error', `Échec du test des rencontres (Status ${errCode}) : ${msg}`);
        analyzeErrorDetails('Fixtures', errCode, msg);
      }

      if (data.standings?.ok) {
        addLog('success', 'Point de terminaison des classements (/v4/competitions/PL/standings) vérifié avec succès.');
      } else {
        const errCode = data.standings?.status;
        const msg = data.standings?.error;
        addLog('error', `Échec du test des classements (Status ${errCode}) : ${msg}`);
        analyzeErrorDetails('Standings', errCode, msg);
      }

      addLog('success', 'Processus d\'audit d\'intégration terminé.');
    } catch (err: any) {
      setError(err.message || "Impossible de contacter l'API de diagnostic.");
      addLog('error', `Panne d'exécution critique : ${err.message || err}`);
    } finally {
      setRunning(false);
    }
  };

  const analyzeErrorDetails = (section: string, status: number | null, rawMessage: string | null) => {
    if (status === 401 || rawMessage === 'UNAUTHORIZED') {
      addLog('warn', `|--- [Diagnostic ${section}] Indication : Clé API invalide ou non reconnue (Erreur 401). Veuillez vérifier la valeur saisie.`);
    } else if (status === 403 || rawMessage === 'FORBIDDEN') {
      addLog('warn', `|--- [Diagnostic ${section}] Indication : Accès interdit (Erreur 403). La ressource ou compétition demandée nécessite un plan payant sur football-data.org.`);
    } else if (status === 429 || rawMessage === 'RATE_LIMIT') {
      addLog('warn', `|--- [Diagnostic ${section}] Indication : Taux limite de requêtes dépassé (Erreur 429). Le compte gratuit autorise maximum 10 requêtes / minute. Patientez 60 secondes.`);
    } else if (status === 500 || status === 503) {
      addLog('warn', `|--- [Diagnostic ${section}] Indication : Erreur de passerelle ou service indisponible (Erreur 500/503). Vérifiez la connectivité cloud.`);
    } else {
      addLog('warn', `|--- [Diagnostic ${section}] Erreur réseau ou CORS local possible.`);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-10 selection:bg-orange-500 selection:text-white" id="sports-diagnostics-root">
      
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-orange-500 text-xs font-black tracking-widest uppercase">Espace Technologie & Audit</span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
            📊 Diagnostic des Intégrations Sportives
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl font-medium">
            Diagnostiquez, auditez et analysez la liaison directe avec les passerelles sportives de football-data.org pour résoudre les pannes de production.
          </p>
        </div>
        <div>
          <button
            id="run-audit-btn"
            onClick={runDiagnostics}
            disabled={running}
            className={`w-full md:w-auto flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider px-6 py-4 rounded-xl shadow-lg border cursor-pointer transition-all duration-300 ${
              running
                ? 'bg-slate-900 border-slate-800 text-slate-500'
                : 'bg-orange-600 hover:bg-orange-500 border-orange-500 text-white hover:scale-105 active:scale-95'
            }`}
          >
            {running ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Audit en cours...</span>
              </>
            ) : (
              <>
                <span>🔄 Relancer les Tests d'Intégration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-5 rounded-2xl flex items-start gap-3 shadow-xl" id="critical-diagnostic-error">
          <span className="text-2xl">⚠️</span>
          <div>
            <h5 className="font-extrabold text-sm uppercase tracking-wide text-red-400">Erreur critique de diagnostic</h5>
            <p className="text-xs font-mono mt-1 leading-relaxed bg-red-950/80 p-3 rounded-lg border border-red-900/60">{error}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Status Checks & Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Diagnostics Panels */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="border-b border-slate-800 px-6 py-4 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span> Statut en Direct des Points d'Accès
              </h3>
              <span className="bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 rounded-full">
                Vitesse Max du Gateway
              </span>
            </div>

            <div className="p-6 divide-y divide-slate-800 space-y-6">
              
              {/* Check 1: API Key */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2" id="test-apikey-panel">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">🔑</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Clé d'authentification API (X-Auth-Token)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Détermine si une clé valide est chargée pour authentifier nos requêtes HTTP.
                    </p>
                    {results?.apiKey?.loaded && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded">
                          Source: {results.apiKey.source}
                        </span>
                        <span className="bg-slate-950 text-orange-400 border border-slate-850 text-[10px] font-mono px-2 py-0.5 rounded">
                          Masque: {results.apiKey.masked}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                  {!results ? (
                    <span className="bg-slate-950 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-850 uppercase animate-pulse">En attente...</span>
                  ) : results.apiKey.loaded ? (
                    <span className="bg-green-950/60 text-green-400 text-xs font-black px-4 py-2 rounded-full border border-green-800 flex items-center gap-1.5 shadow-sm shadow-green-900/20">
                      ✅ API Key Loaded
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="bg-red-950/60 text-red-400 text-xs font-black px-4 py-2 rounded-full border border-red-900 inline-flex items-center gap-1.5">
                        ❌ Clé Manquante
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Check 2: Endpoint Reachable */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-6" id="test-reachability-panel">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">🌐</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Accessibilité Réseau du Serveur</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Vérifie si notre adresse d'hébergement ou de conteneur en production peut joindre sans timeout ou DNS bloqué l'hôte de football-data.org.
                    </p>
                    {results?.reachable && !results.reachable.ok && (
                      <div className="mt-2 text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900 font-mono">
                        Erreur: {results.reachable.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                  {!results ? (
                    <span className="bg-slate-950 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-850 uppercase animate-pulse">En attente...</span>
                  ) : results.reachable.ok ? (
                    <span className="bg-green-950/60 text-green-400 text-xs font-black px-4 py-2 rounded-full border border-green-800 flex items-center gap-1.5">
                       ✅ Endpoint Reachable
                    </span>
                  ) : (
                    <span className="bg-red-950/60 text-red-400 text-xs font-black px-4 py-2 rounded-full border border-red-900 inline-flex items-center gap-1.5">
                      ❌ Hors Ligne / Bloqué
                    </span>
                  )}
                </div>
              </div>

              {/* Check 3: Competitions Endpoint */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-6" id="test-competitions-panel">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">🏆</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Passerelle Compétitions (Competitions Endpoint)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Teste l'acquisition des ligues majeures actives. Permet de vérifier s'il s'agit d'une restriction de plan ou d'une clé API erronée.
                    </p>
                    {results?.competitions && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-slate-400 font-mono">
                          HTTP Status: <strong className={results.competitions.ok ? 'text-green-400' : 'text-red-400'}>{results.competitions.status || 'N/A'}</strong>
                        </div>
                        {!results.competitions.ok && (
                          <div className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-900 font-mono space-y-1">
                            <div><strong>Rapport Technique Réel :</strong></div>
                            <div className="p-1.5 bg-slate-950 rounded border border-slate-850 overflow-x-auto select-all text-[10px]">
                              {results.competitions.error}
                            </div>
                            <div className="text-[10px] opacity-80 mt-1">
                              * Ce problème est causé par : {results.competitions.status === 429 ? 'Dépassement du quota d\'appels gratuits (limite de 10/min).' : results.competitions.status === 403 ? 'Plan gratuit restreint à 12 compétitions seulement.' : 'Une mauvaise configuration de clé API.'}
                            </div>
                          </div>
                        )}
                        {results.competitions.ok && results.competitions.rawResponse && (
                          <div className="text-xs text-green-300 font-mono bg-green-950/20 p-2 rounded border border-green-950/50">
                            {results.competitions.rawResponse}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                  {!results ? (
                    <span className="bg-slate-950 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-850 uppercase animate-pulse">En attente...</span>
                  ) : results.competitions.ok ? (
                    <span className="bg-green-950/60 text-green-400 text-xs font-black px-4 py-2 rounded-full border border-green-800 flex items-center gap-1.5">
                      ✅ Competitions Endpoint
                    </span>
                  ) : (
                    <span className="bg-red-950/60 text-red-400 text-xs font-black px-4 py-2 rounded-full border border-red-900 inline-flex items-center gap-1.5">
                      ❌ Échec ({results.competitions.status})
                    </span>
                  )}
                </div>
              </div>

              {/* Check 4: Fixtures Endpoint */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-6" id="test-fixtures-panel">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">📅</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Passerelle des Rencontres (Fixtures Endpoint)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Teste l'accréditation de récupération des matches mondiaux du jour (/v4/matches).
                    </p>
                    {results?.fixtures && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-slate-400 font-mono">
                          HTTP Status: <strong className={results.fixtures.ok ? 'text-green-400' : 'text-red-400'}>{results.fixtures.status || 'N/A'}</strong>
                        </div>
                        {!results.fixtures.ok && (
                          <div className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-900 font-mono space-y-1">
                            <div><strong>Rapport Technique Réel :</strong></div>
                            <div className="p-1.5 bg-slate-950 rounded border border-slate-850 overflow-x-auto select-all text-[10px]">
                              {results.fixtures.error}
                            </div>
                            <div className="text-[10px] opacity-80 mt-1">
                              * Ce problème est causé par : {results.fixtures.status === 429 ? 'Dépassement de limite gratuit (10 requêtes/min).' : results.fixtures.status === 403 ? 'Droits d\'accès de la ressource ou token invalide.' : 'IP de production bloquée ou clé API expirée.'}
                            </div>
                          </div>
                        )}
                        {results.fixtures.ok && results.fixtures.rawResponse && (
                          <div className="text-xs text-green-300 font-mono bg-green-950/20 p-2 rounded border border-green-950/50">
                            {results.fixtures.rawResponse}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                  {!results ? (
                    <span className="bg-slate-950 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-850 uppercase animate-pulse">En attente...</span>
                  ) : results.fixtures.ok ? (
                    <span className="bg-green-950/60 text-green-400 text-xs font-black px-4 py-2 rounded-full border border-green-800 flex items-center gap-1.5">
                      ✅ Fixtures Endpoint
                    </span>
                  ) : (
                    <span className="bg-red-950/60 text-red-400 text-xs font-black px-4 py-2 rounded-full border border-red-900 inline-flex items-center gap-1.5">
                      ❌ Échec ({results.fixtures.status})
                    </span>
                  )}
                </div>
              </div>

              {/* Check 5: Standings Endpoint */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-6 pb-2" id="test-standings-panel">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">📊</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Passerelle des Classements PL (Standings Endpoint)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Teste la récupération du classement de la Premier League anglaise (/v4/competitions/PL/standings) pour authentifier l'accès sélectif.
                    </p>
                    {results?.standings && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-slate-400 font-mono">
                          HTTP Status: <strong className={results.standings.ok ? 'text-green-400' : 'text-red-400'}>{results.standings.status || 'N/A'}</strong>
                        </div>
                        {!results.standings.ok && (
                          <div className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-900 font-mono space-y-1">
                            <div><strong>Rapport Technique Réel :</strong></div>
                            <div className="p-1.5 bg-slate-950 rounded border border-slate-850 overflow-x-auto select-all text-[10px]">
                              {results.standings.error}
                            </div>
                            <div className="text-[10px] opacity-80 mt-1">
                              * Ce problème est causé par : {results.standings.status === 429 ? 'Attente d\'une minute pour réinitialisation du taux de requête.' : results.standings.status === 403 ? 'Ressource restreinte non offerte dans la couverture géographique de base.' : 'Inaccessibilité réseau générale.'}
                            </div>
                          </div>
                        )}
                        {results.standings.ok && results.standings.rawResponse && (
                          <div className="text-xs text-green-300 font-mono bg-green-950/20 p-2 rounded border border-green-950/50">
                            {results.standings.rawResponse}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                  {!results ? (
                    <span className="bg-slate-950 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-850 uppercase animate-pulse">En attente...</span>
                  ) : results.standings.ok ? (
                    <span className="bg-green-950/60 text-green-400 text-xs font-black px-4 py-2 rounded-full border border-green-800 flex items-center gap-1.5">
                      ✅ Standings Endpoint
                    </span>
                  ) : (
                    <span className="bg-red-950/60 text-red-400 text-xs font-black px-4 py-2 rounded-full border border-red-900 inline-flex items-center gap-1.5">
                      ❌ Échec ({results.standings.status})
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Console / Terminal Log Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden" id="diagnostics-logs">
            <div className="border-b border-slate-850 px-6 py-4 bg-slate-950/60 flex justify-between items-center">
              <span className="text-xs uppercase font-black text-slate-400 tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block"></span>
                Console d'Exécution d'Audit (Temps Réel)
              </span>
              <button
                onClick={() => setInternalLogs([])}
                className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Effacer
              </button>
            </div>
            <div className="p-5 font-mono text-xs text-slate-350 space-y-2 h-[260px] overflow-y-auto select-text scrollbar-thin bg-black/40">
              {internalLogs.length === 0 ? (
                <p className="text-slate-600 italic text-center py-16">Lancez l'audit pour voir la trace réseau...</p>
              ) : (
                internalLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 hover:bg-slate-900/50 p-1 rounded">
                    <span className="text-[10px] text-slate-600 select-none">[{log.timestamp}]</span>
                    {log.type === 'success' && <span className="text-green-400 font-extrabold select-none">[SUCCESS]</span>}
                    {log.type === 'error' && <span className="text-red-500 font-extrabold select-none">[CRITICAL]</span>}
                    {log.type === 'warn' && <span className="text-yellow-500 font-extrabold select-none">[WARN]</span>}
                    {log.type === 'info' && <span className="text-blue-400 font-extrabold select-none">[INFO]</span>}
                    <span className="text-slate-300 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Key Configurations & Explanations */}
        <div className="lg:col-span-4 space-y-6">

          {/* Collapsible client side sportsConfig Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowConfig(!showConfig)}>
              <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span>⚙️</span> Variables Config Client
              </h4>
              <span className="text-slate-500 text-xs">{showConfig ? 'Masquer' : 'Afficher'}</span>
            </div>

            {showConfig && (
              <div className="space-y-3 pt-2 text-xs divide-y divide-slate-800/60" id="client-config-fields">
                <div className="flex justify-between py-2 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Statut global :</span>
                  <span className={`font-mono font-black ${sportsConfig.enabled ? 'text-green-400' : 'text-red-400'}`}>
                    {sportsConfig.enabled ? 'ACTIF (True)' : 'INACTIF (False)'}
                  </span>
                </div>
                <div className="flex justify-between py-2 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Fournisseur :</span>
                  <span className="font-mono text-slate-300 font-bold text-right break-all">{sportsConfig.provider}</span>
                </div>
                <div className="flex justify-between py-2 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Endpoint de Base :</span>
                  <span className="font-mono text-slate-450 text-right select-all break-all">{sportsConfig.apiBaseUrl}</span>
                </div>
                <div className="flex justify-between py-2 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Cache Conservé :</span>
                  <span className="font-mono text-slate-300 font-bold">{sportsConfig.cacheMinutes} minutes</span>
                </div>
                <div className="flex justify-between py-2 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Timeout Maximum :</span>
                  <span className="font-mono text-slate-300 font-bold">{sportsConfig.requestTimeout || 10000} ms</span>
                </div>
                <div className="flex justify-between py-2 pt-3 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Clé Locale Vite :</span>
                  <span className="font-mono text-orange-500 font-bold select-all break-all">
                    {sportsConfig.apiKey ? `${sportsConfig.apiKey.substring(0, 4)}...${sportsConfig.apiKey.substring(sportsConfig.apiKey.length - 4)}` : 'Indéfinie'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Helpful educational widget detailing football-data restrictions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>💡</span> Pourquoi cela échoue-t-il en Production ?
            </h4>
            <div className="space-y-3 text-xs text-slate-450 leading-relaxed text-slate-300">
              <p>
                La plateforme gratuite <strong className="text-orange-400">football-data.org</strong> filtre et applique des limites drastiques sur ses points d'accès :
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 pl-1">
                <li>
                  <strong className="text-slate-300">Quota IP Free-Tier (429) :</strong> Le compte libre n'autorise que <strong className="text-orange-400">10 requêtes par minute</strong>. Sur un serveur partagé comme Cloud Run ou Firebase hosting, si plusieurs requêtes s'exécutent en même temps, le serveur d'API refuse immédiatement de répondre et renvoie un code <strong className="text-slate-300">429 (Too Many Requests)</strong>.
                </li>
                <li>
                  <strong className="text-slate-300">Restrictions de Championnats (403) :</strong> Seules 12 compétitions de base (ex: <strong className="text-white">PL, PD, BL1, SA, FL1, CL</strong>) sont ouvertes aux requêtes gratuites. Tout raccordement à un autre championnat (comme Conmebol ou CONCACAF) lève une erreur <strong className="text-slate-300">403 (Forbidden)</strong>.
                </li>
                <li>
                  <strong className="text-slate-300">Clés API Expirées (401) :</strong> Si le jeton est corrompu ou révoqué par le prestataire, un code statut <strong className="text-slate-300">401 (Unauthorized)</strong> est renvoyé.
                </li>
              </ul>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 mt-1">
                <p className="text-[10px] text-orange-400 font-bold">💡 Solution pour les admins :</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Assurez-vous de renseigner une clé valide depuis le panneau d'administration sportive du Dashboard, ou configurez la variable réseau d'environnement <code className="text-white">VITE_FOOTBALL_API_KEY</code> sur votre conteneur de production.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SportsDiagnostics;
