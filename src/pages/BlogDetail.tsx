import React, { useState, useEffect } from 'react';
import { Page, Article } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MOCK_NEWS } from '../constants';
import { Bookmark, ArrowLeft, Calendar, User, Eye, Share2, Facebook, Twitter, PhoneCall, Link2, Copy, BookOpen, ChevronRight } from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';
import SEO from '../components/SEO';

interface BlogDetailProps {
  articleSlug: string | null;
  onBackToBlog: () => void;
  onNavigateToBlogArticle: (slug: string) => void;
}

const BlogDetail: React.FC<BlogDetailProps> = ({ 
  articleSlug, 
  onBackToBlog,
  onNavigateToBlogArticle
}) => {
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
  };

  useEffect(() => {
    loadArticleAndTrack();
  }, [articleSlug, user?.uid]);

  const loadArticleAndTrack = async () => {
    if (!articleSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch ALL articles to resolve slugs and find related articles
      const dbArts: Article[] = [];
      try {
        const q = query(
          collection(db, 'articles'),
          where('published', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const querySnap = await getDocs(q);

        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          dbArts.push({
            id: docSnap.id,
            title: data.title,
            slug: data.slug || docSnap.id,
            content: data.content || '',
            excerpt: data.excerpt || '',
            category: data.category || '',
            featuredImage: data.featuredImage || '',
            published: data.published ?? true,
            views: data.views || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            author: data.author || 'Administrateur'
          });
        });
      } catch (dbErr: any) {
        console.error("Could not fetch blog list from Firestore:", dbErr);
        setError(`Erreur Base de Données Firestore : ${dbErr?.message || String(dbErr)}`);
      }

      setAllArticles(dbArts);

      // Find the specific article matching 'articleSlug' via slug OR id
      const targetSlug = articleSlug.toLowerCase();
      let foundArticle = dbArts.find(a => a.slug.toLowerCase() === targetSlug || a.id.toLowerCase() === targetSlug);

      if (foundArticle) {
        setArticle(foundArticle);

        // If it's a real Firestore article, increment views
        if (foundArticle.id) {
          const artRef = doc(db, 'articles', foundArticle.id);
          updateDoc(artRef, { views: foundArticle.views + 1 }).catch(() => {});
          foundArticle.views += 1;
        }

        // Config favorite toggles
        if (user) {
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const favorites: string[] = userSnap.data().favorites || [];
              setIsFavorited(favorites.includes(foundArticle.id));

              // Log history
              await updateDoc(userRef, {
                viewedArticles: arrayUnion(foundArticle.id)
              }).catch(() => {});
            }
          } catch (uErr) {
            console.warn("Could not check favorites / view history offline:", uErr);
          }
        }
      } else {
        setArticle(null);
      }
    } catch (e) {
      console.error("Failed to load blog article details:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      showToast("Veuillez vous connecter pour sauvegarder cet article dans votre espace.", "info");
      return;
    }
    if (!article) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      if (isFavorited) {
        await updateDoc(userRef, {
          favorites: arrayRemove(article.id)
        });
        setIsFavorited(false);
        showToast("Article retiré de vos favoris.", "success");
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(article.id)
        });
        setIsFavorited(true);
        showToast("Article sauvegardé dans vos favoris !", "success");
      }
    } catch (err: any) {
      showToast("Échec de la mise en favori.", "error");
    }
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast("Lien copié dans le presse-papiers !", "success"))
      .catch((err) => showToast("Impossible de copier le lien.", "error"));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Impression et mise en page de l'article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-4 text-center">
          <span className="font-extrabold text-xs uppercase tracking-widest text-red-500 block mb-2">Erreur de Connexion Base de Données</span>
          <p className="font-mono text-xs text-red-400 mb-6">{error}</p>
          <button 
            onClick={onBackToBlog}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition shadow-lg "
          >
            Retour au Blog
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-4">
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Article non trouvé</h2>
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">Ce billet n'existe pas ou a été retiré par l'administrateur.</p>
          <button 
            onClick={onBackToBlog}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition shadow-lg shadow-orange-500/10"
          >
            Retour au Blog
          </button>
        </div>
      </div>
    );
  }

  // Related Articles: same category, excluding active article, slice(0, 3)
  const relatedArticles = allArticles
    .filter(a => a.category.toLowerCase() === article.category.toLowerCase() && a.id !== article.id)
    .slice(0, 3);

  const shareUrl = `https://radiotelevisionsismique.com/blog/${article.slug}`;

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {article && (
        <SEO 
          title={article.title}
          description={article.excerpt || article.content.substring(0, 160)}
          keywords={`radio haiti, ${article.category}, ${article.title}, radio télévision sismique`}
          image={article.featuredImage || 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png'}
          type="article"
          slugPath={`/blog/${article.slug}`}
          articleData={{
            title: article.title,
            description: article.excerpt || article.content.substring(0, 160),
            image: article.featuredImage || 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png',
            datePublished: article.createdAt,
            dateModified: article.updatedAt || article.createdAt,
            authorName: article.author || 'RTS Rédacteur',
            section: article.category
          }}
        />
      )}
      
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage('')} 
        />
      )}

      {/* Hero Header Banner */}
      <div className="relative h-[55vh] md:h-[65vh] overflow-hidden">
        <img 
          src={article.featuredImage || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"} 
          alt={article.title} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20"></div>
        
        {/* Upper content and control row */}
        <div className="absolute inset-0 flex flex-col justify-between py-8">
          <div className="container mx-auto px-4 flex items-center justify-between z-10">
            <button 
              onClick={onBackToBlog}
              className="text-white flex items-center space-x-2 bg-slate-900/60 hover:bg-orange-600 hover:text-white border border-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-full transition shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">Retour</span>
            </button>

            <button 
              onClick={handleToggleFavorite}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-full border backdrop-blur-md transition shadow-lg text-xs uppercase font-black tracking-wider ${
                isFavorited 
                  ? 'bg-orange-600 text-white border-orange-500 shadow-orange-500/10 hover:bg-orange-500' 
                  : 'bg-slate-900/60 text-slate-300 border-slate-800/80 hover:text-white hover:bg-slate-805'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{isFavorited ? 'Sauvegardé' : 'Ajouter aux favoris'}</span>
            </button>
          </div>

          <div className="container mx-auto px-4 z-10">
            <div className="max-w-4xl space-y-4">
              <span className="bg-orange-600 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-block shadow-md">
                {article.category}
              </span>
              <h1 className="text-2xl sm:text-3.5xl md:text-5xl font-black text-white leading-tight uppercase font-sans">
                {article.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Grid Layout */}
      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main content body (left) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900 border border-slate-800/80 rounded-[2rem] p-6 sm:p-10 shadow-2xl backdrop-blur-md">
              
              {/* Meta Info Header inside the card */}
              <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-slate-800/60 mb-8 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <span>Auteur: <strong className="text-white">{article.author}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Publié le: <strong className="text-white">{new Date(article.createdAt).toLocaleDateString()}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-500" />
                  <span>Lecture: <strong className="text-white">{article.views} vues</strong></span>
                </div>
              </div>

              {/* Excerpt paragraph */}
              <p className="text-base md:text-lg font-semibold text-orange-400 mb-8 leading-relaxed italic border-l-4 border-orange-500 pl-4 bg-slate-950/20 py-3 rounded-r-xl">
                {article.excerpt}
              </p>

              {/* Rich Body Content */}
              <div className="prose prose-invert prose-orange max-w-none text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed space-y-6 whitespace-pre-line">
                {article.content}
              </div>

              {/* Share Social Block row */}
              <div className="mt-12 pt-6 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-slate-500 font-extrabold text-xs uppercase tracking-wider">Partager l'article :</span>
                  <div className="flex space-x-2">
                    {/* Facebook Share */}
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-9 h-9 bg-slate-950 border border-slate-850 hover:border-orange-500/20 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                    
                    {/* X Share */}
                    <a 
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-9 h-9 bg-slate-950 border border-slate-850 hover:border-orange-500/20 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-sky-500 transition"
                      title="X (Twitter)"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>

                    {/* WhatsApp share */}
                    <a 
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' - ' + shareUrl)}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-9 h-9 bg-slate-950 border border-slate-850 hover:border-orange-500/20 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-green-600 transition"
                      title="WhatsApp"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>

                    {/* Copy general link */}
                    <button 
                      onClick={handleCopyLink}
                      className="w-9 h-9 bg-slate-950 border border-slate-850 hover:border-orange-500/20 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-orange-600 transition"
                      title="Copier le lien"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={onBackToBlog}
                  className="text-slate-400 hover:text-orange-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 transition"
                >
                  <span>Tous les articles</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* RELATED ARTICLES ROW (Req 7) */}
            {relatedArticles.length > 0 && (
              <div className="space-y-6 pt-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>Articles Similaires Recommandés</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((relArt) => (
                    <div 
                      key={relArt.id}
                      onClick={() => onNavigateToBlogArticle(relArt.slug)}
                      className="group cursor-pointer bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl overflow-hidden transition-all flex flex-col h-full hover:scale-[1.01]"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden bg-slate-950 h-32">
                        <img 
                          src={relArt.featuredImage || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"} 
                          alt={relArt.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-grow space-y-2">
                        <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{relArt.category}</span>
                        <h4 className="text-xs font-black text-slate-200 uppercase group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                          {relArt.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right quick info widget bar (right) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">À propos de la station</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Radio Télévision Sismique (RTS) diffuse de la musique saine, des analyses, de l'éducation, et de l'information juste pour la diaspora haïtienne et internationale.
              </p>
              <div className="pt-2 border-t border-slate-800/60 text-center">
                <button
                  onClick={onBackToBlog}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-orange-400 hover:text-white border border-slate-850 hover:border-orange-500/25 px-4 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition"
                >
                  Fouiller notre Blog
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default BlogDetail;
