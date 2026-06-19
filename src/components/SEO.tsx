import React, { useEffect } from 'react';

export interface ArticleSEOData {
  title: string;
  description: string;
  image: string;
  datePublished: string | Date;
  dateModified: string | Date;
  authorName: string;
  section?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  slugPath?: string;
  articleData?: ArticleSEOData;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image = 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png',
  type = 'website',
  slugPath = '',
  articleData
}) => {
  const defaultTitle = 'Radio Télévision Sismique | Radio en Direct, Actualités et Émissions';
  const defaultDesc = 'Écoutez Radio Télévision Sismique en direct. Actualités, culture, sport, politique, émissions spéciales et informations en temps réel depuis Haïti et partout dans le monde.';
  const defaultKeywords = 'radio haiti, radio télévision sismique, radio en direct, radio haiti live, actualités haiti, radio fm haiti, émissions radio, podcast haiti, musique haiti, radio online';
  
  const siteUrl = 'https://radiotelevisionsismique.com';
  const currentUrl = `${siteUrl}${slugPath}`;
  const fullTitle = title ? `${title} | Radio Télévision Sismique` : defaultTitle;
  const fullDesc = description || defaultDesc;
  const fullKeywords = keywords || defaultKeywords;

  useEffect(() => {
    // 1. Update title
    document.title = fullTitle;

    // 2. Head meta updater function
    const setMeta = (nameAttr: string, value: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${nameAttr}"]` : `meta[name="${nameAttr}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(isProperty ? 'property' : 'name', nameAttr);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    setMeta('description', fullDesc);
    setMeta('keywords', fullKeywords);

    // Open Graph attributes
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', fullDesc, true);
    setMeta('og:image', image, true);
    setMeta('og:url', currentUrl, true);
    setMeta('og:type', type, true);

    // Twitter Card attributes
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', fullDesc);
    setMeta('twitter:image', image);
    setMeta('twitter:card', 'summary_large_image');

    // 3. Set Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 4. Inject Search Engine Optimized JSON-LD Structured Data
    let schemaScript = document.getElementById('dynamic-seo-ld-json') as HTMLScriptElement;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'dynamic-seo-ld-json';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    let schemaJSON: any = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'BlogPosting' : 'WebPage',
      'url': currentUrl,
      'name': fullTitle,
      'description': fullDesc,
      'publisher': {
        '@type': 'NewsMediaOrganization',
        'name': 'Radio Télévision Sismique',
        'url': siteUrl,
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png'
        }
      }
    };

    if (type === 'article' && articleData) {
      let pubDateString: string;
      try {
        pubDateString = articleData.datePublished instanceof Date 
          ? articleData.datePublished.toISOString() 
          : new Date(articleData.datePublished).toISOString();
      } catch (e) {
        pubDateString = new Date().toISOString();
      }

      let modDateString: string;
      try {
        modDateString = articleData.dateModified 
          ? (articleData.dateModified instanceof Date ? articleData.dateModified.toISOString() : new Date(articleData.dateModified).toISOString())
          : pubDateString;
      } catch (e) {
        modDateString = pubDateString;
      }

      schemaJSON = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': currentUrl
        },
        'headline': articleData.title.substring(0, 110),
        'description': articleData.description || fullDesc,
        'image': articleData.image || image,
        'datePublished': pubDateString,
        'dateModified': modDateString,
        'author': {
          '@type': 'Person',
          'name': articleData.authorName || 'RTS Rédacteur'
        },
        'publisher': {
          '@type': 'NewsMediaOrganization',
          'name': 'Radio Télévision Sismique',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png'
          }
        },
        'articleSection': articleData.section || 'Actualités'
      };
    }

    schemaScript.textContent = JSON.stringify(schemaJSON, null, 2);
  }, [fullTitle, fullDesc, fullKeywords, image, type, currentUrl, articleData]);

  return null;
};

export default SEO;
