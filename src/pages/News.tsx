import React, { useState, useEffect } from 'react';
import { MOCK_NEWS } from '../constants';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Article } from '../types';
import { Search, ListFilter } from 'lucide-react';
import SEO from '../components/SEO';

interface NewsProps {
  onSelectNews: (id: string) => void;
}

const News: React.FC<NewsProps> = ({ onSelectNews }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          slug: data.slug || '',
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
      console.error("error fetching news articles feed from Firestore:", e);
      setError(`Erreur Base de Données Firestore : ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter combined set
  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' ? true : art.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO 
        title="Actualités & Infos en Direct"
        description="Suivez l'actualité en Haïti et à l'échelle internationale avec Radio Télévision Sismique. Nouvelles de dernière minute, analyses détaillées et rapports officiels."
        keywords="actualites haïti, informations en direct, radio televisión sismique, rapports, nouvelles haiti fm"
        slugPath="/news"
      />
      {/* Editorial Header Banner */}
      <section className="bg-slate-900 py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tight">Kiosque d'actualités</h1>
          <p className="text-xs md:text-sm text-orange-500 font-extrabold uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full inline-block">
            Restez branchés sur l'actualité Sismique FM
          </p>
        </div>
      </section>

      {/* Control filter panels */}
      <div className="container mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              placeholder="Rechercher des articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Categories select tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                selectedCategory === 'all' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  selectedCategory === cat 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="py-16">
        <div className="container mx-auto px-4">
          
          {error && (
            <div className="mb-8 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400 text-sm flex flex-col gap-2">
              <span className="font-extrabold text-xs uppercase tracking-widest text-red-500">Erreur de Connexion Base de Données</span>
              <p className="font-mono text-xs">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Récupération des dépêches...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-24 text-center text-slate-500 italic">Aucune actualité ne correspond à votre recherche.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Featured article highlighted on top */}
              {filteredArticles.length > 0 && selectedCategory === 'all' && searchTerm === '' && (
                <div className="lg:col-span-3 mb-4 group cursor-pointer" onClick={() => onSelectNews(filteredArticles[0].id)}>
                  <div className="relative h-[55vh] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-900">
                    <img src={filteredArticles[0].featuredImage} alt="Featured" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000s]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                    <div className="absolute bottom-10 left-6 sm:left-10 right-6 max-w-3xl z-10">
                      <span className="bg-orange-600 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">
                        À la une • {filteredArticles[0].category}
                      </span>
                      <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight group-hover:text-orange-400 transition-colors uppercase">
                        {filteredArticles[0].title}
                      </h2>
                      <p className="text-slate-300 text-sm md:text-base line-clamp-2 max-w-2xl mb-6">
                        {filteredArticles[0].excerpt}
                      </p>
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <span>Consulter l'article</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* List grid of feeds */}
              {(selectedCategory !== 'all' || searchTerm !== '' ? filteredArticles : filteredArticles.slice(1)).map((item) => (
                <div key={item.id} className="group cursor-pointer flex flex-col h-full bg-slate-900/30 hover:bg-slate-900/60 p-4 border border-slate-900 hover:border-slate-800 rounded-3xl transition duration-500" onClick={() => onSelectNews(item.id)}>
                  <div className="relative h-56 rounded-2xl overflow-hidden mb-5 shadow-xl shrink-0">
                    <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-orange-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-orange-500/10 rounded-md border border-orange-500/10">{item.category}</span>
                      <h3 className="text-lg font-bold text-white mt-3.5 mb-2 leading-snug group-hover:text-orange-400 transition-colors uppercase font-sans line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">
                        {item.excerpt}
                      </p>
                    </div>
                    <span className="text-orange-500 hover:text-orange-400 font-bold flex items-center space-x-1.5 text-xs uppercase tracking-wider self-start">
                      <span>Continuer la lecture</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </div>
              ))}

            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default News;
