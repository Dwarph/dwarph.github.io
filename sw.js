// Service Worker for pipturner.co.uk
const CACHE_NAME = 'pipturner-v3';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/styling/homepage.css',
  '/styling/styles.css',
  '/styling/soundboard.css',
  '/styling/markdownStyling.css',
  '/js/utils.js',
  '/js/header.js',
  '/js/homepageGenerator.js',
  '/js/soundboard.js',
  '/js/themeManager.js',
  '/assets/branding/favicon.ico',
  '/assets/branding/favicon.svg',
  '/assets/branding/favicon-96x96.png',
  '/assets/branding/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_CACHE_URLS).catch(function(error) {
        console.log('Cache addAll failed:', error);
        // Continue even if some files fail to cache
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event — network-first for HTML, JSON, CSS, JS; cache-first for images and other static media
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For JSON data (e.g. homepageData.json), use network-first so new content
  // (talks, projects, work, etc.) shows up without a hard refresh.
  if (event.request.url.match(/\.json$/)) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-cache' })).then(function(fetchResponse) {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        var responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return fetchResponse;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // For navigation/document requests, use a network-first strategy so that
  // new deployments are picked up immediately without requiring a hard refresh.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).then(function(fetchResponse) {
        // Don't cache if not a valid response
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        var responseToCache = fetchResponse.clone();

        // Keep a cached copy of the shell for offline usage
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      }).catch(function() {
        // If the network fails (offline), fall back to the cached shell if available
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For CSS and JS, use network-first so style and script changes
  // are picked up without needing a hard refresh.
  if (event.request.url.match(/\.(css|js)$/)) {
    event.respondWith(
      fetch(event.request).then(function(fetchResponse) {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        var responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return fetchResponse;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Default: cache-first for other static assets (images, media, etc.)
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(fetchResponse) {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        var responseToCache = fetchResponse.clone();

        if (event.request.destination === 'image' || 
            event.request.url.match(/\.(svg|png|jpg|jpeg|webp|mp4|mp3)$/)) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }

        return fetchResponse;
      }).catch(function(error) {
        console.log('Fetch failed:', error);
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

