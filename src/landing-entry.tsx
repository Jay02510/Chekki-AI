import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import SchoolsLandingPage from './pages/SchoolsLandingPage';
import FaqPage from './pages/FaqPage';
import Landing from './Landing';
import App from '../App';
import '../landing.css';

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

  const hasInviteParam = typeof window !== 'undefined' && window.location.search.includes('invite=');

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


  // Web App route: chekkiai.com/app (also teacher portal, admin, subscribe, legal, report studio, OR any invite link)
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
    pathname.startsWith('/support') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/report-studio')
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
    return <SchoolsLandingPage isNight={isNight} setIsNight={setIsNight} />;
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
