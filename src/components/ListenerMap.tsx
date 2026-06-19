import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  Users, 
  Activity, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface CountryListener {
  name: string;
  code: string;
  flag: string;
  listeners: number;
  cities: { name: string; region: string; count: number }[];
  cx: number; // SVG X coordinate
  cy: number; // SVG Y coordinate
}

const INITIAL_COUNTRIES: CountryListener[] = [
  { 
    name: 'Haïti', 
    code: 'HT', 
    flag: '🇭🇹', 
    listeners: 3412, 
    cx: 280, 
    cy: 210,
    cities: [
      { name: 'Port-au-Prince', region: 'Ouest', count: 1840 },
      { name: 'Cap-Haïtien', region: 'Nord', count: 720 },
      { name: 'Les Cayes', region: 'Sud', count: 480 },
      { name: 'Gonaïves', region: 'Artibonite', count: 372 }
    ]
  },
  { 
    name: 'États-Unis', 
    code: 'US', 
    flag: '🇺🇸', 
    listeners: 2894, 
    cx: 190, 
    cy: 140,
    cities: [
      { name: 'Miami', region: 'Floride', count: 1250 },
      { name: 'New York City', region: 'New York', count: 980 },
      { name: 'Boston', region: 'Massachusetts', count: 420 },
      { name: 'Atlanta', region: 'Géorgie', count: 244 }
    ]
  },
  { 
    name: 'Dominican Rep.', 
    code: 'DO', 
    flag: '🇩🇴', 
    listeners: 1450, 
    cx: 300, 
    cy: 205,
    cities: [
      { name: 'Santo Domingo', region: 'Distrito Nacional', count: 890 },
      { name: 'Santiago', region: 'Santiago', count: 380 },
      { name: 'La Romana', region: 'La Romana', count: 180 }
    ]
  },
  { 
    name: 'Canada', 
    code: 'CA', 
    flag: '🇨🇦', 
    listeners: 1210, 
    cx: 180, 
    cy: 90,
    cities: [
      { name: 'Montréal', region: 'Québec', count: 890 },
      { name: 'Ottawa', region: 'Ontario', count: 180 },
      { name: 'Laval', region: 'Québec', count: 140 }
    ]
  },
  { 
    name: 'France', 
    code: 'FR', 
    flag: '🇫🇷', 
    listeners: 988, 
    cx: 480, 
    cy: 110,
    cities: [
      { name: 'Paris', region: 'Île-de-France', count: 590 },
      { name: 'Marseille', region: 'PACA', count: 218 },
      { name: 'Lyon', region: 'Rhône-Alpes', count: 180 }
    ]
  }
];

