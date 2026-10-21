const CACHE = "tafsir-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./part1.html",
  "./part2.html",
  "./part3.html",
  "./vocabulary.html",
  "./words.html",
  "./business.html",
  "./search.html",
  "./404.html",
  "./assets/css/style.css",
  "./assets/js/app.js",
  "./assets/js/tts.js",
  "./assets/js/builder.js",
  "./assets/js/wiki.js",
  "./assets/js/universe-animations.js",
  "./assets/js/words.js",
  "./assets/js/search.js",
  "./assets/js/knowledge.js",
  "./assets/js/business.js",
  "./assets/data/chapters.js",
  "./assets/data/surah_knowledge.js",
  "./assets/data/deep_research.js",
  "./assets/data/wiki_map.js",
  "./assets/data/ghaur_ofikr_map.js",
  "./assets/data/words_export.json",
  "./assets/data/business.json",
  "./assets/data/knowledge.json",
  "./assets/data/quran_ar.json",
  "./assets/logo-mark.png",
  "./assets/apple-touch-icon.png",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Only handle same-origin GET under GH Pages scope or root
  if (e.request.method !== "GET") return;
  // Cache strategy: Cache-First for assets, Stale-While-Revalidate for HTML
  const isHTML = e.request.headers.get("accept")?.includes("text/html") || url.pathname.endsWith(".html");
  const isAsset = url.pathname.match(/\.(css|js|json|png|jpg|jpeg|svg|woff2?)$/);
  const isScope = url.pathname.includes("/quran-science-tafsir/") || url.origin === self.location.origin;

  if (!isScope && !isAsset && !isHTML) return;

  if (isAsset) {
    // Cache-first for assets (figures, css, js)
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c=>c.put(e.request, res.clone()));
          return res;
        }).catch(()=>cached);
      })
    );
    return;
  }

  // For HTML (chapters, read pages): stale-while-revalidate + fallback to cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res=>{
        if(res.ok) caches.open(CACHE).then(c=>c.put(e.request, res.clone()));
        return res;
      }).catch(()=>cached || caches.match("./index.html"));
      return cached || fetched;
    })
  );
});

// Notifications & periodic tasks
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "Scientific Tafsir — Today's Ayah";
  const opts = {
    body: data.body || "আজকের আয়াত পড়ুন · Today's ayah is ready",
    icon: "./assets/icon-192.png",
    badge: "./assets/icon-192.png",
    data: { url: data.url || "./" }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.matchAll({type:"window"}).then(list=>{
    for(const c of list) if(c.url.includes("/quran-science-tafsir/")) return c.focus();
    return clients.openWindow(url);
  }));
});
self.addEventListener("periodicsync", e => {
  if(e.tag === "research-daily") e.waitUntil(fetch("./assets/data/alt_meanings.json").then(r=>r.ok && caches.open(CACHE).then(c=>c.put("./assets/data/alt_meanings.json", r))));
});
