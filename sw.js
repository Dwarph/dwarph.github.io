// Service Worker for pipturner.co.uk
const CACHE_NAME = 'pipturner-v1';
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
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/apple-touch-icon.png'
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

// Fetch event - use network-first for pages, cache-first for static assets
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

  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Return cached version or fetch from network
      return response || fetch(event.request).then(function(fetchResponse) {
        // Don't cache if not a valid response
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        // Clone the response
        var responseToCache = fetchResponse.clone();

        // Cache images and static assets
        if (event.request.destination === 'image' || 
            event.request.url.match(/\.(css|js|json|svg|png|jpg|jpeg|webp|mp4|mp3)$/)) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }

        return fetchResponse;
      }).catch(function(error) {
        console.log('Fetch failed:', error);
        // Return offline page or fallback if available
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

