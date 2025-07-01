const CACHE_NAME = 'pwa-test-cache-v3';
const BASE_PATH = '/pwa-test/';

const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + '404.html',
  BASE_PATH + 'styles.css',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-any-192.png',
  BASE_PATH + 'icon-any-512.png',
  BASE_PATH + 'icon-maskable-192.png',
  BASE_PATH + 'icon-maskable-512.png',
  BASE_PATH + 'screenshot1.png',
  BASE_PATH + 'screenshot2.png'
];

// Install with caching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Cache error:', err))
  );
});

// Fetch handling with network-first strategy
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Cache API requests
  if (requestUrl.pathname.endsWith('/api/data')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone to cache and return
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other requests: network first, then cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background Sync handler
self.addEventListener('sync', event => {
  if (event.tag === 'content-update') {
    event.waitUntil(
      updateContent().then(() => {
        if (Notification.permission === 'granted') {
          self.registration.showNotification('Content Updated', {
            body: 'New content is available',
            icon: BASE_PATH + 'icon-192.png'
          });
        }
      })
    );
  }
});

// Periodic Sync handler
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-update') {
    event.waitUntil(
      updateContent().then(() => {
        if (Notification.permission === 'granted') {
          self.registration.showNotification('Daily Update', {
            body: 'New content has been updated',
            icon: BASE_PATH + 'icon-192.png'
          });
        }
      })
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  
  if (Notification.permission === 'granted') {
    event.waitUntil(
      self.registration.showNotification(data.title || 'New Update', {
        body: data.body || 'New content is available!',
        icon: BASE_PATH + 'icon-192.png',
        badge: BASE_PATH + 'icon-192.png',
        data: { url: data.url || BASE_PATH }
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data.url || BASE_PATH;
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Content update logic
async function updateContent() {
  const cache = await caches.open(CACHE_NAME);
  
  // Update core files
  await cache.addAll([
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json'
  ]);
  
  // Send message to all clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'content-updated',
      message: 'New content is available',
      timestamp: Date.now()
    });
  });
  
  console.log('Content updated via background sync');
  return true;
}

// Cache cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data.type === 'trigger-update') {
    updateContent();
  }
});