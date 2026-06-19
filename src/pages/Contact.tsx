
import React, { useState } from 'react';
import SEO from '../components/SEO';

const Contact: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('SENDING');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setStatus('SUCCESS');
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('ERROR');
        setErrorMessage(data.message || "Une erreur est survenue lors de l'envoi.");
      }
    } catch (error) {
      setStatus('ERROR');
      setErrorMessage("Impossible de contacter le serveur. Veuillez vérifier votre connexion.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <SEO 
        title="Contactez-nous | Publicité & Devis"
        description="Contactez l'équipe de Radio Télévision Sismique (RTS). Formulaire de contact pour suggestions, propositions musicales, marketing publicité, dédicaces."
        keywords="contact rts, deplacement radio haiti, publicité rts fm, service client, adresse radio haiti, jacksonville contact"
        slugPath="/contact"
      />
      <section className="bg-slate-900 py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">Contactez-nous</h1>
          <p className="text-xl text-orange-500 font-bold uppercase tracking-[0.2em]">RTS est à votre écoute</p>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            {/* Info */}
            <div>
              <h2 className="text-4xl font-black text-white mb-12">Restons en contact</h2>
              <div className="space-y-12">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-slate-800">📍</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Notre Bureau</h3>
                    <p className="text-slate-400">Jacksonville, Florida, USA<br/>ZIP: 32068</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-slate-800">📞</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Téléphone / WhatsApp</h3>
                    <p className="text-slate-400 font-bold text-white">+1 (904) 496 - 2016</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-slate-800">✉️</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                    <p className="text-slate-400">contact@radiotelevisionsismique.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 p-8 bg-orange-600 rounded-[2rem] text-white">
                 <h3 className="text-2xl font-black mb-6 leading-tight">Suivez la vibration sur les réseaux sociaux</h3>
                 <div className="flex flex-wrap gap-4">
                    <a href="https://www.facebook.com/share/1Ey9LSGZZH/" target="_blank" className="w-14 h-14 bg-white/20 rounded-full hover:bg-white/40 transition-all flex items-center justify-center font-bold">FB</a>
                    <a href="https://www.instagram.com/radiotelesismique" target="_blank" className="w-14 h-14 bg-white/20 rounded-full hover:bg-white/40 transition-all flex items-center justify-center font-bold">IG</a>
                    <a href="https://www.tiktok.com/@radio.tele.sismiq" target="_blank" className="w-14 h-14 bg-white/20 rounded-full hover:bg-white/40 transition-all flex items-center justify-center font-bold">TK</a>
                    <a href="https://youtube.com/@radiotelesismique-d6d" target="_blank" className="w-14 h-14 bg-white/20 rounded-full hover:bg-white/40 transition-all flex items-center justify-center font-bold">YT</a>
                    <a href="https://x.com/RadioSismique" target="_blank" className="w-14 h-14 bg-white/20 rounded-full hover:bg-white/40 transition-all flex items-center justify-center font-bold">X</a>
                 </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
              {status === 'SUCCESS' && (
                <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6">✓</div>
                  <h3 className="text-3xl font-black text-white mb-4">Message envoyé !</h3>
                  <p className="text-slate-400 mb-8">Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.</p>
                  <button 
                    onClick={() => setStatus('IDLE')}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-black px-8 py-3 rounded-full transition-all"
                  >
                    ENVOYER UN AUTRE MESSAGE
                  </button>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <input type="hidden" name="access_key" value="dd7060a2-ed89-41dd-8262-44852a4ddeab" />
                <input type="hidden" name="from_name" value="Formulaire de contact – Radio Sismique FM" />
                <input type="hidden" name="subject" value="Nouveau message – Radio Sismique FM" />
                <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Nom Complet <span className="text-orange-500">*</span></label>
                    <input 
                      required 
                      name="name"
                      type="text" 
                      placeholder="Jean Dupont"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Adresse E-mail <span className="text-orange-500">*</span></label>
                    <input 
                      required 
                      name="email"
                      type="email" 
                      placeholder="jean@exemple.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Numéro de Téléphone</label>
                    <input 
                      name="phone"
                      type="tel" 
                      placeholder="+1 (000) 000-0000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Sujet <span className="text-orange-500">*</span></label>
                    <select 
                      required
                      name="interest"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="Information Générale">Information Générale</option>
                      <option value="Publicité / Marketing Digital">Publicité / Marketing Digital</option>
                      <option value="Partenariat">Partenariat</option>
                      <option value="Dédicace / Message Radio">Dédicace / Message Radio</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Message <span className="text-orange-500">*</span></label>
                  <textarea 
                    required
                    name="message"
                    rows={6} 
                    placeholder="Votre message ici..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  ></textarea>
                </div>

                {status === 'ERROR' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
                    {errorMessage}
                  </div>
                )}

                <button 
                  disabled={status === 'SENDING'}
                  type="submit"
                  className={`w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center space-x-3 ${status === 'SENDING' ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {status === 'SENDING' ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>ENVOI EN COURS...</span>
                    </>
                  ) : (
                    <span>ENVOYER LE MESSAGE</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
