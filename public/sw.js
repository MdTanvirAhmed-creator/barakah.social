// Barakah.Social Service Worker
// Version 2.0.0 — "courtyard"
//
// v1 precached page HTML into a never-versioned cache and served pages
// cache-first, so users kept seeing the install-time UI after deploys.
// v2 fixes that:
//   - pages/documents are NETWORK-FIRST (cache only as offline fallback)
//   - only hashed immutable assets are cache-first
//   - versioned cache names; activate purges everything older

const VERSION = 'v2-courtyard';
const ASSET_CACHE = `barakah-assets-${VERSION}`;
const PAGE_CACHE = `barakah-pages-${VERSION}`;

self.addEventListener('install', (event) => {
  // No page-HTML precaching: documents must always come from the network
  // when it is available.
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== ASSET_CACHE && name !== PAGE_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  // Never intercept API/auth/Supabase traffic.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // Immutable hashed assets: cache-first (safe — filenames change per build).
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Pages/documents: NETWORK-FIRST so a deploy is visible immediately.
  // The cached copy is only an offline fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || createOfflinePage())
      )
  );
});

function createOfflinePage() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline — Barakah.Social</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; margin: 0;
            background: #E7DECB; color: #2A2620;
          }
          .container { text-align: center; padding: 2rem; max-width: 28rem; }
          h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
          p { color: #6E6656; line-height: 1.6; }
          .mark {
            width: 14px; height: 14px; background: #B0872A;
            transform: rotate(45deg); margin: 0 auto 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="mark"></div>
          <h1>You're offline</h1>
          <p>The courtyard will be here when your connection returns.</p>
        </div>
      </body>
    </html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
