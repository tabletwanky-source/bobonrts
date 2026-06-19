
import React from 'react';
import { STREAM_URL } from '../constants';
import SEO from '../components/SEO';

const Live: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO 
        title="Écouter la Radio en Direct"
        description="Écoutez Radio Télévision Sismique en direct. Notre station diffuse de la musique caribéenne, des analyses d'actualités et des émissions de divertissement animées."
        keywords="haiti live stream, radio haiti en direct, écouter radio sismique, live audio haïti, radio jacksonville florida"
        slugPath="/live"
      />
      <section className="bg-slate-900 py-16">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">EN DIRECT</h1>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-slate-400 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Studio Jacksonville opérationnel</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Player Area */}
            <div className="lg:col-span-2 space-y-8">
              <div className="aspect-video bg-black rounded-[2rem] overflow-hidden relative shadow-2xl border border-slate-800 group">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0">
                  <div className="w-32 h-32 bg-orange-600 rounded-full flex items-center justify-center text-white text-6xl font-black mb-6 shadow-2xl animate-pulse">
                    S
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Radio Sismique</h2>
                  <p className="text-orange-500 font-bold mb-8 uppercase tracking-widest">Le flux audio est actif</p>
                  
                  <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 w-full max-w-md">
                     <p className="text-slate-400 text-sm mb-4">Utilisez le lecteur flottant pour écouter</p>
                     <a 
                      href={STREAM_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block bg-white text-slate-950 px-8 py-3 rounded-full font-bold hover:bg-orange-500 hover:text-white transition-all w-full"
                    >
                      Ouvrir le flux direct
                    </a>
                  </div>
                </div>
                <div className="absolute bottom-8 left-8 flex items-center space-x-3 z-10">
                   <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded uppercase">LIVE AUDIO</div>
                   <div className="px-3 py-1 bg-slate-800 text-white text-[10px] font-black rounded uppercase">HD QUALITY</div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                <h3 className="text-xl font-black text-white mb-4">Radio Tele Sismique : La radio qui fait vibrer votre cœur</h3>
                <p className="text-slate-400 leading-relaxed">
                  Basée à Jacksonville, Floride, notre station vous propose le meilleur de la musique caribéenne, des informations en temps réel, et des émissions de débat captivantes. Rejoignez notre communauté mondiale pour une expérience média unique.
                </p>
              </div>
            </div>

            {/* Sidebar / Schedule */}
            <div className="space-y-8">
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
                <h3 className="text-white font-black text-xl mb-6">À Suivre</h3>
                <div className="space-y-6">
                  {[
                    { time: '14:00', title: 'Sismique Infos', color: 'bg-red-500' },
                    { time: '16:00', title: 'Culture Sismique', color: 'bg-purple-500' },
                    { time: '18:00', title: 'Sports Sismique', color: 'bg-green-500' },
                    { time: '20:00', title: 'Show Time (DJ Vibe)', color: 'bg-orange-500' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center space-x-4 group cursor-pointer">
                      <div className="text-slate-500 font-bold text-sm w-12">{s.time}</div>
                      <div className={`w-1 h-10 ${s.color} rounded-full`}></div>
                      <div className="text-white font-bold group-hover:text-orange-500 transition-colors">{s.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-600 rounded-3xl p-8 text-white">
                <h3 className="font-black text-xl mb-4">Interagissez !</h3>
                <p className="text-orange-100 text-sm mb-6">Envoyez-nous vos messages et dédicaces en direct sur WhatsApp.</p>
                <div className="space-y-4">
                   <div className="flex items-center space-x-3">
                     <span className="text-2xl">📱</span>
                     <span className="font-bold">+1 (904) 496 - 2016</span>
                   </div>
                   <div className="flex items-center space-x-3">
                     <span className="text-2xl">📧</span>
                     <span className="font-bold">renejohnmike33@gmail.com</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TV Live Section */}
      <section className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center space-x-4 mb-4">
               <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest animate-pulse">LIVE TV</span>
               <h2 className="text-4xl font-black text-white">Sismique TV</h2>
            </div>
            <p className="text-slate-400">Suivez nos émissions en direct vidéo haute définition depuis nos studios de Jacksonville.</p>
          </div>

          <div className="aspect-video max-w-5xl mx-auto bg-black rounded-[2rem] overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/ueea1o6pyPU?autoplay=0&rel=0" 
              title="Radio Télévision Sismique TV Live" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
            
            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl flex items-center space-x-2 border border-slate-700">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                  <span className="text-white text-xs font-bold uppercase tracking-widest">Diffusion Live</span>
               </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center space-y-6">
            <a 
              href="https://www.youtube.com/@RADIOTELESISMIQUE-d6d" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#FF0000] hover:bg-[#CC0000] text-white px-10 py-4 rounded-full font-black flex items-center space-x-3 transition-all transform hover:scale-105 shadow-xl shadow-red-600/20"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>REJOINDRE LA CHAÎNE YOUTUBE</span>
            </a>
            <p className="text-slate-500 text-xs italic">Intégration optimisée via YouTube API</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Live;
