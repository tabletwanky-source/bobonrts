export const sportsConfig = {
  provider: "football-data.org",
  apiBaseUrl: "https://api.football-data.org/v4",
  apiKey: (import.meta as any).env.VITE_FOOTBALL_API_KEY,
  enabled: true,
  cacheMinutes: 15,
  requestTimeout: 10000
};

export function updateSportsConfig(newConfig: Partial<typeof sportsConfig>) {
  Object.assign(sportsConfig, newConfig);
}

