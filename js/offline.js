// Number Garden: saves the voice for offline play, in its own cache that outlives app updates.
// Runs in the page, not the service worker's install, which browsers stop after a few minutes.
// Only fetches clips that are new or re-recorded (audio/cori/hashes.json), resumes where it stopped,
// and never removes a saved clip until its replacement has arrived.
"use strict";

(function offlineVoice() {
  if (!("serviceWorker" in navigator) || !window.caches || !window.crypto?.subtle) return;
  if (/[?&]selftest/.test(location.search)) return;

  const VOICE = "number-garden-voice"; // same name as in sw.js
  const urlOf = (file) => new URL(CLIP_BASE + file, location.href).href;
  const SAVED = urlOf("saved.json"); // which version of each clip is saved
  const WAITS = [3, 10, 30, 60]; // seconds between retries
  let wake = () => {};

  async function hashOf(bytes) {
    const sum = new Uint8Array(await crypto.subtle.digest("SHA-1", bytes));
    return [...sum].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
  }

  async function download(url) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const res = await fetch(url, { cache: "no-cache", signal: ctl.signal });
      return res.ok ? await res.arrayBuffer() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // True when every clip is saved and current.
  async function sync() {
    const list = await download(urlOf("hashes.json"));
    if (!list) return false;
    const want = JSON.parse(new TextDecoder().decode(list));
    const cache = await caches.open(VOICE);
    const have = new Set((await cache.keys()).map((r) => r.url));
    const saved = await (await cache.match(SAVED))?.json() || {};
    const todo = Object.keys(want).filter((f) => saved[f] !== want[f] || !have.has(urlOf(f)));
    const record = () => cache.put(SAVED, new Response(JSON.stringify(saved), { headers: { "Content-Type": "application/json" } }));
    let next = 0, done = 0;

    async function worker() {
      while (next < todo.length) {
        const file = todo[next++], url = urlOf(file);
        try {
          // A copy may already be here: from an older version's cache, or from a download that was cut short.
          const old = await cache.match(url) || await caches.match(url);
          let bytes = old && await old.arrayBuffer();
          if (!bytes || await hashOf(bytes) !== want[file]) {
            bytes = await download(url);
            if (!bytes || await hashOf(bytes) !== want[file]) continue; // failed or out of date: try again later
          }
          await cache.put(url, new Response(bytes, { headers: { "Content-Type": "audio/mpeg" } }));
          saved[file] = want[file];
          if (++done % 200 === 0) await record();
        } catch {} // retried on the next pass
      }
    }
    await Promise.all(Array.from({ length: 24 }, worker));
    if (done) await record();
    if (done < todo.length) return false;

    const keep = new Set([SAVED, ...Object.keys(want).map(urlOf)]);
    for (const url of have) if (!keep.has(url)) await cache.delete(url);
    return true;
  }

  async function run() {
    await navigator.serviceWorker.ready;
    for (let tries = 0; ; tries++) {
      try { if (await sync()) return; } catch {}
      await new Promise((resolve) => {
        wake = resolve;
        setTimeout(resolve, WAITS[Math.min(tries, WAITS.length - 1)] * 1000);
      });
    }
  }

  addEventListener("online", () => wake());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });
  addEventListener("load", () => setTimeout(run, 1000));
})();
