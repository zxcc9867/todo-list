const CACHE_NAME = "jini-tasks-shell-v1";
const SHELL_ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        SHELL_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn("[sw] Shell asset was not cached:", asset, error);
          }
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);

      try {
        const response = await fetch(event.request);

        if (response.ok) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
          } catch (error) {
            console.warn("[sw] Response was not cached:", event.request.url, error);
          }
        }

        return response;
      } catch (error) {
        if (cached) {
          return cached;
        }

        if (event.request.mode === "navigate") {
          const fallback = await caches.match("/");

          if (fallback) {
            return fallback;
          }
        }

        throw error;
      }
    })(),
  );
});
