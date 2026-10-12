// Passthrough service worker — exists only so Chrome/Android treat the
// schools portal as installable ("Add to Home Screen"). Deliberately does
// NOT cache anything: this app ships fast-moving JS bundles, and a caching
// SW would serve stale/broken code to an installed PWA with no way to force
// an update the way a normal page reload does.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Cross-origin requests (fonts, analytics, Kakao SDK) re-fetched from the
  // SW count as connect-src under the page's CSP and get blocked; let the
  // browser load them directly.
  if (url.origin !== self.location.origin) return;
  // iOS Safari won't play audio routed through a SW; leave QR pages alone.
  if (url.pathname.startsWith('/e1/')) return;
  event.respondWith(fetch(event.request));
});
