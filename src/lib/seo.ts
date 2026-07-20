import type { CmsData } from '../types';

function setMeta(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setProp(property: string, content: string): void {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setPersonSchema(data: CmsData): void {
  const { site, links } = data;
  const externalLinks = links.filter((l) => l.publish && l.state === 'enabled' && l.type === 'external');
  const emailLink = links.find((l) => l.id === 'email' && l.publish && l.state === 'enabled');
  const sameAs = externalLinks.map((l) => l.url).filter(Boolean);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.site_name || 'Megan Feil',
    url: site.canonical || 'https://megfeil.com',
    image: `${site.canonical || 'https://megfeil.com'}/og-image.jpg`,
    jobTitle: 'Content Designer and Writer',
    description: site.seo_description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Raleigh',
      addressRegion: 'NC',
      addressCountry: 'US',
    },
    sameAs,
  };

  const email = emailLink?.url?.replace('mailto:', '');
  if (email && !email.includes('REPLACE_WITH_EMAIL')) {
    schema.email = email;
  }

  let el = document.getElementById('person-schema');
  if (!el) {
    el = document.createElement('script');
    el.id = 'person-schema';
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(schema);
}

/** Update document <head> tags from CMS data. Called after live fetch resolves. */
export function applySeo(data: CmsData): void {
  const { seo_title, seo_description, canonical } = data.site;
  if (seo_title) document.title = seo_title;
  if (seo_description) setMeta('description', seo_description);
  if (canonical) setCanonical(canonical);

  setProp('og:title', seo_title);
  setProp('og:description', seo_description);
  setProp('og:url', canonical);
  if (canonical) setProp('og:image', `${canonical}/og-image.jpg`);
  setProp('og:site_name', data.site.site_name);

  setMeta('twitter:title', seo_title);
  setMeta('twitter:description', seo_description);
  if (canonical) setMeta('twitter:image', `${canonical}/og-image.jpg`);

  setPersonSchema(data);
}
