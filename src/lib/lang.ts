/**
 * Marketing pages live at /x (Korean) and /en/x (English) so each language
 * has its own indexable URL. The URL is the source of truth for language on
 * these routes; localStorage 'chekki_lang' only remembers the last choice for
 * the rest of the app and for redirecting a bare Korean URL.
 */
export type Lang = 'ko' | 'en';

export const LANG_ROUTES = ['/', '/faq', '/schools'];

export function stripLang(path: string): string {
  return path.replace(/^\/en(?=\/|$)/, '') || '/';
}

export function urlLang(): Lang {
  return stripLang(window.location.pathname) !== window.location.pathname ? 'en' : 'ko';
}

export function langPath(path: string, lang: Lang = urlLang()): string {
  if (lang === 'ko' || !LANG_ROUTES.includes(path)) return path;
  return path === '/' ? '/en' : `/en${path}`;
}

export function switchLang(lang: Lang) {
  try {
    localStorage.setItem('chekki_lang', lang);
  } catch {}
  const { pathname, search, hash } = window.location;
  window.location.href = langPath(stripLang(pathname), lang) + search + hash;
}

/**
 * Run once before first render. Turns legacy ?lang= links into the real URL
 * and sends returning English users from a bare Korean URL to /en. Crawlers
 * have no saved preference, so they always get the URL they asked for.
 * Returns true when it has started a redirect.
 */
export function normalizeLangUrl(): boolean {
  const { pathname, search, hash } = window.location;
  const base = stripLang(pathname);
  if (!LANG_ROUTES.includes(base)) return false;
  const params = new URLSearchParams(search);
  const q = params.get('lang');
  let saved: string | null = null;
  try {
    saved = localStorage.getItem('chekki_lang');
  } catch {}
  const current = urlLang();
  const want: Lang = q === 'en' || q === 'ko' ? q : current === 'ko' && saved === 'en' ? 'en' : current;
  try {
    localStorage.setItem('chekki_lang', want);
  } catch {}
  if (want === current && !q) return false;
  params.delete('lang');
  const rest = params.toString();
  window.location.replace(langPath(base, want) + (rest ? `?${rest}` : '') + hash);
  return true;
}
