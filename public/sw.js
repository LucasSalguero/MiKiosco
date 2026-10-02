const CACHE_NAME = "mi-kiosco-shell-v4";
const OFFLINE_URL = "/offline.html";
const SHELL_URLS = ["/", "/historial", "/productos", OFFLINE_URL, "/icon.svg"];

async function fetchConTimeout(request, milisegundos) {
  return fetch(request, { signal: AbortSignal.timeout(milisegundos) });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))))
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
  if (url.pathname === "/api/ventas") return;

  const esRsc = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");

  if (esRsc) {
    event.respondWith(
      fetchConTimeout(request, 4000)
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
          const respuesta = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
          return respuesta?.headers.get("content-type")?.includes("text/x-component")
            ? respuesta
            : Response.error();
        }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetchConTimeout(request, 4000)
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
