const KESH = "yuz-v1";
const BOSH = ["./", "index.html", "manifest.json", "icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(KESH).then(c => c.addAll(BOSH)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== KESH).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const ichki = u.origin === location.origin;
  const cdn = u.hostname === "cdn.jsdelivr.net";
  if (!ichki && !cdn) return;

  if (r.mode === "navigate" || (ichki && u.pathname.endsWith("index.html"))) {
    e.respondWith(
      fetch(r)
        .then(res => {
          const k = res.clone();
          caches.open(KESH).then(c => c.put(r, k));
          return res;
        })
        .catch(() =>
          caches.match(r, {ignoreSearch: true}).then(m => m || caches.match("index.html"))
        )
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok || res.type === "opaque") {
        const k = res.clone();
        caches.open(KESH).then(c => c.put(r, k));
      }
      return res;
    }))
  );
});