const ListenerMap: React.FC = () => {
  const [countries, setCountries] = useState<CountryListener[]>(INITIAL_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState<CountryListener>(INITIAL_COUNTRIES[0]);
  const [totalConnected, setTotalConnected] = useState(9954);
  const [activeDots, setActiveDots] = useState<number[]>([0, 1, 2]);

  // Simulate real-time micro variations in listener counts
  useEffect(() => {
    const interval = setInterval(() => {
      setCountries(prevCountries => {
        const updated = prevCountries.map(c => {
          // Increment or decrement randomly
          const diff = Math.floor(Math.random() * 9) - 4; // -4 to +4
          return {
            ...c,
            listeners: Math.max(100, c.listeners + diff)
          };
        });
        
        // Compute total
        const newTotal = updated.reduce((sum, c) => sum + c.listeners, 0) + 1200; // adding other worldwide nodes
        setTotalConnected(newTotal);

        // Update selected country stats
        const currentSelected = updated.find(u => u.code === selectedCountry.code);
        if (currentSelected) {
          setSelectedCountry(currentSelected);
        }

        return updated;
      });

      // Randomized active dots
      const numDots = Math.floor(Math.random() * 3) + 1;
      const indexArr: number[] = [];
      while (indexArr.length < numDots) {
        const idx = Math.floor(Math.random() * 5);
        if (!indexArr.includes(idx)) indexArr.push(idx);
      }
      setActiveDots(indexArr);

    }, 5000);

    return () => clearInterval(interval);
  }, [selectedCountry]);

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-900 relative overflow-hidden" id="worldwide-listeners-map-section">
      {/* Glow background radial lights */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-20">
        
        {/* Section Header Title */}
        <div className="text-center max-w-xl mx-auto mb-16 animate-fade-in">
          <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2.5 flex items-center justify-center gap-1.5 font-mono">
            <Globe className="w-3.5 h-3.5 text-orange-500" />
            <span>Audience de la Diaspora Sismique</span>
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            🌎 Nos Auditeurs à Travers le Monde
          </h2>
          <p className="text-slate-400 text-xs mt-3 leading-relaxed">
            Grâce au streaming haute définition, Radio Télévision Sismique réunit la communauté haïtienne aux quatre coins du globe. Découvrez notre impact en temps réel.
          </p>
        </div>

        {/* Real-time Online Counter header stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          
          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex items-center space-x-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/15 shrink-0">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-mono">Auditeurs en ligne</p>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl font-black text-white tracking-tight font-mono">
                  {totalConnected.toLocaleString()}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex items-center space-x-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/15 shrink-0">
              <MapPin className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-mono">Pays Connectés</p>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl font-black text-white tracking-tight font-mono">42+</span>
                <span className="text-[10px] text-slate-400 font-bold">Nations</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex items-center space-x-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15 shrink-0">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-mono">Qualité de Flux</p>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl font-black text-white tracking-tight font-mono">99.9%</span>
                <span className="text-[10px] text-emerald-400 font-black font-mono">HD STEREO</span>
              </div>
            </div>
          </div>

        </div>

        {/* MAP & DETAIL VIEW ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* MAP CANVAS GRID */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden min-h-[380px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono mb-4 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              <span>GÉOLOCALISATION DU STRÉAMING</span>
            </p>

            {/* Futuristic Vectorized Styled SVG Map Container */}
            <div className="relative w-full flex-grow flex items-center justify-center">
              <svg 
                viewBox="0 0 600 350" 
                className="w-full h-auto max-w-lg select-none opacity-90"
              >
                {/* World map background silhouettes coordinates */}
                <path 
                  fill="#1e293b" 
                  opacity="0.3"
                  d="M100,105 L150,110 L160,80 L180,90 L220,110 L210,130 L190,140 L180,160 L140,150 L110,130 Z M460,80 L480,90 L510,100 L540,110 L520,140 L490,120 L480,140 L450,110 Z M250,180 L290,190 L310,210 L300,230 L270,225 L255,200 Z" 
                />
                
                {/* Visual grid representation */}
                <g stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.05" fill="none">
                  <line x1="0" y1="50" x2="600" y2="50" />
                  <line x1="0" y1="100" x2="600" y2="100" />
                  <line x1="0" y1="150" x2="600" y2="150" />
                  <line x1="0" y1="200" x2="600" y2="200" />
                  <line x1="0" y1="250" x2="600" y2="250" />
                  <line x1="0" y1="300" x2="600" y2="300" />
                  <line x1="100" y1="0" x2="100" y2="350" />
                  <line x1="200" y1="0" x2="200" y2="350" />
                  <line x1="300" y1="0" x2="300" y2="350" />
                  <line x1="400" y1="0" x2="400" y2="350" />
                  <line x1="500" y1="0" x2="500" y2="350" />
                </g>

                {/* Draw connection lines from Haiti to USA, Canada, France, DR */}
                <g stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" fill="none">
                  {countries.map((c) => {
                    if (c.code === 'HT') return null;
                    return (
                      <path 
                        key={`line-${c.code}`}
                        d={`M 280 210 Q ${(280 + c.cx) / 2} ${(210 + c.cy) / 2 - 40} ${c.cx} ${c.cy}`} 
                      />
                    );
                  })}
                </g>

                {/* Pulsating dots for key listening regions */}
                {countries.map((country, idx) => {
                  const isSelected = selectedCountry?.code === country.code;
                  const isPulsing = activeDots.includes(idx) || isSelected;

                  return (
                    <g 
                      key={country.code} 
                      className="cursor-pointer group"
                      onClick={() => setSelectedCountry(country)}
                    >
                      {/* Interactive hover circle hitbox */}
                      <circle cx={country.cx} cy={country.cy} r="16" fill="transparent" />

                      {/* Pulsing ring animation */}
                      {isPulsing && (
                        <circle 
                          cx={country.cx} 
                          cy={country.cy} 
                          r={isSelected ? "12" : "8"} 
                          fill="none" 
                          stroke={country.code === 'HT' ? "#ef4444" : "#f97316"} 
                          strokeWidth="1.5" 
                          opacity="0.8"
                          className="animate-ping"
                          style={{ transformOrigin: `${country.cx}px ${country.cy}px` }}
                        />
                      )}

                      {/* Static Point center */}
                      <circle 
                        cx={country.cx} 
                        cy={country.cy} 
                        r={isSelected ? "5" : "3.5"} 
                        fill={isSelected ? (country.code === 'HT' ? "#ef4444" : "#f97316") : "#475569"} 
                        className="transition-all duration-300 group-hover:fill-orange-400 group-hover:r-5 font-bold"
                      />

                      {/* Country code tag display */}
                      <text 
                        x={country.cx} 
                        y={country.cy - 12} 
                        fill={isSelected ? "#ffffff" : "#94a3b8"} 
                        fontSize="9" 
                        fontWeight="900" 
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="pointer-events-none tracking-tight transition-all"
                      >
                        {country.flag} {country.code}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="text-[10px] text-slate-500 font-bold self-start mt-4">
              💡 Cliquez sur les points géographiques pour filtrer l'activité par pays.
            </p>
          </div>

          {/* DENSITY DETAILS & TOP LIST SIDE */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Country list items selector */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center justify-between">
                <span>Top pays d'écoute</span>
                <span className="text-[10px] text-orange-400">Auditeurs</span>
              </h3>

              <div className="space-y-3.5">
                {countries.map((c) => {
                  const isSelected = selectedCountry?.code === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => setSelectedCountry(c)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-950/80 border-slate-700/80 shadow-inner' 
                          : 'bg-slate-950/30 border-slate-850 hover:bg-slate-950/50 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-xl select-none">{c.flag}</span>
                        <div className="truncate">
                          <p className="font-bold text-slate-200 text-xs">{c.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono tracking-wider font-semibold uppercase">{c.cities.length} métropoles</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 font-mono">
                        <span className="font-extrabold text-xs text-white">
                          {c.listeners.toLocaleString()}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isSelected ? 'translate-x-1 text-orange-400' : ''}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Country region & cities dashboard card */}
            {selectedCountry && (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-secondary/15">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{selectedCountry.flag}</span>
                    <h4 className="font-black text-white uppercase text-sm tracking-tight">{selectedCountry.name}</h4>
                  </div>
                  <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase font-mono tracking-widest">
                    Live Density
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-[#475569] font-mono mb-3">
                  AUDIENCE PAR VILLE / DÉPARTEMENT / RÉGION
                </p>

                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {selectedCountry.cities.map((city) => {
                    const ratio = Math.round((city.count / selectedCountry.listeners) * 100);
                    return (
                      <div key={city.name} className="flex flex-col gap-1.5 p-2 bg-slate-950/40 rounded-xl border border-slate-850">
                        <div className="flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-white truncate block">{city.name}</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block font-mono">{city.region}</span>
                          </div>
                          <span className="font-bold text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            {city.count.toLocaleString()} <span className="text-[9px] text-slate-500 font-medium">({ratio}%)</span>
                          </span>
                        </div>

                        {/* Visual rating scale */}
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-orange-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${ratio}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

export default ListenerMap;
