const CACHE_NAME = 'pwa-cache-v2';  // Changed cache name to force update
const urlsToCache = [
  './',             // Current directory
  './index.html',   // Explicit relative path
  // Remove references to non-existent files:
  // './styles.css',  // Only include if exists
  // './app.js',      // Only include if exists
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching URLs:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache addAll error:', error);
        // Cache core files even if others fail
        return caches.open(CACHE_NAME)
          .then(cache => cache.add('./index.html'));
      })
  );
});

// Keep the rest of your service worker code...