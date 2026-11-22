// Number Garden service worker: precache the app; network-first so updates show up straight away
// when online, falling back to the cache offline. Bump CACHE when the ASSETS list changes.
const CACHE = "number-garden-v11";
const APP_CACHE = /^number-garden-v\d+$/; // only ever delete our own: other sites can share this origin
const VOICE = "number-garden-voice"; // the clips, filled by js/offline.js; not cleared by app updates
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "audio/cori/manifest.json",
  "audio/cori/hashes.json",
  "css/app.css",
  "css/layout.css",
  "css/scenery.css",
  "fonts/baloo2-latin.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "js/core.js",
  "js/fit.js",
  "js/main.js",
  "js/offline.js",
  "js/selftest.js",
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
  "js/games/rocket.js",
  "js/games/cafe.js",
  "js/games/scales.js",
  "js/games/symmetry.js",
  "js/games/bear.js",
  "js/games/bubbles.js",
  "js/games/dice.js",
  "js/games/fractions.js",
  "js/games/machine.js",
  "js/games/myday.js",
  "js/games/race.js",
  "js/games/sorting.js",
  "js/games/tenbridge.js",
  "js/games/words.js",
];

// Up to 3.1 the clips lived in the app cache: move them across before that cache is deleted.
async function keepOldVoice() {
  const voice = await caches.open(VOICE);
  const have = new Set((await voice.keys()).map((r) => r.url));
  for (const name of await caches.keys()) {
    if (name === CACHE || !APP_CACHE.test(name)) continue;
    const old = await caches.open(name);
    const clips = (await old.keys()).filter((r) => r.url.endsWith(".mp3") && !have.has(r.url));
    for (let i = 0; i < clips.length; i += 50) {
      await Promise.all(clips.slice(i, i + 50).map(async (r) => {
        const res = await old.match(r);
        if (res) await voice.put(r.url, res);
      }));
    }
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" }))); // not the 10-minute HTTP cache
    await keepOldVoice();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && APP_CACHE.test(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const clip = new URL(req.url).pathname.endsWith(".mp3");
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: "no-cache", signal: req.signal });
      if (res.ok && !clip) {
        const copy = res.clone();
        e.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {}));
      }
      if (res.ok || !clip) return res;
    } catch {} // offline: use the saved copy
    const cache = await caches.open(clip ? VOICE : CACHE);
    return (await cache.match(req, { ignoreSearch: !clip })) || (clip && (await caches.match(req))) || Response.error();
  })());
});
