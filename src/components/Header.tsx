
import React, { useState } from 'react';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userProfile } = useAuth();

  const navItems = [
    { label: 'Accueil', value: Page.Home },
    { label: '⚽ Sports', value: Page.Sports },
    { label: 'Grille TV/Radio', value: Page.Programmes },
    { label: 'Espace Citoyen', value: Page.EspaceCitoyen },
    { label: 'Direct', value: Page.Live },
    { label: 'Émissions', value: Page.Emissions },
    { label: 'Actualités', value: Page.News },
    { label: 'Blog', value: Page.Blog },
    { label: 'À Propos', value: Page.About },
  ];

  const handleNavClick = (item: any) => {
    if (item.url) {
      window.location.href = item.url;
    } else {
      setCurrentPage(item.value);
    }
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer group shrink-0" 
          onClick={() => setCurrentPage(Page.Home)}
        >
          <img 
            src="https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png" 
            alt="Radio Télévision Sismique Logo" 
            className="w-12 h-12 object-contain group-hover:scale-110 transition-transform shadow-lg" 
          />
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">SISMIQUE</h1>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Radio Télévision</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center space-x-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={`text-sm font-semibold transition-colors ${
                currentPage === item.value ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* User Account / Espace Auditeur widget */}
          {user ? (
            <div className="flex items-center pl-2 border-l border-slate-850">
              <button 
                onClick={() => setCurrentPage(Page.Dashboard)}
                className={`flex items-center space-x-2 text-xs font-bold uppercase py-1.5 px-3 rounded-lg border transition-all ${
                  currentPage === Page.Dashboard
                    ? 'bg-orange-600/10 text-orange-400 border-orange-500/30'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title="Tableau de bord Auditeur personnalisé"
                id="header_user_dash_btn"
              >
                <img 
                  src={userProfile?.avatar || "https://api.dicebear.com/7.x/bottts/svg"} 
                  className="w-5 h-5 rounded-full bg-slate-900 object-cover" 
                  alt="" 
                />
                <span className="max-w-[80px] truncate">{userProfile?.fullName.split(' ')[0] || 'Auditeur'}</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setCurrentPage(Page.Login)}
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-orange-400 py-1.5 px-3 border border-slate-800 hover:border-orange-500/30 rounded-lg transition-all bg-slate-950/40"
              id="header_login_trigger_btn"
            >
              Auditeur
            </button>
          )}

          <button 
            onClick={() => setCurrentPage(Page.Live)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-2 animate-pulse"
          >
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <span>Écouter Live</span>
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-white p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6" fill="slate" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden bg-slate-800 border-t border-slate-700 p-4 space-y-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={`block w-full text-left py-2 font-bold ${
                currentPage === item.value ? 'text-orange-500' : 'text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
          
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700">
            {user ? (
              <button
                onClick={() => { setCurrentPage(Page.Dashboard); setIsOpen(false); }}
                className="w-full text-center bg-slate-900 text-orange-400 border border-slate-700 py-2.5 rounded-xl text-xs font-bold uppercase"
              >
                Mon Compte
              </button>
            ) : (
              <button
                onClick={() => { setCurrentPage(Page.Login); setIsOpen(false); }}
                className="w-full text-center bg-slate-900 text-slate-300 border border-slate-700 py-2.5 rounded-xl text-xs font-bold uppercase"
              >
                Connexion
              </button>
            )}
            <button 
              onClick={() => { setCurrentPage(Page.Live); setIsOpen(false); }}
              className="w-full text-center bg-orange-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider animate-pulse"
            >
              Direct Live 🎙️
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
