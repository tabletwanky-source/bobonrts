
import React from 'react';
import { Page } from '../types';

interface FooterProps {
  setCurrentPage: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ setCurrentPage }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-center md:text-left">
          {/* Brand Column */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src="https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png" 
                alt="Radio Télévision Sismique" 
                className="w-12 h-12 object-contain" 
              />
              <div className="text-left">
                <h2 className="text-xl font-black text-white leading-none">SISMIQUE</h2>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Radio Télévision</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs mx-auto md:mx-0">
              La radio qui fait vibrer votre cœur. Fondée par John Mike René à Jacksonville, Floride. 
              Média généraliste et commercial au service de la communauté.
            </p>
            <div className="flex space-x-4 mb-8 justify-center md:justify-start">
              <a href="https://www.facebook.com/share/1Ey9LSGZZH/" target="_blank" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:bg-orange-600 hover:text-white transition-all" aria-label="Facebook">F</a>
              <a href="https://www.instagram.com/radiotelesismique" target="_blank" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:bg-orange-600 hover:text-white transition-all" aria-label="Instagram">I</a>
              <a href="https://x.com/RadioSismique" target="_blank" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:bg-orange-600 hover:text-white transition-all" aria-label="X">X</a>
              <a href="https://youtube.com/@radiotelesismique-d6d" target="_blank" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:bg-orange-600 hover:text-white transition-all" aria-label="YouTube">Y</a>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="text-white font-bold mb-6">Navigation</h3>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><button onClick={() => setCurrentPage(Page.Home)} className="hover:text-orange-500 transition-colors">Accueil</button></li>
              <li><button onClick={() => setCurrentPage(Page.Programmes)} className="hover:text-orange-500 transition-colors">Grille TV/Radio</button></li>
              <li><button onClick={() => setCurrentPage(Page.EspaceCitoyen)} className="hover:text-orange-500 transition-colors">Espace Citoyen</button></li>
              <li><button onClick={() => setCurrentPage(Page.Live)} className="hover:text-orange-500 transition-colors">Direct / Live</button></li>
              <li><button onClick={() => setCurrentPage(Page.Emissions)} className="hover:text-orange-500 transition-colors">Émissions</button></li>
              <li><button onClick={() => setCurrentPage(Page.News)} className="hover:text-orange-500 transition-colors">Actualités</button></li>
              <li><button onClick={() => setCurrentPage(Page.About)} className="hover:text-orange-500 transition-colors">À Propos</button></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-bold mb-6">Légal</h3>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><button onClick={() => setCurrentPage(Page.Privacy)} className="hover:text-orange-500 transition-colors">Confidentialité</button></li>
              <li><button onClick={() => setCurrentPage(Page.Terms)} className="hover:text-orange-500 transition-colors">Conditions</button></li>
              <li><button onClick={() => setCurrentPage(Page.Cookies)} className="hover:text-orange-500 transition-colors">Cookies</button></li>
              <li><button onClick={() => setCurrentPage(Page.Disclaimer)} className="hover:text-orange-500 transition-colors">Avis de non-responsabilité</button></li>
              <li><button onClick={() => setCurrentPage(Page.LegalMentions)} className="hover:text-orange-500 transition-colors">Mentions Légales</button></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-bold mb-6">Contact</h3>
            <ul className="space-y-4 text-slate-400 text-sm text-center md:text-left">
              <li className="flex items-start md:items-center space-x-3 justify-center md:justify-start">
                <span className="text-orange-500 flex-shrink-0" aria-hidden="true">📍</span>
                <span>Jacksonville, Florida, USA<br className="md:hidden"/> ZIP: 32068</span>
              </li>
              <li className="flex items-center space-x-3 justify-center md:justify-start">
                <span className="text-orange-500" aria-hidden="true">📞</span>
                <span>+1 (904) 496 - 2016</span>
              </li>
              <li className="flex items-center space-x-3 justify-center md:justify-start">
                <span className="text-orange-500" aria-hidden="true">✉️</span>
                <span>renejohnmike33@gmail.com</span>
              </li>
            </ul>

            {/* App Download Badge */}
            <div className="mt-8 flex flex-col items-center md:items-start">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Notre Application</h4>
              <a 
                href="https://play.google.com/store/apps/details?id=radio.televisionsismique6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
              >
                <img 
                  src="https://i.postimg.cc/Y26zxTK9/badge-android-store-40px-37e7fb1d2aea.png" 
                  alt="Download on Google Play" 
                  className="h-12 w-auto shadow-xl rounded-md"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Row */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0 text-center">
          <p>© 2024–{new Date().getFullYear()} Radio Télévision Sismique. Tous droits réservés. La radio qui fait vibrer votre cœur ❤️</p>
          <div className="flex space-x-6 justify-center">
            <button onClick={() => setCurrentPage(Page.Privacy)} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => setCurrentPage(Page.Terms)} className="hover:text-white transition-colors">Terms of Service</button>
            <button onClick={() => setCurrentPage(Page.Cookies)} className="hover:text-white transition-colors">Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
