const CACHE_NAME = 'chinese-vocab-cache-v2'; // Updated cache version
const urlsToCache = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'vocab-global.js',
    'vocab-basics.js',
    'vocab-lesson1.js',
    'vocab-lesson2.js',
    'vocab-lesson3.js',
    'vocab-lesson4.js',
    'vocab-lesson5.js',
    // If you add more vocab files like 'vocab-keepingitcasual.js', add them here
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'icons/icon-maskable-192x192.png',
    'icons/icon-maskable-512x512.png'
    // Add other icon paths if you have more
];

// Install a service worker
self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache: ' + CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to open cache or add URLs:', error);
            })
    );
});

// Cache and return requests
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Fetch failed; returning offline page instead.', error);
                    // You could return a fallback offline page here if desired
                    // For example: return caches.match('offline.html');
                    // For this app, failing to fetch non-cached items might just mean they're unavailable.
                });
            })
    );
});

// Update a service worker
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; // Only the current cache is whitelisted
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // If a cache is not in the whitelist, delete it
                        console.log('Deleting old cache: ' + cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});