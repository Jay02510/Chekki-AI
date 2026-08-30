// Passthrough service worker — exists only so Chrome/Android treat the
// schools portal as installable ("Add to Home Screen"). Deliberately does
// NOT cache anything: this app ships fast-moving JS bundles, and a caching
// SW would serve stale/broken code to an installed PWA with no way to force
// an update the way a normal page reload does.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
