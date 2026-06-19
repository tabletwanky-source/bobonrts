import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const PORT = 3000;
const BASE_URL = "https://api.football-data.org/v4";

// 1. Initialize Firebase Admin SDK
const firebaseApp = getApps().length === 0
  ? initializeApp({ projectId: "teacher-wanky-website" })
  : getApps()[0];

const db = getFirestore(firebaseApp, "ai-studio-2b52cc78-a09c-4c2c-8ffc-af3f5e3dc719");

const ADMIN_EMAILS = [
  "renejohnmike33@gmail.com",
  "thefunniest2020@gmail.com",
  "wanky7713@gmail.com"
];

// Memory cache dictionary
const memoryCache: { [key: string]: { data: any; expiresAt: number } } = {};

// Express App
const app = express();
app.use(express.json());

// Helper to check if user is an admin
async function checkAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Non autorisé" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const email = decodedToken.email?.toLowerCase().trim();
    if (email && ADMIN_EMAILS.includes(email)) {
      (req as any).user = decodedToken;
      return next();
    }
    
    // Also check if they have 'admin' role in their user document
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (userDoc.exists && userDoc.data()?.role === "admin") {
      (req as any).user = decodedToken;
      return next();
    }

    return res.status(403).json({ error: "Droits d'administration requis" });
  } catch (err) {
    console.error("Erreur de validation de jeton admin:", err);
    return res.status(401).json({ error: "Authentification expirée ou invalide" });
  }
}

// 2. Fetch cache logic (Memory + Firestore)
async function getCachedData(cacheKey: string): Promise<any | null> {
  const sanitizeKey = cacheKey.replace(/[^a-zA-Z0-9_\-]/g, "_");
  try {
    // Check in memory first
    const memory = memoryCache[sanitizeKey];
    const now = Date.now();
    if (memory && memory.expiresAt > now) {
      return memory.data;
    }

    // Check Firestore
    const docRef = db.collection("sports_cache").doc(sanitizeKey);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data && data.expiresAt > now) {
        memoryCache[sanitizeKey] = {
          data: data.payload,
          expiresAt: data.expiresAt
        };
        return data.payload;
      }
    }
  } catch (error) {
    console.error(`Error reading cache for key ${sanitizeKey}:`, error);
  }
  return null;
}

// Write to cache (Memory + Firestore)
async function setCachedData(cacheKey: string, payload: any, durationMs: number): Promise<void> {
  const sanitizeKey = cacheKey.replace(/[^a-zA-Z0-9_\-]/g, "_");
  try {
    const expiresAt = Date.now() + durationMs;
    memoryCache[sanitizeKey] = {
      data: payload,
      expiresAt
    };

    await db.collection("sports_cache").doc(sanitizeKey).set({
      payload,
      expiresAt,
      cachedAt: Date.now()
    });
  } catch (error) {
    console.error(`Error writing cache for key ${sanitizeKey}:`, error);
  }
}

// Fallback logic to get expired cache in case of API failure
async function getExpiredCacheFallback(cacheKey: string): Promise<any | null> {
  const sanitizeKey = cacheKey.replace(/[^a-zA-Z0-9_\-]/g, "_");
  try {
    const memory = memoryCache[sanitizeKey];
    if (memory) return memory.data;

    const docSnap = await db.collection("sports_cache").doc(sanitizeKey).get();
    if (docSnap.exists) {
      return docSnap.data()?.payload || null;
    }
  } catch (err) {
    console.error("Failed to read expired cache fallback:", err);
  }
  return null;
}

