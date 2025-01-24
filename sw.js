console.log('Service Worker Loaded');

const BASE_PATH = '/mhaack/citisignal-one';
const LIVE_HOST_NAME = 'main--citisignal-one--mhaack.aem.live';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
  console.log(event);
  // ignore for non-GET and navigate requests.
  if (event.request.mode === "navigate" || event.request.method !== "GET") return;
  const { origin, pathname } = new URL(event.request.url);
  if (origin !== self.location.origin) return;
  const { mode, headers, method, credentials } = event.request;

  if (pathname.startsWith(BASE_PATH)) {
    return;
  }

  const updatedUrl = new URL(event.request.url);
  updatedUrl.hostname = LIVE_HOST_NAME;

  console.log(`Rewriting ${pathname} to ${updatedUrl.href}`);

  event.respondWith(fetch(updatedUrl.href, { mode, headers, method, credentials }));
});

