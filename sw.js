// Number Garden service worker: precache everything; network-first so updates show up straight away
// when online, falling back to the cache offline. Bump CACHE when the ASSETS list changes.
const CACHE = "number-garden-v7";
const CLIPS = "audio/cori/"; // recorded voice; every clip listed in its manifest is cached for offline use
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "fonts/baloo2-latin.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "js/core.js",
  "js/main.js",
  "js/games/balloons.js",
  "js/games/blocks.js",
  "js/games/tenframe.js",
  "js/games/beads.js",
  "js/games/frog.js",
  "js/games/hundred.js",
  "js/games/coins.js",
  "js/games/clock.js",
  "js/games/shares.js",
  "js/games/bags.js",
  "js/games/balance.js",
  "js/games/shapes.js",
  "js/games/robot.js",
  "js/games/measure.js",
  "js/games/doubles.js",
  "js/games/farm.js",
  "js/games/pattern.js",
  "js/games/capacity.js",
  "js/games/croc.js",
  "js/games/cherry.js",
  "js/games/arrays.js",
  "js/games/calendar.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    try {
      const manifest = await (await fetch(CLIPS + "manifest.json", { cache: "no-cache" })).json();
      await cache.put(CLIPS + "manifest.json", new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } }));
      // ~2,300 small clips: cache in batches so one slow request doesn't stall the lot.
      const files = [...new Set(Object.values(manifest))].map((f) => CLIPS + f);
      for (let i = 0; i < files.length; i += 100) {
        try { await cache.addAll(files.slice(i, i + 100)); } catch {}
      }
    } catch {} // the app still works without clips: it falls back to the device voice
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const res = await fetch(req, { cache: "no-cache" });
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) || Response.error();
      }
    })
  );
});
