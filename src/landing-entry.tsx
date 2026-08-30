import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import SchoolsLandingPage from './pages/SchoolsLandingPage';
import FaqPage from './pages/FaqPage';
import Landing from './Landing';
import App from '../App';
import '../landing.css';
import { initSentry } from './lib/sentry';
import { setPageMeta } from './lib/pageMeta';
import { ToastProvider } from '../contexts/ToastContext';
import { db } from '../services/database';

initSentry();

function LandingRoot() {
  const [isNight, setIsNightState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chekki_theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
    }
    return true;
  });

  const setIsNight = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsNightState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chekki_theme', next ? 'dark' : 'light');
      }
      return next;
    });
  };

  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (pathname === '/faq' || pathname.startsWith('/faq')) {
      setPageMeta({
        title: 'FAQ | Chekki AI',
        description: "Answers to common questions about Chekki AI's homework scanning, pronunciation coaching, safety, and pricing for families.",
        path: '/faq',
      });
    } else if (
      pathname === '/school' ||
      pathname === '/schools' ||
      pathname === '/for-schools' ||
      pathname.startsWith('/school/') ||
      pathname.startsWith('/schools/')
    ) {
      setPageMeta({
        title: 'Chekki AI for Academies | Hagwon Homework & Parent Reporting Automation',
        description: 'Chekki turns Foreign Teacher class logs into Korean KakaoTalk parent updates automatically — homework grading, curriculum tools, and reporting built for English-language academies.',
        path: '/schools',
      });
    } else if (pathname.startsWith('/teacher')) {
      setPageMeta({
        title: 'Teacher & Director Portal | Chekki AI',
        description: 'Sign in to the Chekki AI teacher and director dashboard to manage classes, review homework scans, and send parent reports.',
        path: '/teacher',
      });
    } else if (pathname === '/' || pathname === '') {
      setPageMeta({
        title: 'Chekki AI: For Families and Teachers',
        description: 'Chekki AI – AI homework help for Korean parents, and ESL lesson planning tools for teachers.',
        path: '/',
      });
    }
    // Firebase Analytics (GA4) doesn't auto-log page_view on SPA route
    // changes the way a classic multi-page site does — there's no full
    // navigation for it to hook. Firing it here, once per pathname change,
    // is what makes /schools, /faq, and / show up as real GA4 page views
    // instead of all collapsing into one session-start event.
    db.logUserEvent('page_view', { page_path: pathname, page_location: window.location.href });
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
    return <FaqPage isNight={isNight} setIsNight={setIsNight} />;
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
    return <App />;
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
        <SchoolsLandingPage isNight={isNight} setIsNight={setIsNight} />
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
root.render(
  <React.StrictMode>
    <LandingRoot />
  </React.StrictMode>
);
