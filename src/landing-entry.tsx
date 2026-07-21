import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import SchoolsLandingPage from './pages/SchoolsLandingPage';
import Landing from './Landing';
import App from '../App';
import '../landing.css';

function LandingRoot() {
  const [isNight, setIsNight] = useState(true);
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If URL path is for Teacher Portal, Admin, Subscribe or Main App -> render App.tsx
  if (
    pathname.startsWith('/teacher') || 
    pathname.startsWith('/app') || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/subscribe')
  ) {
    return <App />;
  }

  // If path is explicitly /parent, show parent landing page
  if (pathname === '/parent') {
    return <Landing />;
  }

  // Default: Main Landing Page with updated Bento Grid & Floating Island Header
  return <SchoolsLandingPage isNight={isNight} setIsNight={setIsNight} />;
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
