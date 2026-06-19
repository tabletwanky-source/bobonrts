import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Flame, 
  Table, 
  List, 
  Flag, 
  ArrowLeft,
  Home
} from 'lucide-react';
import { SportsHome } from '../components/SportsHome';
import { SportsMatches } from '../components/SportsMatches';
import { SportsLive } from '../components/SportsLive';
import { SportsStandings } from '../components/SportsStandings';
import { SportsCompetitions } from '../components/SportsCompetitions';
import { SportsHaitiHub } from '../components/SportsHaitiHub';
import { SportsMatchDetail } from '../components/SportsMatchDetail';

type SportsTab = 'home' | 'matches' | 'live' | 'standings' | 'competitions' | 'haiti' | 'match_detail';

export const Sports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SportsTab>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedCompCode, setSelectedCompCode] = useState<string>('PL');

  // 1. Parsing current URL on mount & popstate
  const parsePath = () => {
    const path = window.location.pathname;
    
    // SEO Page titles
    let title = "Centrale Sportive | Radio Télévision Sismique";

    if (path.startsWith('/sports/matches')) {
      setActiveTab('matches');
      title = "Calendrier & Matchs de Football | Radio Télévision Sismique";
    } else if (path.startsWith('/sports/live')) {
      setActiveTab('live');
      title = "Scores en Direct & Livescore | Radio Télévision Sismique";
    } else if (path.startsWith('/sports/standings')) {
      setActiveTab('standings');
      title = "Classements des Championnats | Radio Télévision Sismique";
      
      // Parse query param competition if present
      const params = new URLSearchParams(window.location.search);
      const comp = params.get('competition');
      if (comp) {
        setSelectedCompCode(comp.toUpperCase());
      }
    } else if (path.startsWith('/sports/competitions')) {
      setActiveTab('competitions');
      title = "Championnats & Ligues | Radio Télévision Sismique";
    } else if (path.startsWith('/sports/haiti')) {
      setActiveTab('haiti');
      title = "Grenadiers d'Haïti FHF Hub | Radio Télévision Sismique";
    } else if (path.startsWith('/sports/match/')) {
      setActiveTab('match_detail');
      const segments = path.split('/');
      const matchIdStr = segments[segments.length - 1];
      const mId = Number(matchIdStr);
      if (!isNaN(mId)) {
        setSelectedMatchId(mId);
        title = `Détails du Match #${mId} | Radio Télévision Sismique`;
      } else {
        setActiveTab('home');
      }
    } else if (path === '/sports') {
      setActiveTab('home');
    } else {
      setActiveTab('home');
    }

    // Programmatically setting the document title for SEO
    document.title = title;
  };

  useEffect(() => {
    parsePath();
    
    // Listen for history popstates
    window.addEventListener('popstate', parsePath);
    return () => window.removeEventListener('popstate', parsePath);
  }, []);

  // HTML5 History Push State Proxy
  const handleTabChange = (tab: SportsTab, forcePath?: string) => {
    setActiveTab(tab);
    let newPath = '/sports';
    
    if (tab === 'matches') newPath = '/sports/matches';
    else if (tab === 'live') newPath = '/sports/live';
    else if (tab === 'standings') newPath = `/sports/standings?competition=${selectedCompCode}`;
    else if (tab === 'competitions') newPath = '/sports/competitions';
    else if (tab === 'haiti') newPath = '/sports/haiti';
    else if (tab === 'match_detail' && selectedMatchId) newPath = `/sports/match/${selectedMatchId}`;

    if (forcePath) newPath = forcePath;

    window.history.pushState(null, '', newPath);
    parsePath();
  };

  // 2. Rendering the active sports subview
  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <SportsHome 
            onNavigate={(route) => {
              window.history.pushState(null, '', route);
              parsePath();
            }}
            onSelectMatch={(id) => {
              setSelectedMatchId(id);
              handleTabChange('match_detail', `/sports/match/${id}`);
            }}
          />
        );
      case 'matches':
        return (
          <SportsMatches 
            onBack={() => handleTabChange('home')}
            onSelectMatch={(id) => {
              setSelectedMatchId(id);
              handleTabChange('match_detail', `/sports/match/${id}`);
            }}
            initialCompetition={selectedCompCode === 'PL' ? '' : selectedCompCode}
          />
        );
      case 'live':
        return (
          <SportsLive 
            onBack={() => handleTabChange('home')}
            onSelectMatch={(id) => {
              setSelectedMatchId(id);
              handleTabChange('match_detail', `/sports/match/${id}`);
            }}
          />
        );
      case 'standings':
        return (
          <SportsStandings 
            onBack={() => handleTabChange('home')}
            initialCompetition={selectedCompCode}
          />
        );
      case 'competitions':
        return (
          <SportsCompetitions 
            onBack={() => handleTabChange('home')}
            onSelectCompetition={(code) => {
              setSelectedCompCode(code);
              handleTabChange('standings', `/sports/standings?competition=${code}`);
            }}
          />
        );
      case 'haiti':
        return (
          <SportsHaitiHub 
            onBack={() => handleTabChange('home')}
            onSelectMatch={(id) => {
              setSelectedMatchId(id);
              handleTabChange('match_detail', `/sports/match/${id}`);
            }}
          />
        );
      case 'match_detail':
        return selectedMatchId ? (
          <SportsMatchDetail 
            matchId={selectedMatchId}
            onBack={() => handleTabChange('matches')}
          />
        ) : (
          <SportsHome 
            onNavigate={(route) => {
              window.history.pushState(null, '', route);
              parsePath();
            }}
            onSelectMatch={(id) => {
              setSelectedMatchId(id);
              handleTabChange('match_detail', `/sports/match/${id}`);
            }}
          />
        );
      default:
        return (
          <SportsHome 
            onNavigate={(route) => {
              window.history.pushState(null, '', route);
              parsePath();
            }}
            onSelectMatch={(id) => {
              setSelectedMatchId(id);
              handleTabChange('match_detail', `/sports/match/${id}`);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      
      {/* Sub-Header Navigation */}
      <div className="border-b border-slate-900 bg-slate-950 sticky top-0 z-30 select-none backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex overflow-x-auto scrollbar-none items-center space-x-2 md:space-x-4 py-3.5">
            
            <button
              onClick={() => handleTabChange('home')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                activeTab === 'home' 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
                  : 'text-slate-450 hover:text-white bg-slate-900 border border-slate-805'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Accueil Sport</span>
            </button>

            <button
              onClick={() => handleTabChange('matches')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                activeTab === 'matches' 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
                  : 'text-slate-450 hover:text-white bg-slate-900 border border-slate-805'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Matchs</span>
            </button>

            <button
              onClick={() => handleTabChange('live')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                activeTab === 'live' 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
                  : 'text-slate-450 hover:text-white bg-slate-900 border border-slate-805'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Directs</span>
            </button>

            <button
              onClick={() => handleTabChange('standings')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                activeTab === 'standings' 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
                  : 'text-slate-450 hover:text-white bg-slate-900 border border-slate-805'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Classements</span>
            </button>

            <button
              onClick={() => handleTabChange('competitions')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                activeTab === 'competitions' 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
                  : 'text-slate-450 hover:text-white bg-slate-900 border border-slate-805'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Ligues</span>
            </button>

            <button
              onClick={() => handleTabChange('haiti')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                activeTab === 'haiti' 
                  ? 'bg-gradient-to-r from-blue-700 to-red-650 text-white shadow-lg border border-transparent' 
                  : 'text-slate-450 hover:text-white bg-slate-900 border border-slate-805'
              }`}
            >
              <span className="text-sm shrink-0">🇭🇹</span>
              <span>Grenadiers</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main sports panel stage container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {renderActiveView()}
      </div>

    </div>
  );
};

export default Sports;
