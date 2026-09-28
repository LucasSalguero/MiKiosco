const CACHE_NAME = "mi-kiosco-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("mi-kiosco-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copia = response.clone();
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copia))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(request, { ignoreSearch: true })) ??
            (await cache.match("/")) ??
            (await cache.match(OFFLINE_URL))
          );
        }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "image" ||
    request.destination === "manifest"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copia = response.clone();
              void caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, copia))
                .catch(() => undefined);
            }
            return response;
          }),
      ),
    );
  }
});
