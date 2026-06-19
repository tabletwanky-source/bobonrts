import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Page } from '../types';
import Toast, { ToastType } from '../components/Toast';
import { Radio, Mail, KeyRound, ArrowLeft, Sparkles } from 'lucide-react';

interface ForgotPasswordProps {
  setCurrentPage: (page: Page) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setCurrentPage }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  const getAuthErrorMessage = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';
    
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'ce domaine';
      return `Ce domaine (${currentHost}) n'est pas autorisé pour l'authentification Firebase. Veuillez configurer la console Firebase (onglet Authentication > Settings > Authorized domains) en ajoutant "${currentHost}" à la liste des domaines autorisés.`;
    }
    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return "Cette fonctionnalité n'est pas encore activée dans la console Firebase. Rendez-vous dans la console du projet, onglet Authentication > Sign-in method, et activez 'Adresse e-mail/mot de passe'.";
    }
    if (code === 'auth/user-not-found' || msg.includes('user-not-found')) {
      return "Aucun compte correspondant à cette adresse e-mail n'a été trouvé.";
    }
    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return "L'adresse e-mail saisie n'est pas valide.";
    }
    
    return msg || "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Veuillez saisir votre adresse email.', 'error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      showToast('Un email de réinitialisation du mot de passe a été envoyé.', 'success');
      setTimeout(() => {
        setCurrentPage(Page.Login);
      }, 3000);
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        console.warn("Réinitialisation mot de passe impossible : domaine non autorisé", err);
      } else {
        console.error(err);
      }
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-16 relative overflow-hidden font-sans"
      style={{ backgroundImage: "url('https://i.postimg.cc/vmK3g23s/ttrtss.jpg')" }}
      id="forgotpassword_page_container"
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-none z-0 pointer-events-none" />

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage('')} 
        />
      )}

      {/* Centered Glassmorphism Card */}
      <div className="w-full max-w-md bg-black/65 border border-slate-800/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md relative z-10 animate-fade-in" id="forgotpassword_glass_card">
        
        {/* Back Button */}
        <button 
          onClick={() => setCurrentPage(Page.Login)}
          className="flex items-center text-xs font-extrabold text-slate-400 hover:text-orange-400 mb-6 transition-colors gap-1.5 uppercase tracking-widest"
          id="forgotpass_back_login_btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la connexion</span>
        </button>

        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-gradient-to-r from-orange-600/30 to-amber-500/10 border border-orange-500/30 rounded-2xl mb-4 shadow-[0_4px_20px_rgba(249,115,22,0.15)]">
            <Radio className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase font-sans font-sans">Réinitialisation</h2>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Sécurité de votre Compte</span>
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed font-sans">
            Saisissez l'adresse email de votre compte. Nous vous transmettrons automatiquement un lien sécurisé pour redéfinir votre mot de passe d'auditeur.
          </p>
        </div>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2 font-sans">Adresse Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/85 transition-all font-sans"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 active:scale-[0.98] text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-lg shadow-orange-600/15 hover:shadow-orange-500/25 transition-all mt-4"
            id="forgotpass_submit_btn"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-white" />
                <span>Envoyer Instructions</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ForgotPassword;
