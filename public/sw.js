const CACHE_NAME = "minimalist-podcast-cache-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip API, iTunes Search and proxy requests so they aren't stale-cached
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("itunes.apple.com") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          // Dynamic asset caching for fonts and core UI assets
          if (
            response.status === 200 &&
            (event.request.url.startsWith(self.location.origin) ||
              event.request.url.includes("fonts.googleapis.com") ||
              event.request.url.includes("fonts.gstatic.com"))
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline navigation, fallback to SPA index.html
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
