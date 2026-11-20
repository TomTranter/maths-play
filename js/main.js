// Number Garden — boot: wire the chrome, restore progress, route, register the offline cache.
"use strict";

$("say").addEventListener("click", () => say(spokenInstruction));
$("homeBtn").addEventListener("click", () => { click(false); location.hash = ""; });
// Tap the speaker: sound on/off. Press and hold it (grown-ups): choose the voice.
let holdTimer = 0, held = false;
const soundBtn = $("soundBtn");
soundBtn.addEventListener("pointerdown", () => {
  held = false;
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { held = true; openVoicePicker(); }, 1500);
});
for (const ev of ["pointerup", "pointerleave", "pointercancel"]) soundBtn.addEventListener(ev, () => clearTimeout(holdTimer));
soundBtn.addEventListener("contextmenu", (e) => e.preventDefault());
soundBtn.addEventListener("click", () => {
  if (held) { held = false; return; }
  S.sound = !S.sound; save(); renderControls();
  if (!S.sound) { try { speechSynthesis.cancel(); } catch {} } else chime(2);
});

function openVoicePicker() {
  loadVoices();
  const sheet = h(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="voiceTitle">
    <div class="panel">
      <h2 id="voiceTitle">Choose a voice</h2>
      <p class="note">Tap a voice to hear it. Best are <b>Enhanced</b> or <b>Premium</b> voices. On an iPad you can download them in
        Settings → Accessibility → Spoken Content → Voices → English, then reopen this list.</p>
      <div class="voice-list"></div>
      <button class="check done">Done</button>
    </div>
  </div>`);
  const list = sheet.querySelector(".voice-list");
  const current = pickVoice();
  const opts = goodVoices();
  if (!opts.length) list.append(h('<p class="note">No English voices found on this device.</p>'));
  for (const v of opts) {
    const b = h('<button class="voice"><span></span><small></small></button>');
    b.querySelector("span").textContent = v.name;
    b.querySelector("small").textContent = v.lang.replace("_", "-");
    if (current && v.name === current.name) b.classList.add("on");
    b.onclick = () => {
      S.voice = v.name; S.sound = true; save(); renderControls();
      list.querySelectorAll(".voice").forEach((x) => x.classList.toggle("on", x === b));
      say("Hello! Pop the smallest number first!");
    };
    list.append(b);
  }
  sheet.querySelector(".done").onclick = () => sheet.remove();
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.remove(); });
  document.body.append(sheet);
}
addEventListener("hashchange", show);

(function start() {
  const saved = loadState();
  S.score = +saved.score || 0;
  S.sound = saved.sound !== false;
  S.mode = saved.mode === "down" ? "down" : "up";
  S.prog = saved.prog && typeof saved.prog === "object" ? saved.prog : {};
  S.voice = typeof saved.voice === "string" ? saved.voice : "";
  show();
})();

// Offline support. Only works over http(s); opening index.html as a file still plays, just not offline-cached.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
