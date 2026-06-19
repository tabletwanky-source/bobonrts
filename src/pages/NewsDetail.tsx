import React, { useState, useEffect } from 'react';
import { MOCK_NEWS } from '../constants';
import { Page, Article } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Bookmark, ArrowLeft, Printer, Share2, Facebook, Twitter, PhoneCall } from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';
import SEO from '../components/SEO';

interface NewsDetailProps {
  newsId: string | null;
  setCurrentPage: (page: Page) => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ newsId, setCurrentPage }) => {
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
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
  }, [newsId, user?.uid]);

  const loadArticleAndTrack = async () => {
    if (!newsId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let loadedArticle: Article | null = null;

      // 1. Fetch from Firestore
      try {
        const artRef = doc(db, 'articles', newsId);
        const artSnap = await getDoc(artRef);
        
        if (artSnap.exists()) {
          const data = artSnap.data();
          loadedArticle = {
            id: artSnap.id,
            title: data.title,
            slug: data.slug || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            category: data.category || '',
            featuredImage: data.featuredImage || '',
            published: data.published ?? true,
            views: (data.views || 0) + 1,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            author: data.author || 'Administrateur'
          };

          // Increment article views
          updateDoc(artRef, { views: (data.views || 0) + 1 }).catch(() => {});
        }
      } catch (dbErr: any) {
        console.error("Could not fetch article from DB:", dbErr);
        setError(`Erreur Base de Données Firestore : ${dbErr?.message || String(dbErr)}`);
      }

      setArticle(loadedArticle);

      // 2. Access user document to configure Favorite toggle and log history
      if (user && loadedArticle) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const favorites: string[] = userSnap.data().favorites || [];
            setIsFavorited(favorites.includes(loadedArticle.id));

            // Log reading inside user's viewed history list
            await updateDoc(userRef, {
              viewedArticles: arrayUnion(loadedArticle.id)
            }).catch(() => {});
          }
        } catch (uErr) {
          console.warn("Could not check favorites / view history offline:", uErr);
        }
      }

    } catch (e) {
      console.error("Failed to load article detail:", e);
    } finally {
      setLoading(false);
    }
  };

  // Toggle bookmark / favoriting
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Impression et mise en page...</p>
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
            onClick={() => setCurrentPage(Page.News)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition shadow-lg"
          >
            Retour aux actualités
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-4">Article non trouvé</h2>
          <button 
            onClick={() => setCurrentPage(Page.News)}
            className="text-orange-500 font-bold underline uppercase tracking-wider text-xs"
          >
            Retour aux actualités
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {article && (
        <SEO 
          title={article.title}
          description={article.excerpt || article.content.substring(0, 160)}
          keywords={`radio haiti, ${article.category}, ${article.title}, actualités haïti, radio télévision sismique`}
          image={article.featuredImage || 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png'}
          type="article"
          slugPath={`/news/${article.slug || article.id}`}
          articleData={{
            title: article.title,
            description: article.excerpt || article.content.substring(0, 160),
            image: article.featuredImage || 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png',
            datePublished: article.createdAt,
            dateModified: article.updatedAt || article.createdAt,
            authorName: article.author || 'Administrateur',
            section: article.category || 'Actualités'
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

      <div className="relative h-[60vh] overflow-hidden">
        <img src={article.featuredImage} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        <div className="absolute bottom-12 left-0 w-full z-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
              <button 
                onClick={() => setCurrentPage(Page.News)}
                className="text-white flex items-center space-x-2 bg-slate-900/50 hover:bg-orange-600 backdrop-blur-md px-4 py-2.5 rounded-full transition inline-flex w-max shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Retour aux actualités</span>
              </button>

              <button 
                onClick={handleToggleFavorite}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-full backdrop-blur-md transition shadow-lg inline-flex w-max text-xs uppercase font-bold tracking-wider ${
                  isFavorited 
                    ? 'bg-orange-600 text-white hover:bg-orange-500' 
                    : 'bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
                id="article_fav_toggle_btn"
              >
                <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                <span>{isFavorited ? 'Sauvegardé!' : 'Sauvegarder l\'article'}</span>
              </button>
            </div>

            <div className="max-w-4xl">
              <span className="bg-orange-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">
                {article.category} • {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'Aujourd\'hui'}
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase font-sans">
                {article.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 p-8 md:p-12 rounded-[2rem] border border-slate-800 shadow-2xl backdrop-blur-md">
            <p className="text-lg md:text-xl font-semibold text-orange-400 mb-8 leading-relaxed italic border-l-4 border-orange-500 pl-4">
              {article.excerpt}
            </p>
            <div className="prose prose-invert prose-orange max-w-none text-slate-300 text-base md:text-lg leading-relaxed space-y-6 whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {/* Social share actions */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-slate-900 pt-8 gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Partager :</span>
              <div className="flex space-x-2">
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 transition"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-400 transition"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
            <button 
              onClick={() => window.print()}
              className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer l'article</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
