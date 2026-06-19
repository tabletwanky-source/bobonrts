
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import RadioPlayer from './components/RadioPlayer';
import WhatsAppButton from './components/WhatsAppButton';
import OneTimePopup from './components/OneTimePopup';
import WelcomeAnnouncementPopup from './components/WelcomeAnnouncementPopup';
import GamificationNotifyPopup from './components/GamificationNotifyPopup';
import Home from './pages/Home';
import About from './pages/About';
import Emissions from './pages/Emissions';
import Live from './pages/Live';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import FirebaseDiagnostics from './pages/FirebaseDiagnostics';
import Programmes from './pages/Programmes';
import EspaceCitoyen from './pages/EspaceCitoyen';
import Sports from './pages/Sports';
import SportsDiagnostics from './pages/SportsDiagnostics';
import BreakingNewsTicker from './components/BreakingNewsTicker';
import { Page } from './types';
import { updateSportsConfig } from './config/sportsConfig';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  
  // Blog-specific states
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [selectedBlogCategorySlug, setSelectedBlogCategorySlug] = useState<string | null>(null);

  // Initialize and apply centralized configuration from sports settings
  useEffect(() => {
    const fetchAndApplySportsConfig = async () => {
      try {
        const res = await fetch('/api/sports/config');
        if (res.ok) {
          const config = await res.json();
          updateSportsConfig({
            enabled: config.enabled !== undefined ? config.enabled : true,
            cacheMinutes: config.refreshInterval ? Math.round(config.refreshInterval / 60) : 15,
            provider: config.provider || "football-data.org",
            apiBaseUrl: config.apiBaseUrl || "https://api.football-data.org/v4",
            apiKey: config.apiKey || (import.meta as any).env.VITE_FOOTBALL_API_KEY
          });
        }
      } catch (err) {
        console.error("Failed to load global sports config on boot:", err);
      }
    };
    fetchAndApplySportsConfig();
  }, []);

  // Client-side 301 SEO redirection & location URL listener for popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const hostname = window.location.hostname;
      if (hostname.includes('blog.radiotelevisionsismique.com')) {
        const nextPath = window.location.pathname.replace(/^\/blog/, '');
        window.location.replace(`https://radiotelevisionsismique.com/blog${nextPath}`);
        return;
      }

      const path = window.location.pathname;
      if (path === '/blog' || path === '/blog/') {
        setCurrentPage(Page.Blog);
        setSelectedBlogSlug(null);
        setSelectedBlogCategorySlug(null);
      } else if (path.startsWith('/blog/category/')) {
        const catSlug = path.replace('/blog/category/', '');
        setCurrentPage(Page.Blog);
        setSelectedBlogSlug(null);
        setSelectedBlogCategorySlug(catSlug);
      } else if (path.startsWith('/blog/')) {
        const postSlug = path.replace('/blog/', '');
        setCurrentPage(Page.BlogDetail);
        setSelectedBlogSlug(postSlug);
        setSelectedBlogCategorySlug(null);
      } else if (path === '/news' || path === '/news/') {
        setCurrentPage(Page.News);
      } else if (path === '/programmes' || path === '/programmes/') {
        setCurrentPage(Page.Programmes);
      } else if (path === '/espace-citoyen' || path === '/espace-citoyen/') {
        setCurrentPage(Page.EspaceCitoyen);
      } else if (path === '/sports-diagnostics' || path === '/sports-diagnostics/') {
        setCurrentPage(Page.SportsDiagnostics);
      } else if (path.startsWith('/sports')) {
        setCurrentPage(Page.Sports);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Synchronize internal state to pathname URL (SPA Routing)
  useEffect(() => {
    let targetPath = '';
    if (currentPage === Page.Blog) {
      if (selectedBlogCategorySlug) {
        targetPath = `/blog/category/${selectedBlogCategorySlug}`;
      } else {
        targetPath = '/blog';
      }
    } else if (currentPage === Page.BlogDetail) {
      if (selectedBlogSlug) {
        targetPath = `/blog/${selectedBlogSlug}`;
      } else {
        targetPath = '/blog';
      }
    } else if (currentPage === Page.Home) {
      targetPath = '/';
    } else if (currentPage === Page.Programmes) {
      targetPath = '/programmes';
    } else if (currentPage === Page.EspaceCitoyen) {
      targetPath = '/espace-citoyen';
    } else if (currentPage === Page.SportsDiagnostics) {
      targetPath = '/sports-diagnostics';
    } else if (currentPage === Page.Sports) {
      if (!window.location.pathname.startsWith('/sports')) {
        targetPath = '/sports';
      }
    }

    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [currentPage, selectedBlogSlug, selectedBlogCategorySlug]);

  // Dynamic SEO Canonical tag management
  useEffect(() => {
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `https://radiotelevisionsismique.com${window.location.pathname}`);
  }, [currentPage, selectedBlogSlug, selectedBlogCategorySlug]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, selectedNewsId, selectedBlogSlug]);

  const handleSelectNews = (id: string) => {
    setSelectedNewsId(id);
    setCurrentPage(Page.NewsDetail);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return <Home setCurrentPage={setCurrentPage} onSelectNews={handleSelectNews} />;
      case Page.About:
        return <About />;
      case Page.Emissions:
        return <Emissions />;
      case Page.Live:
        return <Live />;
      case Page.News:
        return <News onSelectNews={handleSelectNews} />;
      case Page.NewsDetail:
        return <NewsDetail newsId={selectedNewsId} setCurrentPage={setCurrentPage} />;
      case Page.Blog:
        return (
          <Blog 
            initialCategorySlug={selectedBlogCategorySlug}
            onSelectArticle={(slug) => {
              setSelectedBlogSlug(slug);
              setCurrentPage(Page.BlogDetail);
            }}
            onSelectCategory={(slug) => {
              setSelectedBlogCategorySlug(slug);
              setCurrentPage(Page.Blog);
            }}
          />
        );
      case Page.BlogDetail:
        return (
          <BlogDetail 
            articleSlug={selectedBlogSlug}
            onBackToBlog={() => {
              setSelectedBlogSlug(null);
              setSelectedBlogCategorySlug(null);
              setCurrentPage(Page.Blog);
            }}
            onNavigateToBlogArticle={(slug) => {
              setSelectedBlogSlug(slug);
              setCurrentPage(Page.BlogDetail);
            }}
          />
        );
      case Page.Contact:
        return <Contact />;
      case Page.Privacy:
      case Page.Terms:
      case Page.Cookies:
      case Page.Disclaimer:
      case Page.LegalMentions:
        return <Legal type={currentPage} setCurrentPage={setCurrentPage} />;
      case Page.Login:
        return <Login setCurrentPage={setCurrentPage} />;
      case Page.Register:
        return <Register setCurrentPage={setCurrentPage} />;
      case Page.ForgotPassword:
        return <ForgotPassword setCurrentPage={setCurrentPage} />;
      case Page.Dashboard:
        return <Dashboard setCurrentPage={setCurrentPage} onSelectNews={handleSelectNews} />;
      case Page.AdminDashboard:
        return <AdminDashboard setCurrentPage={setCurrentPage} />;
      case Page.FirebaseDiagnostics:
        return <FirebaseDiagnostics />;
      case Page.Programmes:
        return <Programmes />;
      case Page.EspaceCitoyen:
        return <EspaceCitoyen />;
      case Page.Sports:
        return <Sports />;
      case Page.SportsDiagnostics:
        return <SportsDiagnostics />;
      default:
        return <Home setCurrentPage={setCurrentPage} onSelectNews={handleSelectNews} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 selection:bg-orange-500 selection:text-white">
      <BreakingNewsTicker />
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main className="flex-grow">
        {renderPage()}
      </main>

      <Footer setCurrentPage={setCurrentPage} />
      <RadioPlayer />
      <WhatsAppButton />
      <OneTimePopup />
      <WelcomeAnnouncementPopup />
      <GamificationNotifyPopup />
    </div>
  );
};

export default App;
