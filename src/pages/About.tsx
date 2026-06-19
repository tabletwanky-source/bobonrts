
import React from 'react';
import SEO from '../components/SEO';

const About: React.FC = () => {
  return (
    <div className="min-h-screen">
      <SEO 
        title="À Propos de Nous | Notre Mission & Histoire"
        description="Qui sommes-nous ? Plongez dans l'histoire de Radio Télévision Sismique (RTS), média d'actualités et de culture caribéenne fondé par John Mike René à Jacksonville."
        keywords="a propos rts, radio télévision sismique, john mike rene, histoire rts, radio haitienne jacksonville, mission rts"
        slugPath="/about"
      />
      {/* Header */}
      <section className="bg-slate-900 py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">À Propos de nous</h1>
          <p className="text-xl text-orange-500 font-bold uppercase tracking-[0.2em]">L'histoire de la vibration</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-600/20 rounded-full blur-3xl"></div>
              <img 
                src="https://i.postimg.cc/cgJMQRY4/rts.png" 
                alt="Radio Télévision Sismique" 
                className="relative z-10 rounded-3xl shadow-2xl transition-all duration-700 w-full object-cover"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -right-6 bg-orange-600 p-8 rounded-3xl z-20 shadow-xl">
                <p className="text-white font-black text-2xl">John Mike René</p>
                <p className="text-orange-100 font-bold text-sm uppercase tracking-widest">Fondateur & Journaliste</p>
              </div>
            </div>
            <div>
              <h2 className="text-orange-500 font-black text-sm uppercase tracking-[0.3em] mb-4">From Vision to Voice</h2>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">De la vision à la voix</h3>
              <div className="space-y-6 text-slate-400 leading-relaxed text-lg">
                <p>
                  Radio Télévision Sismique est née d’une vision claire : créer un média capable de transformer l’information en impact et la parole en action. 
                  Fondée le 16 octobre 2024 à Jacksonville, Floride (USA) par le journaliste haïtien John Mike René, la station est le fruit d’une passion profonde pour le journalisme et le service communautaire.
                </p>
                <p>
                  Née à Port-au-Prince, Haïti, la vision de son fondateur s’est étendue bien au-delà des frontières. Aujourd’hui, Radio Télévision Sismique rassemble la diaspora haïtienne à travers le monde.
                </p>
                <p className="italic text-white font-semibold">
                  « C’est la vibration de votre cœur ❤️ », une devise qui traduit l’âme et l’engagement profond de la station envers son public.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎙️ Mot du PDG */}
      <section className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-orange-500 font-black text-sm uppercase tracking-[0.3em] mb-4">🎙️ Mot du PDG</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">Le message du dirigeant</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Professional Portrait */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl aspect-3/4 max-w-sm mx-auto">
                <img 
                  src="https://i.postimg.cc/wBMwBYcM/rtttss.jpg" 
                  alt="John Mike, PDG de Radio Télévision Sismique" 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 animate-fadeIn"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white font-black text-2xl truncate">John Mike</p>
                  <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mt-1">
                    PDG Radio Télévision Sismique
                  </p>
                </div>
              </div>
            </div>

            {/* Contents: Bio, Vision, Media Leadership */}
            <div className="lg:col-span-7 space-y-8">
              {/* Biography Section */}
              <div className="space-y-4">
                <h4 className="text-white font-extrabold text-xl uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                  Biographie
                </h4>
                <p className="text-slate-350 text-base md:text-lg leading-relaxed font-semibold">
                  Professionnel des médias chevronné et visionnaire engagé, John Mike dirige Radio Télévision Sismique avec la ferme conviction que l’information doit servir de levier pour la communauté. Fort de plusieurs années d'expertise journalistique et de leadership, il a su bâtir un réseau d'informations de premier plan destiné à la diaspora haïtienne et aux auditeurs du monde entier.
                </p>
              </div>

              {/* Vision Statement */}
              <div className="space-y-4">
                <h4 className="text-white font-extrabold text-xl uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                  Vision Directeur
                </h4>
                <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 italic text-slate-400 font-medium leading-relaxed">
                  « Notre ambition est d'offrir une plateforme moderne, authentique et sans compromis, qui fait vibrer le cœur de notre communauté partout dans le monde. Radio Télévision Sismique n'est pas seulement un canal de diffusion; c'est un créateur de liens, un incubateur d'éveil citoyen et un miroir culturel pour la diaspora haïtienne. »
                </div>
              </div>

              {/* Media Leadership Section */}
              <div className="space-y-4">
                <h4 className="text-white font-extrabold text-xl uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                  Leadership Média & Innovation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-orange-500 text-lg font-black block">Transparence</span>
                    <span className="text-slate-450 text-xs font-semibold mt-1 block">Une couverture médiatique honnête, indépendante de toute influence extérieure.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-orange-500 text-lg font-black block">Modernisation</span>
                    <span className="text-slate-450 text-xs font-semibold mt-1 block">Intégration d'outils digitaux de pointe et de diffusions interactives en direct.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-slate-950 p-12 rounded-[2rem] border border-slate-800 shadow-xl">
              <div className="w-16 h-16 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-8">🎯</div>
              <h3 className="text-3xl font-black text-white mb-6">Notre Mission</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Informer, former et divertir à travers des contenus médiatiques fiables, éducatifs et inspirants. Nous soutenons activement la liberté d’expression et donnons une voix à ceux qui sont souvent marginalisés. RTS utilise le média comme un outil de formation et de développement social.
              </p>
            </div>
            <div className="bg-slate-950 p-12 rounded-[2rem] border border-slate-800 shadow-xl">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center text-3xl mb-8">🌍</div>
              <h3 className="text-3xl font-black text-white mb-6">Notre Vision</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Devenir une référence médiatique haïtienne et internationale, reconnue pour son professionnalisme et son intégrité. Nous aspirons à être un levier puissant de changement positif, renforçant l'identité culturelle et favorisant une meilleure compréhension du monde.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white">Nos Valeurs Fondamentales</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { title: 'Intégrité', icon: '⚖️' },
              { title: 'Engagement', icon: '🤝' },
              { title: 'Éducation', icon: '🎓' },
              { title: 'Respect', icon: '💎' },
              { title: 'Innovation', icon: '🚀' },
              { title: 'Passion', icon: '🔥' },
            ].map((v) => (
              <div key={v.title} className="text-center group">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-800 group-hover:border-orange-500 group-hover:bg-orange-600 transition-all duration-300">
                  {v.icon}
                </div>
                <h4 className="text-white font-bold">{v.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white">Ce que disent nos auditeurs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "Radio Télé Sismique est devenue ma source d'information quotidienne. Un média crédible.", author: "Auditeur, USA" },
              { quote: "Une radio qui éduque, motive et divertit à la fois. On sent la passion.", author: "Auditrice, Haïti" },
              { quote: "Grâce à RTS, la diaspora reste connectée à la réalité haïtienne.", author: "Auditeur, Canada" }
            ].map((t, i) => (
              <div key={i} className="bg-slate-950 p-8 rounded-3xl border-l-4 border-orange-600 italic text-slate-400">
                <p className="mb-6 text-lg">"{t.quote}"</p>
                <p className="text-white font-bold not-italic">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
