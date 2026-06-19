import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Page } from '../types';
import Toast, { ToastType } from '../components/Toast';
import { Radio, Mail, Lock, User, UserPlus, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';

interface RegisterProps {
  setCurrentPage: (page: Page) => void;
}

const ADMIN_EMAILS = [
  "renejohnmike33@gmail.com",
  "thefunniest2020@gmail.com",
  "wanky7713@gmail.com"
];

const Register: React.FC<RegisterProps> = ({ setCurrentPage }) => {
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  const handleRedirect = (userEmail: string) => {
    const isUserAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase().trim());
    if (isUserAdmin) {
      showToast('Compte créé ! Accès Administrateur...', 'success');
      setTimeout(() => {
        setCurrentPage(Page.AdminDashboard);
      }, 1200);
    } else {
      showToast('Bienvenue ! Redirection vers votre espace auditeur...', 'success');
      setTimeout(() => {
        setCurrentPage(Page.Dashboard);
      }, 1200);
    }
  };

  const getAuthErrorMessage = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';
    
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'ce domaine';
      return `Ce domaine (${currentHost}) n'est pas autorisé pour l'authentification Firebase. Veuillez configurer la console Firebase (onglet Authentication > Settings > Authorized domains) en ajoutant "${currentHost}" à la liste des domaines autorisés pour permettre la création de compte.`;
    }
    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return "Cette méthode de création de compte (Adresse e-mail/mot de passe ou Google) n'est pas encore activée dans la console Firebase. Rendez-vous dans la console du projet, onglet Authentication > Sign-in method, et activez 'Adresse e-mail/mot de passe' et 'Google'.";
    }
    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      return "Cette adresse e-mail est déjà associée à un compte existant.";
    }
    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return "L'adresse e-mail saisie n'est pas valide.";
    }
    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      return "Le mot de passe choisi est trop faible. Veuillez choisir un mot de passe d'au moins 6 caractères.";
    }
    if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
      return "Le volet de connexion de Google a été bloqué par votre navigateur. Veuillez autoriser les fenêtres pop-up.";
    }
    
    return msg || "Une erreur est survenue lors de la création du compte. Veuillez réessayer.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      showToast('Veuillez remplir tous les champs.', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('Veuillez accepter les conditions d\'utilisation.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      handleRedirect(email);
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        console.warn("Inscription impossible : domaine non autorisé", err);
      } else {
        console.error(err);
      }
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!acceptedTerms) {
      showToast('Veuillez d\'abord accepter les conditions d\'utilisation.', 'error');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle();
      
      const { auth } = await import("../lib/firebase");
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        handleRedirect(currentUser.email);
      } else {
        showToast('Inscription avec Google réussie !', 'success');
        setTimeout(() => {
          setCurrentPage(Page.Dashboard);
        }, 1200);
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        console.warn("Inscription Google impossible : domaine non autorisé", err);
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
      id="register_page_container"
    >
      {/* Dark overlay for absolute contrast */}
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-none z-0 pointer-events-none" />

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage('')} 
        />
      )}

      {/* Centered Glassmorphism Card */}
      <div className="w-full max-w-md bg-black/65 border border-slate-800/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md relative z-10 animate-fade-in" id="register_glass_card">
        
        {/* Back Button */}
        <button 
          onClick={() => setCurrentPage(Page.Home)}
          className="flex items-center text-xs font-extrabold text-slate-400 hover:text-orange-400 mb-6 transition-colors gap-1.5 uppercase tracking-widest"
          id="register_back_home_btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>

        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 bg-gradient-to-r from-orange-600/30 to-amber-500/10 border border-orange-500/30 rounded-2xl mb-4 shadow-[0_4px_20px_rgba(249,115,22,0.15)]">
            <Radio className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase font-sans">Créer un Compte</h2>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Sismique FM Programme Auditeur</span>
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
            Rejoignez la communauté Sismique, sauvegardez vos temps d'écoute en direct et convertissez-les en véritables récompenses.
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2 font-sans">Nom Complet</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Jean Baptiste"
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/85 transition-all font-sans"
                disabled={loading}
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2 font-sans">Mot de passe</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full pl-10 pr-11 py-3 bg-black/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/85 transition-all font-sans"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-400 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2 font-sans">Confirmer le mot de passe</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="w-full pl-10 pr-11 py-3 bg-black/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/85 transition-all font-sans"
                disabled={loading}
              />
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-start gap-2.5 pt-1.5 pb-2">
            <input
              type="checkbox"
              id="acceptedTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-800 text-orange-500 focus:ring-0 focus:ring-offset-0 bg-black/40 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="acceptedTerms" className="text-xs text-slate-400 leading-normal select-none cursor-pointer">
              J'accepte les <span className="text-orange-400 font-bold hover:underline">Conditions d'Utilisation</span> & la <span className="text-orange-400 font-bold hover:underline">Politique de Confidentialité</span> de Radio Televison Sismique.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 active:scale-[0.98] text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-lg shadow-orange-600/15 hover:shadow-orange-500/25 transition-all"
            id="register_submit_btn"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-white" />
                <span>Créer mon compte</span>
              </>
            )}
          </button>
        </form>

        {/* GOOGLE SIGN UP BUTTON */}
        <div className="mt-5 animate-fade-in">
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-800/80 w-full absolute z-0" />
            <span className="bg-[#0b0f19] px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10">Ou</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition transform active:scale-95 shrink-0 hover:shadow-lg"
            id="google_signup_btn"
          >
            <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.56-1.56 4.545-6.887 4.545-4.61 0-8.36-3.815-8.36-8.52s3.75-8.52 8.36-8.52c2.625 0 4.385 1.11 5.39 2.075l3.27-3.145C18.8 1.83 15.77 0 12.24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.915 0 11.52-4.815 11.52-11.715 0-.795-.085-1.395-.195-2H12.24z" />
            </svg>
            <span>S'inscrire avec Google</span>
          </button>
        </div>

        {/* Switch Options */}
        <div className="mt-5 text-center pt-4 border-t border-slate-800/60 font-sans">
          <p className="text-xs text-slate-400">
            Déjà inscrit ?{' '}
            <button
              onClick={() => setCurrentPage(Page.Login)}
              className="text-orange-400 hover:text-orange-300 font-extrabold transition-colors tracking-wide ml-0.5 font-sans"
              disabled={loading}
            >
              Identifiez-vous
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