// 3. SECURE API KEY RETRIEVAL
async function getApiKey(req?: any): Promise<string> {
  // 0) From custom client header passed by sportsService.ts
  const clientHeader = req?.headers?.["x-client-sport-key"];
  if (clientHeader && typeof clientHeader === "string" && clientHeader.trim()) {
    return clientHeader.trim();
  }

  // 1) From environmental variables
  const viteKey = process.env.VITE_FOOTBALL_API_KEY;
  if (viteKey) return viteKey;

  const envKey = process.env.FOOTBALL_DATA_API_KEY;
  if (envKey) return envKey;

  // 2) From Firestore settings document (accessible by server/admins only)
  try {
    const secureDoc = await db.collection("settings").doc("sports_secure").get();
    if (secureDoc.exists) {
      const data = secureDoc.data();
      if (data && data.apiKey) {
        return data.apiKey;
      }
    }
  } catch (error) {
    console.warn("Could not read API key from Firestore sports_secure:", error);
  }

  return "";
}

// Helper to query external API
async function fetchFromFootballData(endpoint: string, req?: any): Promise<any> {
  const apiKey = await getApiKey(req);
  
  console.log(`[Sports API Audit] =============================================`);
  console.log(`[Sports API Audit] Fetching endpoint: ${BASE_URL}${endpoint}`);
  console.log(`[Sports API Audit] Sports API Key loaded: ${apiKey ? "YES (masked: " + apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4) + ")" : "NO (MISSING)"}`);

  if (!apiKey) {
    console.error(`[Sports API Audit] Error: API key is missing.`);
    throw new Error("API-KEY-MISSING");
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "X-Auth-Token": apiKey,
        "Content-Type": "application/json"
      }
    });

    console.log(`[Sports API Audit] HTTP Status Code: ${response.status}`);

    const rawBody = await response.text();
    console.log(`[Sports API Audit] Raw Response Body (truncated): ${rawBody.substring(0, 400)}`);

    if (!response.ok) {
      if (response.status === 401) {
        console.error(`[Sports API Audit] Detection: 401 Unauthorized - Invalid API Key.`);
        throw new Error("UNAUTHORIZED");
      }
      if (response.status === 403) {
        console.error(`[Sports API Audit] Detection: 403 Forbidden - Restriced access or missing tier permissions.`);
        throw new Error("FORBIDDEN");
      }
      if (response.status === 429) {
        console.error(`[Sports API Audit] Detection: 429 Rate Limited - Too many requests to football-data.org.`);
        throw new Error("RATE_LIMIT");
      }
      throw new Error(`API_ERROR_STATUS_${response.status}_BODY_${rawBody}`);
    }

    try {
      const parsed = JSON.parse(rawBody);
      console.log(`[Sports API Audit] JSON parsed successfully. Response has matches/competitions: ${!!(parsed.matches || parsed.competitions || parsed.standings)}`);
      return parsed;
    } catch (parseErr: any) {
      console.error(`[Sports API Audit] JSON Parse error: ${parseErr.message}`);
      throw new Error("JSON_PARSE_ERROR");
    }
  } catch (err: any) {
    console.error(`[Sports API Audit] Network/Execution error:`, err.message || err);
    throw err;
  }
}

// Helper to standardise error messages and details returned to proxy clients
function handleProxyError(res: any, err: any) {
  const errMsg = err.message || "";
  console.error(`[Sports Proxy Error] Audit standardisation for:`, errMsg);

  if (errMsg === "API-KEY-MISSING") {
    return res.status(400).json({ 
      error: "API-KEY-MISSING", 
      message: "Configuration de l'API sportive requise (Clé API manquante)." 
    });
  }
  if (errMsg === "UNAUTHORIZED") {
    return res.status(401).json({ 
      error: "UNAUTHORIZED", 
      message: "Clé API invalide ou non autorisée par football-data.org." 
    });
  }
  if (errMsg === "FORBIDDEN") {
    return res.status(403).json({ 
      error: "FORBIDDEN", 
      message: "Accès refusé par football-data.org (votre plan ne supporte pas cette compétition ou ressource)." 
    });
  }
  if (errMsg === "RATE_LIMIT") {
    return res.status(429).json({ 
      error: "RATE_LIMIT", 
      message: "Limite de requêtes API atteinte (Maximum 10 requêtes/minute pour le plan Gratuit)." 
    });
  }
  if (errMsg.startsWith("API_ERROR_STATUS_")) {
    const match = errMsg.match(/API_ERROR_STATUS_(\d+)_BODY_(.*)/);
    if (match) {
      const statusCode = Number(match[1]);
      const body = match[2];
      return res.status(statusCode).json({
        error: "API_PROVIDER_ERROR",
        message: `Erreur du fournisseur d'API (Status ${statusCode})`,
        details: body
      });
    }
  }

  return res.status(503).json({ 
    error: "API-UNAVAILABLE", 
    message: "Données sportives temporairement indisponibles (Panne ou erreur réseau).",
    details: errMsg
  });
}

