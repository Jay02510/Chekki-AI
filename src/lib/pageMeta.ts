/**
 * index.html is shared by ~12 different routes (/, /schools, /teacher, /faq,
 * ...), so its static <title>/<meta description>/<link canonical> can only
 * ever be correct for one of them. This sets the real per-route values once
 * the SPA knows which page it's rendering — covers real users and any
 * JS-executing crawler (Googlebot). Non-JS crawlers still only see the
 * static index.html defaults; there's no fix for that short of per-route
 * static files or full SSR.
 */
export interface PageMeta {
  title: string;
  description: string;
  path: string;
}

function upsertMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertOgMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setPageMeta({ title, description, path }: PageMeta) {
  document.title = title;
  upsertMeta('description', description);
  upsertOgMeta('og:title', title);
  upsertOgMeta('og:description', description);

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `https://www.chekkiai.com${path}`);
}
