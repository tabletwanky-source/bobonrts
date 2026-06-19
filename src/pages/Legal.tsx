
import React from 'react';
import { Page } from '../types';

interface LegalProps {
  type: Page;
  setCurrentPage: (page: Page) => void;
}

const Legal: React.FC<LegalProps> = ({ type, setCurrentPage }) => {
  const officialEmail = "contact@radiotelevisionsismique.com";
  const officialName = "Radio Tele Sismique (RTS)";
  const officialAddress = "Jacksonville, Florida, États-Unis";

  const renderContent = () => {
    switch (type) {
      case Page.Privacy:
        return (
          <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black text-white mb-8 border-b border-orange-600 pb-4">Politique de Confidentialité 🔐</h1>
            <div className="space-y-8 text-slate-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Collecte des données personnelles</h2>
                <p className="mb-4">Radio Tele Sismique (RTS) collecte des données personnelles lorsque vous utilisez notre site Radiotelevisionsismique.com ou nos services. Les informations collectées incluent :</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-400">
                  <li>Identifiants : Nom, prénom, adresse IP.</li>
                  <li>Contact : Adresse e-mail, numéro de téléphone.</li>
                  <li>Navigation : Cookies, données de trafic, journaux système.</li>
                  <li>Messages : Contenu envoyé via nos formulaires de contact.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Utilisation des données</h2>
                <p className="mb-4">Vos données sont traitées pour les finalités suivantes :</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-400">
                  <li>Fourniture et amélioration de nos services de streaming et d'information.</li>
                  <li>Communication avec nos auditeurs et réponse aux demandes de support.</li>
                  <li>Analyse statistique pour optimiser l'expérience utilisateur.</li>
                  <li>Respect de nos obligations légales et réglementaires.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Protection et sécurité</h2>
                <p>Nous mettons en œuvre des mesures de sécurité techniques (chiffrement SSL, pare-feu) et organisationnelles pour protéger vos données contre tout accès non autorisé, altération ou divulgation. Toutefois, aucun système de transmission sur Internet n'est garanti à 100%.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Droits des utilisateurs</h2>
                <p className="mb-4">Conformément aux lois sur la protection des données, vous disposez des droits suivants :</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-400">
                  <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles.</li>
                  <li><strong>Droit de rectification :</strong> Corriger des informations inexactes.</li>
                  <li><strong>Droit de suppression :</strong> Demander l'effacement de vos données.</li>
                  <li><strong>Droit d'opposition :</strong> Refuser le traitement de vos données pour certains motifs.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Services tiers</h2>
                <p>Nous utilisons des services tiers (hébergement, Google Analytics, lecteurs Zeno FM) qui peuvent collecter des données selon leurs propres politiques de confidentialité. Nous vous encourageons à les consulter.</p>
              </section>

              <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4">6. Contact</h2>
                <p>Pour toute question ou exercice de vos droits, contactez-nous :</p>
                <p className="mt-2">📧 Email : <a href={`mailto:${officialEmail}`} className="text-orange-500 hover:underline">{officialEmail}</a></p>
                <p>📍 Adresse : {officialAddress}</p>
              </section>
            </div>
          </article>
        );
      case Page.Terms:
        return (
          <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black text-white mb-8 border-b border-orange-600 pb-4">Conditions d'Utilisation 📜</h1>
            <div className="space-y-8 text-slate-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptation des conditions</h2>
                <p>En accédant au site Radiotelevisionsismique.com, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous ne les acceptez pas, veuillez cesser toute navigation sur le site.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Accès au service</h2>
                <p>RTS s'efforce de maintenir l'accès au site 24h/24. Cependant, l'accès peut être suspendu sans préavis pour des raisons de maintenance, de mise à jour ou de problèmes techniques indépendants de notre volonté.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Responsabilité de l'utilisateur</h2>
                <p className="mb-4">L'utilisateur s'engage à :</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-400">
                  <li>Utiliser les services de manière légale et conforme à l'ordre public.</li>
                  <li>Ne pas tenter de perturber l'infrastructure technique du site.</li>
                  <li>Respecter les droits de propriété intellectuelle de RTS.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Propriété intellectuelle</h2>
                <p>Tous les éléments du site (textes, logos, flux audio/vidéo, designs) sont la propriété exclusive de {officialName}. Toute reproduction ou diffusion non autorisée constitue une contrefaçon passible de poursuites.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Limitation de responsabilité</h2>
                <p>RTS ne pourra être tenue responsable des dommages indirects, pertes de données ou interruptions de service liés à l'utilisation du site ou à l'impossibilité d'y accéder.</p>
              </section>
            </div>
          </article>
        );
      case Page.Cookies:
        return (
          <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black text-white mb-8 border-b border-orange-600 pb-4">Politique de Cookies 🍪</h1>
            <div className="space-y-8 text-slate-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Définition des cookies</h2>
                <p>Un cookie est un petit fichier texte stocké sur votre terminal lors de la visite d'un site. Il permet de mémoriser vos préférences et d'optimiser votre navigation.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Types de cookies utilisés</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="font-bold text-white mb-2">Essentiels</h3>
                    <p className="text-sm text-slate-400">Indispensables au fonctionnement du lecteur radio et de la navigation sécurisée.</p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="font-bold text-white mb-2">Performance</h3>
                    <p className="text-sm text-slate-400">Mesurent l'audience et nous aident à comprendre comment vous utilisez le site.</p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="font-bold text-white mb-2">Fonctionnels</h3>
                    <p className="text-sm text-slate-400">Mémorisent vos réglages (ex. volume sonore du lecteur).</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Gestion des cookies</h2>
                <p>Vous pouvez à tout moment configurer votre navigateur pour bloquer les cookies ou être alerté de leur installation. Notez que le blocage des cookies essentiels peut dégrader certaines fonctionnalités du site.</p>
              </section>
            </div>
          </article>
        );
      case Page.Disclaimer:
        return (
          <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black text-white mb-8 border-b border-orange-600 pb-4">Avis de non-responsabilité ⚠️</h1>
            <div className="space-y-8 text-slate-300">
              <section className="bg-orange-600/10 border border-orange-500/20 p-8 rounded-3xl">
                <h2 className="text-2xl font-bold text-orange-500 mb-4">Informations "telles quelles"</h2>
                <p className="text-lg leading-relaxed">
                  Le contenu de Radiotelevisionsismique.com est fourni à titre informatif uniquement. {officialName} ne donne aucune garantie, expresse ou implicite, quant à l'exactitude, la fiabilité ou l'actualité des informations diffusées.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Dommages directs ou indirects</h2>
                <p>En aucun cas, RTS ne sera responsable des pertes ou dommages, y compris, mais sans s'y limiter, les pertes indirectes ou consécutives, découlant de l'utilisation de ce site ou des informations qu'il contient.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Liens externes</h2>
                <p>Notre site contient des liens vers des sites tiers. Nous n'avons aucun contrôle sur la nature, le contenu et la disponibilité de ces sites. L'inclusion de tout lien n'implique pas nécessairement une recommandation ou l'approbation des opinions exprimées au sein de ces derniers.</p>
              </section>
            </div>
          </article>
        );
      case Page.LegalMentions:
        return (
          <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black text-white mb-8 border-b border-orange-600 pb-4">Mentions Légales 📢</h1>
            <div className="bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-800 shadow-2xl space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section>
                  <h2 className="text-orange-500 font-black text-xs uppercase tracking-widest mb-6">ÉDITEUR DU SITE</h2>
                  <div className="space-y-3 text-white">
                    <p className="font-bold text-xl">{officialName}</p>
                    <p className="text-slate-400">Directeur de la publication : John Mike René</p>
                    <p className="text-slate-400">Siège social : {officialAddress}</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-orange-500 font-black text-xs uppercase tracking-widest mb-6">CONTACT OFFICIEL</h2>
                  <div className="space-y-3 text-white font-bold">
                    <p>📧 Email : <a href={`mailto:${officialEmail}`} className="hover:text-orange-500 transition-colors">{officialEmail}</a></p>
                    <p>📞 Téléphone : +1 (904) 496-2016</p>
                    <p>🌐 Web : Radiotelevisionsismique.com</p>
                  </div>
                </section>
              </div>

              <section className="border-t border-slate-800 pt-8">
                <h2 className="text-orange-500 font-black text-xs uppercase tracking-widest mb-6">HÉBERGEMENT</h2>
                <p className="text-slate-400">Le site est hébergé par une infrastructure cloud sécurisée conforme aux normes internationales de disponibilité et de sécurité des données.</p>
              </section>

              <section className="border-t border-slate-800 pt-8">
                <h2 className="text-orange-500 font-black text-xs uppercase tracking-widest mb-6">DROIT APPLICABLE</h2>
                <p className="text-slate-400">Les présentes mentions légales sont soumises au droit en vigueur dans l'État de Floride, États-Unis, où est établi l'éditeur.</p>
              </section>
            </div>
          </article>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <section className="bg-slate-900 py-24 border-b border-slate-800">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => setCurrentPage(Page.Home)}
            className="mb-8 text-white flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full hover:bg-orange-600 transition-colors inline-flex group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-bold">Retour à l'accueil</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white">Légal & Transparence</h2>
              <p className="text-slate-500 mt-2 font-medium">Informations obligatoires et protection des utilisateurs</p>
            </div>
            
            <nav className="flex flex-wrap gap-2" aria-label="Menu de navigation légale">
              {[
                { label: 'Confidentialité', value: Page.Privacy },
                { label: 'Conditions', value: Page.Terms },
                { label: 'Cookies', value: Page.Cookies },
                { label: 'Avis', value: Page.Disclaimer },
                { label: 'Mentions', value: Page.LegalMentions },
              ].map((link) => (
                <button
                  key={link.value}
                  onClick={() => setCurrentPage(link.value)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                    type === link.value 
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' 
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-slate-900/40 p-8 md:p-16 rounded-[3rem] border border-slate-800 shadow-2xl">
            {renderContent()}
          </div>
          
          <div className="mt-12 text-center text-slate-600 text-xs">
            <p>© {new Date().getFullYear()} {officialName}. Tous droits réservés.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Legal;
