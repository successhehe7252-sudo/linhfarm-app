/* LinhFarm Service Worker — PWA Offline Shell & Static Caching */

const CACHE_NAME = 'linhfarm-pwa-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo.webp',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png'
];

// Install Event — precache core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — cleanup old caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[PWA SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — smart caching strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only intercept GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. Bypass API calls, auth procedures, Supabase backend, S3, VietQR, dev tools
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__manus__/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('vietqr') ||
    url.hostname.includes('amazonaws') ||
    url.protocol.startsWith('chrome-extension') ||
    url.protocol.startsWith('ws')
  ) {
    return; // Handled directly by browser network stack
  }

  // 3. HTML Page Navigation — Network First, falling back to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 4. Static Assets (JS, CSS, Images, Fonts) — Cache First, then Network
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update to keep cache fresh
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          })
          .catch(() => {
            /* ignore background fetch errors */
          });
        return cachedResponse;
      }

      // Not in cache -> fetch from network and store copy
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        return networkResponse;
      });
    })
  );
});
