
import React from 'react';
import { PROGRAMS } from '../constants';
import SEO from '../components/SEO';

const Emissions: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO 
        title="Grille des Émissions & Programmes radio"
        description="Découvrez la grille complète de nos émissions hebdomadaires sur Radio Télévision Sismique. Débats socio-politiques, chroniques musicales, émissions de foi et de spiritualité."
        keywords="émissions radio, programmes rts, radio haiti en direct, grille d'antenne, replays podcasts, radio haiti"
        slugPath="/emissions"
      />
      <section className="bg-slate-900 py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">Nos Émissions</h1>
          <p className="text-xl text-orange-500 font-bold uppercase tracking-[0.2em]">Votre grille de programmes officielle</p>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {PROGRAMS.map((prog) => (
              <div key={prog.id} className="bg-slate-900 rounded-[2rem] overflow-hidden group border border-slate-800 hover:border-orange-500/50 transition-all duration-500 flex flex-col h-full">
                <div className="relative h-64 flex-shrink-0">
                  <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    {prog.category}
                  </div>
                  {prog.time && (
                    <div className="absolute bottom-4 left-6 text-white font-bold flex items-center space-x-2">
                      <span className="text-orange-500">🕒</span>
                      <span>{prog.time}</span>
                    </div>
                  )}
                </div>
                <div className="p-8 flex-grow">
                  <h3 className="text-2xl font-black text-white mb-4 group-hover:text-orange-500 transition-colors">{prog.title}</h3>
                  <p className="text-slate-400 leading-relaxed mb-8">
                    {prog.description}
                  </p>
                  <button className="bg-slate-800 hover:bg-orange-600 text-white w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-3 group-hover:shadow-lg group-hover:shadow-orange-600/20">
                    <span>Revoir le replay</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-slate-950 p-12 rounded-[3rem] border border-slate-800">
            <h2 className="text-3xl font-black text-white mb-6">Vous souhaitez diffuser une annonce ?</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Propulsez votre entreprise grâce au <strong>Market Sismique</strong>. Contactez notre équipe marketing pour des opportunités de publicité et de partenariat.
            </p>
            <button className="bg-white text-slate-950 px-8 py-4 rounded-full font-black hover:bg-orange-500 hover:text-white transition-all">
              NOUS CONTACTER
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Emissions;
