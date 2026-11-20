// Number Garden — boot: wire the chrome, restore progress, route, register the offline cache.
"use strict";

$("say").addEventListener("click", () => say(spokenInstruction));
$("homeBtn").addEventListener("click", () => { click(false); location.hash = ""; });
// Tap the speaker: sound on/off. Press and hold it for a second (grown-ups): settings.
// iPad Safari fires pointercancel/pointerleave once a press turns into a system gesture, so the hold
// is measured from pointerdown to the finger lifting (pointerup or touchend), with a timer as backup.
const HOLD_MS = 1000;
const soundBtn = $("soundBtn");
let downAt = 0, holdTimer = 0, held = false;
function startHold() {
  downAt = performance.now(); held = false;
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { if (downAt) { held = true; downAt = 0; openGrownups(); } }, HOLD_MS);
}
function endHold() {
  clearTimeout(holdTimer);
  if (downAt && performance.now() - downAt >= HOLD_MS) { held = true; openGrownups(); }
  downAt = 0;
}
soundBtn.addEventListener("pointerdown", startHold);
soundBtn.addEventListener("pointerup", endHold);
soundBtn.addEventListener("touchend", endHold);
soundBtn.addEventListener("contextmenu", (e) => e.preventDefault());
soundBtn.addEventListener("click", () => {
  if (held) { held = false; return; }
  S.sound = !S.sound; save(); renderControls();
  if (!S.sound) { try { speechSynthesis.cancel(); } catch {} } else chime(2);
});

function closeSheets() { document.querySelectorAll(".sheet").forEach((s) => s.remove()); }
function sheet(inner) {
  closeSheets();
  const el = h(`<div class="sheet" role="dialog" aria-modal="true"><div class="panel">${inner}</div></div>`);
  const openedAt = performance.now();
  // Ignore the tap that lands when the finger lifts after a hold-to-open.
  el.addEventListener("click", (e) => { if (e.target === el && performance.now() - openedAt > 700) el.remove(); });
  document.body.append(el);
  return el;
}

// Grown-ups gate: tap three digits that are written as words (too hard for a 5–6 year old to read).
const DIGIT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
function openGrownups() {
  if (document.querySelector(".sheet")) return;
  const code = Array.from({ length: 3 }, () => rand(1, 9));
  const el = sheet(`
    <h2>Grown-ups only</h2>
    <p class="note">To open settings, tap these numbers: <b>${code.map((d) => DIGIT_WORDS[d]).join(", ")}</b></p>
    <div class="entered" aria-live="polite"><i></i><i></i><i></i></div>
    <div class="keypad">${Array.from({ length: 9 }, (_, i) => `<button data-d="${i + 1}">${i + 1}</button>`).join("")}</div>
    <button class="soft cancel">Cancel</button>
    <p class="note version">Number Garden ${APP_VERSION}</p>`);
  const typed = [];
  const dots = el.querySelectorAll(".entered i");
  el.querySelector(".keypad").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]");
    if (!b) return;
    typed.push(+b.dataset.d); click();
    dots[typed.length - 1]?.classList.add("on");
    if (typed.length < 3) return;
    if (typed.every((d, i) => d === code[i])) openVoicePicker();
    else { boing(); el.remove(); }
  });
  el.querySelector(".cancel").onclick = () => el.remove();
}

function openVoicePicker() {
  loadVoices();
  const el = sheet(`
      <h2>Choose a voice</h2>
      <p class="note">Tap a voice to hear it. Best are <b>Enhanced</b> or <b>Premium</b> voices. On an iPad you can download them in
        Settings → Accessibility → Spoken Content → Voices → English, then reopen this list.</p>
      <div class="voice-list"></div>
      <button class="check done">Done</button>
      <p class="note version">Number Garden ${APP_VERSION}</p>`);
  const list = el.querySelector(".voice-list");
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
  el.querySelector(".done").onclick = () => el.remove();
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
