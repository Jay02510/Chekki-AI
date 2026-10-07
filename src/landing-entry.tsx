import React, { useState, useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import SchoolsLandingPage from './pages/SchoolsLandingPage';
import FaqPage from './pages/FaqPage';
import Landing from './Landing';
import '../landing.css';
import { initSentry } from './lib/sentry';
import { setPageMeta } from './lib/pageMeta';
import { landingMeta, TEACHER_META } from './data/seo';
import { normalizeLangUrl, stripLang, urlLang } from './lib/lang';
import { ToastProvider } from '../contexts/ToastContext';
import { track } from './lib/track';

// The parent app/staff portal is only needed on its own routes — loading it
// eagerly made every marketing-page visitor download all of it.
const App = lazy(() => import('../App'));

initSentry();

function LandingRoot() {
  const [pathname, setPathname] = useState(stripLang(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setPathname(stripLang(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (pathname === '/faq' || pathname.startsWith('/faq')) {
      setPageMeta(landingMeta('faq', urlLang()));
    } else if (
      pathname === '/school' ||
      pathname === '/schools' ||
      pathname === '/for-schools' ||
      pathname.startsWith('/school/') ||
      pathname.startsWith('/schools/')
    ) {
      setPageMeta(landingMeta('schools', urlLang()));
    } else if (pathname.startsWith('/teacher')) {
      setPageMeta(TEACHER_META);
    } else if (pathname === '/' || pathname === '') {
      setPageMeta(landingMeta('home', urlLang()));
    }
    // Firebase Analytics (GA4) doesn't auto-log page_view on SPA route
    // changes the way a classic multi-page site does — there's no full
    // navigation for it to hook. Firing it here, once per pathname change,
    // is what makes /schools, /faq, and / show up as real GA4 page views
    // instead of all collapsing into one session-start event.
    track('page_view', { page_path: window.location.pathname, page_location: window.location.href });
  }, [pathname]);

  // classCode= is the invite-email "join this class" link (api/create-class.ts's
  // sendStudentInviteEmail) — without this it fell through to the marketing
  // <Landing /> page below with no indication anything was wrong.
  const hasInviteParam = typeof window !== 'undefined' && (window.location.search.includes('invite=') || window.location.search.includes('classCode='));

  // Legacy redirect: /schools/login → /teacher (old links and bookmarks)
  if (pathname === '/schools/login' || pathname.startsWith('/schools/login')) {
    const search = window.location.search;
    window.location.replace(`/teacher${search}`);
    return null;
  }

  // Dedicated FAQ Page route: chekkiai.com/faq
  if (pathname === '/faq' || pathname.startsWith('/faq')) {
    return <FaqPage />;
  }


  // Web App route: chekkiai.com/app (also teacher portal, admin, subscribe, legal, OR any invite link)
  if (
    hasInviteParam ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/subscribe') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/refund') ||
    pathname.startsWith('/youth') ||
    pathname.startsWith('/support')
  ) {
    return (
      <Suspense fallback={null}>
        <App />
      </Suspense>
    );
  }

  // School Landing Page route: chekkiai.com/school (also /schools and /for-schools)
  if (
    pathname === '/school' || 
    pathname === '/schools' || 
    pathname === '/for-schools' ||
    pathname.startsWith('/school/') ||
    pathname.startsWith('/schools/')
  ) {
    // SchoolsLandingPage calls useToast() (added in b397db2 to replace native
    // alert/confirm) but this route never mounts <App />, which is the only
    // place ToastProvider normally wraps the tree — the page crashed on
    // load with "useToast must be used within a ToastProvider" until this
    // was added (Audit: /schools outreach page broken since 2026-08-10).
    return (
      <ToastProvider>
        <SchoolsLandingPage />
      </ToastProvider>
    );
  }

  // Default Main Page: chekkiai.com (/)
  return <Landing />;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
if (!normalizeLangUrl()) root.render(
  <React.StrictMode>
    <LandingRoot />
  </React.StrictMode>
);

// Registers the passthrough SW so the schools portal (/teacher, /admin) is
// installable via "Add to Home Screen" on Android/Chrome. index.html only —
// never loaded inside the Capacitor native app (app.html has its own entry).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
