/**
 * index.html is shared by ~12 different routes (/, /schools, /teacher, /faq,
 * ...). Landing routes get prerendered HTML at build time (vite.config.ts);
 * this keeps <head> right during client-side navigation between them, and for
 * routes that aren't prerendered (/teacher).
 */
import type { Lang } from './lang';

const SITE = 'https://www.chekkiai.com';

export interface PageMeta {
  title: string;
  description: string;
  /** Korean (unprefixed) path. */
  path: string;
  /** Set for routes that exist in both languages; adds hreflang + /en canonical. */
  lang?: Lang;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, hreflang: string | null, href: string | null) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (href === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function setPageMeta({ title, description, path, lang }: PageMeta) {
  const ko = SITE + path;
  const en = SITE + (path === '/' ? '/en' : `/en${path}`);
  const url = lang === 'en' ? en : ko;
  document.title = title;
  document.documentElement.lang = lang ?? 'ko';
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', url);
  upsertLink('canonical', null, url);
  upsertLink('alternate', 'ko', lang ? ko : null);
  upsertLink('alternate', 'en', lang ? en : null);
  upsertLink('alternate', 'x-default', lang ? ko : null);
}
