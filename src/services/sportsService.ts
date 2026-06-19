import { sportsConfig } from '../config/sportsConfig';

// Custom error classes for sports service
export class SportsApiError extends Error {
  constructor(message: string, public code: 'API_KEY_MISSING' | 'API_UNAVAILABLE') {
    super(message);
    this.name = 'SportsApiError';
  }
}

/**
 * Centered service to handle all football-data.org related sports requests.
 * Uses sportsConfig for all configurations and handles error mapping.
 */
export const sportsService = {
  /**
   * Helper to perform fetches through our proxy or directly if configured
   */
  async fetchWithConfig(endpoint: string, params?: Record<string, string>): Promise<any> {
    // 1. Check if Sports Module is enabled in config
    if (!sportsConfig.enabled) {
      throw new SportsApiError("Données sportives temporairement indisponibles.", "API_UNAVAILABLE");
    }

    // 2. Build Query Params
    const urlParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) urlParams.append(key, val);
      });
    }
    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';

    // 3. Perform Fetch
    try {
      // We leverage the backend proxy server to route safely and evade CORS, 
      // but we enforce sportsConfig validation, applying timeout if specified
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), sportsConfig.requestTimeout || 10000);

      // Map endpoints to our API proxied routes
      let localApiPath = '';
      if (endpoint === '/matches') {
        localApiPath = `/api/sports/matches${queryString}`;
      } else if (endpoint.startsWith('/competitions/') && endpoint.endsWith('/matches')) {
        const compCode = endpoint.split('/')[2];
        localApiPath = `/api/sports/matches?competition=${compCode}${queryString ? '&' + queryString.substring(1) : ''}`;
      } else if (endpoint === '/matches?status=LIVE') {
        localApiPath = '/api/sports/live';
      } else if (endpoint.startsWith('/competitions/') && endpoint.endsWith('/standings')) {
        const compCode = endpoint.split('/')[2];
        localApiPath = `/api/sports/standings?competition=${compCode}`;
      } else if (endpoint.startsWith('/matches/')) {
        const matchId = endpoint.split('/')[2];
        localApiPath = `/api/sports/match/${matchId}`;
      } else if (endpoint === '/haiti') {
        localApiPath = '/api/sports/haiti';
      } else {
        // Fallback fallback if calling another custom endpoint
        localApiPath = `/api/sports/matches${queryString}`;
      }

      const response = await fetch(localApiPath, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          // Pass VITEAPIKey if available as custom header so server can fall back to it
          'X-Client-Sport-Key': sportsConfig.apiKey || ''
        }
      });

      clearTimeout(timeoutId);

      // Check if response returned 400/403 with API_KEY_MISSING, or if Response was unauthorized
      if (!response.ok) {
        let errJson: any = null;
        try {
          errJson = await response.json();
        } catch (_) {}

        if (response.status === 400 || response.status === 403 || (errJson && errJson.error === 'API-KEY-MISSING')) {
          throw new SportsApiError("Configuration de l'API sportive requise.", "API_KEY_MISSING");
        }
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();

      // Additional sanity check: if the server says API key is missing inside body JSON
      if (data && data.error === 'API-KEY-MISSING') {
        throw new SportsApiError("Configuration de l'API sportive requise.", "API_KEY_MISSING");
      }

      return data;
    } catch (error: any) {
      if (error instanceof SportsApiError) {
        throw error;
      }
      
      // Check if client-side knows the API key is missing before failing to "unavailable"
      if (!sportsConfig.apiKey) {
        throw new SportsApiError("Configuration de l'API sportive requise.", "API_KEY_MISSING");
      }

      console.error("Sports Service fetch error: ", error);
      throw new SportsApiError("Données sportives temporairement indisponibles.", "API_UNAVAILABLE");
    }
  },

  /**
   * getMatches(competition, status)
   */
  async getMatches(competition?: string, status?: string): Promise<any> {
    const endpoint = competition ? `/competitions/${competition}/matches` : '/matches';
    return this.fetchWithConfig(endpoint, status ? { status } : undefined);
  },

  /**
   * getLiveMatches()
   */
  async getLiveMatches(): Promise<any> {
    return this.fetchWithConfig('/matches?status=LIVE');
  },

  /**
   * getStandings(competition)
   */
  async getStandings(competition: string): Promise<any> {
    return this.fetchWithConfig(`/competitions/${competition}/standings`);
  },

  /**
   * getCompetitions()
   */
  async getCompetitions(): Promise<any> {
    // Enabled competitions are normally managed in settings. 
    // We fetch current settings config from backend
    try {
      const res = await fetch('/api/sports/config');
      if (res.ok) {
        return res.json();
      }
    } catch (e) {
      console.warn("Failed to fetch enabled competitions config, utilizing fallback", e);
    }
    return {
      enabledCompetitions: ["PL", "PD", "BL1", "SA", "FL1", "CL", "WC"]
    };
  },

  /**
   * getTeamMatches() - fetches Haiti national team or specific team matches
   */
  async getTeamMatches(): Promise<any> {
    return this.fetchWithConfig('/haiti');
  },

  /**
   * getMatchDetail() - fetches single match details
   */
  async getMatchDetail(matchId: number): Promise<any> {
    return this.fetchWithConfig(`/matches/${matchId}`);
  },

  /**
   * runDiagnostics() - triggers complete integration audit on the server
   */
  async runDiagnostics(): Promise<any> {
    const res = await fetch('/api/sports/test-diagnostics', {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Sport-Key': sportsConfig.apiKey || ''
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return res.json();
  }
};
