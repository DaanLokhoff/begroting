// Service worker: bewaart de app en de bibliotheken lokaal, zodat Begroting offline werkt.
const CACHE = "begroting-20261013004009";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // De pagina zelf: eerst netwerk (voor updates), anders de bewaarde versie.
  if (e.request.mode === "navigate") {
    // Een foutpagina (bijv. 404) overschrijft nooit de bewaarde app.
    e.respondWith(fetch(e.request).then(r => {
      if (!r.ok) return caches.match("index.html").then(hit => hit || r);
      const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return r;
    }).catch(() => caches.match("index.html")));
    return;
  }
  // Al het andere (icoontjes, Excel-bibliotheek, lettertypen): eerst cache.
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  })));
});
