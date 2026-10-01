import { afterEach, describe, expect, it } from 'vitest';
import { langPath, normalizeLangUrl, stripLang } from '../src/lib/lang';

function setup(url: string, saved: string | null) {
  const u = new URL(url, 'https://www.chekkiai.com');
  const store: Record<string, string> = saved ? { chekki_lang: saved } : {};
  const loc = { pathname: u.pathname, search: u.search, hash: u.hash, replaced: null as string | null, replace: (to: string) => (loc.replaced = to) };
  (globalThis as any).window = { location: loc };
  (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v) };
  return { loc, store };
}

afterEach(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
});

describe('lang URLs', () => {
  it('strips and adds the /en prefix only for bilingual routes', () => {
    expect(stripLang('/en')).toBe('/');
    expect(stripLang('/en/faq')).toBe('/faq');
    expect(stripLang('/english')).toBe('/english');
    expect(langPath('/', 'en')).toBe('/en');
    expect(langPath('/schools', 'en')).toBe('/en/schools');
    expect(langPath('/privacy', 'en')).toBe('/privacy');
    expect(langPath('/faq', 'ko')).toBe('/faq');
  });

  it('leaves crawlers (no saved pref) on the URL they asked for', () => {
    const ko = setup('/faq', null);
    expect(normalizeLangUrl()).toBe(false);
    expect(ko.loc.replaced).toBe(null);
    const { loc } = setup('/en/faq', null);
    expect(normalizeLangUrl()).toBe(false);
    expect(loc.replaced).toBe(null);
  });

  it('turns legacy ?lang= links into real URLs, keeping other params', () => {
    const { loc } = setup('/schools?lang=en&utm_source=kakao', null);
    expect(normalizeLangUrl()).toBe(true);
    expect(loc.replaced).toBe('/en/schools?utm_source=kakao');
    const ko = setup('/en?lang=ko', 'en');
    normalizeLangUrl();
    expect(ko.loc.replaced).toBe('/');
    expect(ko.store.chekki_lang).toBe('ko');
  });

  it('sends returning English users from a bare Korean URL to /en, but not from /en back', () => {
    const { loc } = setup('/', 'en');
    expect(normalizeLangUrl()).toBe(true);
    expect(loc.replaced).toBe('/en');
    const back = setup('/en/faq', 'ko');
    expect(normalizeLangUrl()).toBe(false);
    expect(back.store.chekki_lang).toBe('en');
  });

  it('ignores non-bilingual routes', () => {
    const { loc } = setup('/teacher?lang=en', 'en');
    expect(normalizeLangUrl()).toBe(false);
    expect(loc.replaced).toBe(null);
  });
});
