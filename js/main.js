// Number Garden — boot: wire the chrome, restore progress, route, register the offline cache.
"use strict";

$("say").addEventListener("click", () => say(spokenInstruction));
$("homeBtn").addEventListener("click", () => { click(false); location.hash = ""; });
$("soundBtn").addEventListener("click", () => {
  S.sound = !S.sound; save(); renderControls();
  if (!S.sound) { try { speechSynthesis.cancel(); } catch {} } else chime(2);
});
addEventListener("hashchange", show);

(function start() {
  const saved = loadState();
  S.score = +saved.score || 0;
  S.sound = saved.sound !== false;
  S.mode = saved.mode === "down" ? "down" : "up";
  S.prog = saved.prog && typeof saved.prog === "object" ? saved.prog : {};
  show();
})();

// Offline support. Only works over http(s); opening index.html as a file still plays, just not offline-cached.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
