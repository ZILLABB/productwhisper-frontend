import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  canonical?: string;
}

const BASE_TITLE = 'ProductWhisper';
const BASE_DESC = 'Compare prices across Jumia, Konga & Jiji. Find the best deals, avoid scam sellers, and shop smart in Nigeria.';

/**
 * Hook to manage page-level SEO metadata.
 * Updates document.title and meta tags dynamically.
 */
export function useSEO(config: SEOConfig) {
  useEffect(() => {
    // Title
    document.title = config.title ? `${config.title} | ${BASE_TITLE}` : `${BASE_TITLE} — Compare. Save. Shop Smart.`;

    // Description
    setMeta('description', config.description || BASE_DESC);

    // Keywords
    if (config.keywords) {
      setMeta('keywords', config.keywords);
    }

    // Open Graph
    setMeta('og:title', config.ogTitle || config.title || BASE_TITLE, 'property');
    setMeta('og:description', config.ogDescription || config.description || BASE_DESC, 'property');
    setMeta('og:type', config.ogType || 'website', 'property');
    setMeta('og:site_name', BASE_TITLE, 'property');

    // Twitter card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', config.ogTitle || config.title || BASE_TITLE);
    setMeta('twitter:description', config.ogDescription || config.description || BASE_DESC);

    // Canonical
    if (config.canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = config.canonical;
    }

    return () => {
      // Reset to defaults on unmount
      document.title = `${BASE_TITLE} — Compare. Save. Shop Smart.`;
    };
  }, [config.title, config.description, config.keywords, config.ogTitle, config.ogDescription, config.ogType, config.canonical]);
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export default useSEO;
