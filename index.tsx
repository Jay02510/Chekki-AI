import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Imported from JS, not via @import in index.css: Tailwind's Vite plugin
// inlines CSS @imports without rebasing url(), so the font files 404'd.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './index.css';
import { initSentry } from './src/lib/sentry';
import { Capacitor } from '@capacitor/core';

initSentry();

// iOS auto-zooms into any focused input under 16px and never zooms back out,
// leaving the native app stuck mid-zoom. Native apps don't pinch-zoom anyway,
// so lock the scale there; the web build keeps zoom for accessibility.
if (Capacitor.isNativePlatform()) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
