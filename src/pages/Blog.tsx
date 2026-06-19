import React, { useState, useEffect } from 'react';
import { Page, Article } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { MOCK_NEWS } from '../constants';
import { Search, Eye, Calendar, User, ChevronLeft, ChevronRight, TrendingUp, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';

interface BlogProps {
  initialCategorySlug: string | null;
  onSelectArticle: (slug: string) => void;
  onSelectCategory: (slug: string | null) => void;
}

const Blog: React.FC<BlogProps> = ({ 
  initialCategorySlug, 
  onSelectArticle, 
  onSelectCategory 
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch from Firestore
      const q = query(
        collection(db, 'articles'),
        where('published', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnap = await getDocs(q);
      const dbArts: Article[] = [];
      const loadedCategories = new Set<string>();

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
        if (data.category) {
          loadedCategories.add(data.category);
        }
      });

      setArticles(dbArts);
      setCategories(Array.from(loadedCategories));
    } catch (e: any) {
      console.error("error fetching blog articles feed from Firestore:", e);
      setError(`Erreur Base de Données Firestore : ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to slugify categories
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Filter current selection
  const filteredArticles = articles.filter(art => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      art.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Category check: either initialCategorySlug matches the slugified category name, or 'all'
    if (!initialCategorySlug) return matchesSearch;
    const itemCatSlug = slugify(art.category);
    return itemCatSlug === initialCategorySlug && matchesSearch;
  });

  // Reset pagination on search or category filter change
  useEffect(() => {
    setCurrentPageNum(1);
  }, [searchTerm, initialCategorySlug]);

  // Featured Article: the newest article that matches search constraints
  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  // Recent articles excluding the featured one
  const recentArticles = featuredArticle ? filteredArticles.slice(1) : filteredArticles;

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(recentArticles.length / itemsPerPage));
  const startIndex = (currentPageNum - 1) * itemsPerPage;
  const paginatedArticles = recentArticles.slice(startIndex, startIndex + itemsPerPage);

  // Popular Articles (highest views in whole articles list)
  const popularArticles = [...articles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Chargement du Blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEO 
        title="Blog & Analyses"
        description="Parcourez le blog de Radio Télévision Sismique. Retrouvez des analyses, débats politiques, billets culturels et actualités musicales en temps réel."
        keywords="blog haiti, actualités haiti, rts blog, radio télévision sismique, articles opinion"
        slugPath="/blog"
      />
      
      {/* Search and Category Hero Bar Section */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">Le Blog Sismique</h1>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mt-1">
                L'actualité, la culture, et les coulisses de la station en direct
              </p>
            </div>

            {/* Search Input block */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Rechercher des articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Categories slide selection bar */}
          <div className="flex flex-wrap gap-2 mt-8 border-t border-slate-800/60 pt-4">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${
                !initialCategorySlug
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => {
              const catSlug = slugify(cat);
              const isActive = initialCategorySlug === catSlug;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(catSlug)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Blog Container Layout */}
      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400 text-sm flex flex-col gap-2">
            <span className="font-extrabold text-xs uppercase tracking-widest text-red-500">Erreur de Connexion Base de Données</span>
            <p className="font-mono text-xs">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left / Center Body Column */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. FEATURED ARTICLE BANNER */}
            {currentPageNum === 1 && featuredArticle && !searchTerm && (
              <div 
                className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer shadow-xl transition-all hover:scale-[1.01] hover:border-orange-500/30"
                onClick={() => onSelectArticle(featuredArticle.slug)}
              >
                <div className="aspect-[16/9] md:aspect-[21/9] relative w-full overflow-hidden">
                  <img 
                    src={featuredArticle.featuredImage || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"} 
                    alt={featuredArticle.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  
                  {/* Category floating pill tag */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-orange-600 text-white text-[10px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-widest block shadow-md">
                      {featuredArticle.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      {new Date(featuredArticle.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      {featuredArticle.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-orange-500" />
                      {featuredArticle.views} vues
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black text-white uppercase group-hover:text-orange-400 transition-colors">
                    {featuredArticle.title}
                  </h2>
                  
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-3xl">
                    {featuredArticle.excerpt}
                  </p>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      <span>Lire l'article complet</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Empty view check */}
            {filteredArticles.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <p className="text-slate-400 text-sm">Aucun article trouvé pour cette recherche ou catégorie.</p>
                <button
                  onClick={() => { setSearchTerm(''); onSelectCategory(null); }}
                  className="mt-4 bg-orange-600 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition"
                >
                  Tout voir
                </button>
              </div>
            )}

            {/* 2. RECENT ARTICLES GRID */}
            {paginatedArticles.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-900">
                  {currentPageNum === 1 && !searchTerm ? 'Récemment Publiés' : 'Articles correspondants'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paginatedArticles.map((art) => (
                    <article 
                      key={art.id}
                      className="group cursor-pointer bg-slate-900/45 border border-slate-900 hover:border-slate-850 rounded-xl overflow-hidden transition-all flex flex-col h-full hover:scale-[1.01]"
                      onClick={() => onSelectArticle(art.slug)}
                    >
                      <div className="aspect-[16/10] relative overflow-hidden bg-slate-950">
                        <img 
                          src={art.featuredImage || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"} 
                          alt={art.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-slate-950/80 backdrop-blur-md text-orange-400 text-[9px] uppercase font-black px-2.5 py-1 rounded-full border border-orange-500/20">
                            {art.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(art.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {art.views}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-white uppercase group-hover:text-orange-400 transition-colors line-clamp-2">
                          {art.title}
                        </h4>

                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                          {art.excerpt}
                        </p>

                        <div className="pt-2 flex items-center text-orange-400 text-xs font-black uppercase tracking-wider group-hover:text-orange-300">
                          <span>Détails</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-900 pt-8" id="blog_pagination">
                <button
                  disabled={currentPageNum === 1}
                  onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold uppercase transition bg-slate-900 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPageNum(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-extrabold flex items-center justify-center transition border ${
                        currentPageNum === pageNum
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-500/10'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPageNum === totalPages}
                  onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold uppercase transition bg-slate-900 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* 4. POPULAR ARTICLES CARD */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-800/60">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Articles Populaires</h3>
              </div>

              <div className="space-y-4">
                {popularArticles.map((art, index) => (
                  <div 
                    key={art.id}
                    className="flex gap-3 group cursor-pointer pb-4 border-b border-slate-900 last:border-0 last:pb-0"
                    onClick={() => onSelectArticle(art.slug)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden flex-shrink-0">
                      <img 
                        src={art.featuredImage || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-200 uppercase group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        {new Date(art.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })} • {art.views} vues
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile App Download Promo */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl"></div>
              <span className="bg-orange-600/10 text-orange-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-orange-500/15 mb-3 inline-block">
                AUDIO NOW / DIRECT 📱
              </span>
              <h4 className="text-sm font-black text-white uppercase leading-snug">La voix qui fait vibrer votre cœur !</h4>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Téléchargez l'application officielle de Radio Télévision Sismique sur le Google Play Store pour nous écouter n'importe où sans interruption.
              </p>
              <div className="mt-4">
                <a 
                  href="https://play.google.com/store/apps/details?id=radio.televisionsismique6" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block"
                >
                  <img 
                    src="https://i.postimg.cc/Y26zxTK9/badge-android-store-40px-37e7fb1d2aea.png" 
                    alt="Directement sur Google Play" 
                    className="h-9 w-auto shadow-xl"
                  />
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default Blog;