// 4. API PROXY ROUTING

// A. Sports general settings
app.get("/api/sports/config", async (req, res) => {
  try {
    const docSnap = await db.collection("settings").doc("sports").get();
    if (docSnap.exists) {
      return res.json(docSnap.data());
    }
    // Fallback defaults
    const defaultSetup = {
      enabledCompetitions: ["PL", "PD", "BL1", "SA", "FL1", "CL", "WC"],
      highlightedMatches: [],
      pinnedHaitiMatches: [],
      refreshInterval: 60,
      customHaitiFixtures: [] // Custom Haiti matches entered by admin if API lacks CONCACAF
    };
    return res.json(defaultSetup);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sports/config", checkAdmin, async (req, res) => {
  try {
    const newConfig = req.body;
    await db.collection("settings").doc("sports").set(newConfig, { merge: true });
    return res.json({ success: true, message: "Configuration enregistrée." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update the external apiKey securely (only readable by server & admin)
app.post("/api/sports/apikey", checkAdmin, async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: "La clé API est requise." });
    }
    await db.collection("settings").doc("sports_secure").set({
      apiKey: apiKey.trim(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return res.json({ success: true, message: "Clé API enregistrée en toute sécurité." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// B. Matches Endpoint
app.get("/api/sports/matches", async (req, res) => {
  const comp = req.query.competition as string;
  const status = req.query.status as string; // LIVE, FINISHED, SCHEDULED
  
  const cacheKey = `matches_${comp || "global"}_${status || "all"}`;
  
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Call API endpoints
    let endpoint = "/matches";
    if (comp) {
      endpoint = `/competitions/${comp}/matches`;
    }
    
    // Build query filters for football-data
    const params = new URLSearchParams();
    if (status && !comp) { // Status can only be parsed on matches global or we filter after
      params.append("status", status);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    let data = await fetchFromFootballData(`${endpoint}${queryString}`, req);

    // If we queried a specific competition and filter by status on client side
    if (comp && status && data.matches) {
      data.matches = data.matches.filter((m: any) => m.status === status);
    }

    // Cache results (Live scores cache 1 min, scheduled/fixtures cache 15 min)
    const cacheDuration = status === "LIVE" ? 60000 : 900000;
    await setCachedData(cacheKey, data, cacheDuration);

    return res.json(data);
  } catch (err: any) {
    console.error(`Matches Proxy failed for ${cacheKey}:`, err.message);
    const fallback = await getExpiredCacheFallback(cacheKey);
    if (fallback) {
      return res.json(fallback);
    }
    return handleProxyError(res, err);
  }
});

// C. Live scores Endpoint
app.get("/api/sports/live", async (req, res) => {
  const cacheKey = "live_matches_feed";
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Free plan: /v4/matches?status=LIVE gets currently played matches
    const data = await fetchFromFootballData("/matches?status=LIVE", req);
    
    // Cache live matches for exactly 60 seconds
    await setCachedData(cacheKey, data, 60000);
    return res.json(data);
  } catch (err: any) {
    console.error("Live matches fetch failed:", err.message);
    const fallback = await getExpiredCacheFallback(cacheKey);
    if (fallback) {
      return res.json(fallback);
    }
    return handleProxyError(res, err);
  }
});

// D. Standings Endpoint
app.get("/api/sports/standings", async (req, res) => {
  const comp = req.query.competition as string;
  if (!comp) {
    return res.status(400).json({ error: "Code de compétition requis." });
  }

  const cacheKey = `standings_${comp}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await fetchFromFootballData(`/competitions/${comp}/standings`, req);
    
    // Standings Cache 30 minutes
    await setCachedData(cacheKey, data, 1800000);
    return res.json(data);
  } catch (err: any) {
    console.error(`Standings fail for ${comp}:`, err.message);
    const fallback = await getExpiredCacheFallback(cacheKey);
    if (fallback) {
      return res.json(fallback);
    }
    return handleProxyError(res, err);
  }
});

// E. Match Detail Endpoint
app.get("/api/sports/match/:id", async (req, res) => {
  const matchId = req.params.id;
  if (!matchId || isNaN(Number(matchId))) {
    return res.status(400).json({ error: "ID de match invalide." });
  }

  const cacheKey = `match_${matchId}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch details
    const data = await fetchFromFootballData(`/matches/${matchId}`, req);
    
    // If finished, cache for 1 day, else cache for 5 minutes
    const isFinished = data.match?.status === "FINISHED";
    const cacheDuration = isFinished ? 86400000 : 300000;
    
    await setCachedData(cacheKey, data, cacheDuration);
    return res.json(data);
  } catch (err: any) {
    console.error(`Match detail fail for ${matchId}:`, err.message);
    const fallback = await getExpiredCacheFallback(cacheKey);
    if (fallback) {
      return res.json(fallback);
    }
    return handleProxyError(res, err);
  }
});

// F. Haiti Hub Matches
app.get("/api/sports/haiti", async (req, res) => {
  const cacheKey = "haiti_matches_feed";
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Haiti national team matches can be fetched by querying general matches (which handles current days),
    // or by custom curated match logs. Let's inspect general international feeds (WC qualifiers or friendlies).
    // Let's call /v4/matches.
    // However, on football-data's free tier, /v4/matches only covers 11 primary competitions.
    // Therefore, we fetch global matches from WC or general matches feed, and filter them for teams named "Haiti" or "Haïti".
    const data = await fetchFromFootballData("/matches", req);
    let matchesList = [];
    if (data.matches) {
      matchesList = data.matches.filter((m: any) => {
        const home = (m.homeTeam?.name || "").toLowerCase();
        const away = (m.awayTeam?.name || "").toLowerCase();
        return home.includes("haiti") || home.includes("haïti") || away.includes("haiti") || away.includes("haïti");
      });
    }

    // Let's cache this feed for 15 minutes
    await setCachedData(cacheKey, { matches: matchesList }, 900000);
    return res.json({ matches: matchesList });
  } catch (err: any) {
    console.error("Haiti national team fetch failed:", err.message);
    if (err.message === "API-KEY-MISSING") {
      return res.status(400).json({ error: "API-KEY-MISSING", message: "Configuration de l'API sportive requise." });
    }
    const fallback = await getExpiredCacheFallback(cacheKey);
    if (fallback) {
      return res.json(fallback);
    }
    // Return empty matches list gracefully since non-supported competitions are common on free-tier football-data API
    return res.json({ matches: [] });
  }
});

// G. Sports Comprehensive Diagnostics Test Endpoint
app.get("/api/sports/test-diagnostics", async (req, res) => {
  console.log("[Sports API Audit] ==============================================");
  console.log("[Sports API Audit] Running Comprehensive Server-Side Diagnostics...");
  
  const results: any = {
    apiKey: { loaded: false, source: "None", masked: "None", error: null },
    reachable: { ok: false, status: null, error: null },
    competitions: { ok: false, status: null, error: null, rawResponse: null },
    fixtures: { ok: false, status: null, error: null, rawResponse: null },
    standings: { ok: false, status: null, error: null, rawResponse: null }
  };

  try {
    const apiKey = await getApiKey(req);
    if (apiKey) {
      results.apiKey.loaded = true;
      results.apiKey.masked = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
      
      const clientHeader = req?.headers?.["x-client-sport-key"];
      if (clientHeader && clientHeader.trim() === apiKey) {
        results.apiKey.source = "Client Header (X-Client-Sport-Key passed by browser service)";
      } else if (process.env.VITE_FOOTBALL_API_KEY === apiKey) {
        results.apiKey.source = "Server Environment VITE_FOOTBALL_API_KEY";
      } else if (process.env.FOOTBALL_DATA_API_KEY === apiKey) {
        results.apiKey.source = "Server Environment FOOTBALL_DATA_API_KEY";
      } else {
        results.apiKey.source = "Firestore Settings Secure Document (sports_secure)";
      }
    } else {
      results.apiKey.error = "No API key found in either server environment variables or Firestore sports_secure collection.";
    }
  } catch (err: any) {
    results.apiKey.error = `Key decryption/reading failure: ${err.message}`;
  }

  // Reachability check (Direct ping avoiding proxy mechanics)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const keyToUse = (await getApiKey(req)) || "";
    
    const pingRes = await fetch("https://api.football-data.org/v4/competitions", {
      headers: { "X-Auth-Token": keyToUse },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    results.reachable.ok = pingRes.status !== 500;
    results.reachable.status = pingRes.status;
    console.log(`[Sports API Audit] Direct Reachability status: ${pingRes.status}`);
  } catch (err: any) {
    results.reachable.error = `Direct fetch path to api.football-data.org failed: ${err.message || err}`;
    console.error(`[Sports API Audit] Direct Reachability check failed:`, err);
  }

  // Competitions Endpoint Test
  try {
    const compData = await fetchFromFootballData("/competitions", req);
    results.competitions.ok = true;
    results.competitions.status = 200;
    results.competitions.rawResponse = `Success: Found ${compData.competitions?.length || 0} competitions.`;
  } catch (err: any) {
    results.competitions.error = err.message;
    results.competitions.status = err.message === "UNAUTHORIZED" ? 401 : (err.message === "FORBIDDEN" ? 403 : (err.message === "RATE_LIMIT" ? 429 : 500));
  }

  // Fixtures Endpoint Test
  try {
    const matchesData = await fetchFromFootballData("/matches", req);
    results.fixtures.ok = true;
    results.fixtures.status = 200;
    results.fixtures.rawResponse = `Success: Found ${matchesData.matches?.length || 0} fixtures matches today.`;
  } catch (err: any) {
    results.fixtures.error = err.message;
    results.fixtures.status = err.message === "UNAUTHORIZED" ? 401 : (err.message === "FORBIDDEN" ? 403 : (err.message === "RATE_LIMIT" ? 429 : 500));
  }

  // Standings PL Endpoint Test
  try {
    const standingsData = await fetchFromFootballData("/competitions/PL/standings", req);
    results.standings.ok = true;
    results.standings.status = 200;
    results.standings.rawResponse = `Success: Premier League (${standingsData.competition?.name || "PL"}) standings loaded correctly.`;
  } catch (err: any) {
    results.standings.error = err.message;
    results.standings.status = err.message === "UNAUTHORIZED" ? 401 : (err.message === "FORBIDDEN" ? 403 : (err.message === "RATE_LIMIT" ? 429 : 500));
  }

  console.log("[Sports API Audit] Comprehensive Server-Side Diagnostics Completed.");
  console.log("[Sports API Audit] Results summary:", JSON.stringify(results, null, 2));
  console.log("[Sports API Audit] ==============================================");

  return res.json(results);
});

// START EXPRESS/VITE WORKFLOW
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Radio Télévision Sismique] Server running on http://localhost:${PORT}`);
  });
}

startServer();
