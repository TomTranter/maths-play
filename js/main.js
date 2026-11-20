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
  let showAll = false;
  const el = sheet(`
      <h2>Choose a voice</h2>
      <p class="note">Tap a voice to hear it. <b>${RECORDED_NAME}</b> is recorded into the app, so she sounds the same on every
        device and works offline. The others are this device's own voices.</p>
      <div class="voice-list"></div>
      <button class="soft show-all">Show all voices</button>
      <button class="check done">Done</button>
      <p class="note version">Number Garden ${APP_VERSION} · <span class="count"></span></p>
      <p class="note version">${RECORDED_NAME} voice made with Piper from public-domain LibriVox recordings.</p>`);
  const list = el.querySelector(".voice-list");
  const LANG = { "en-GB": "UK", "en-US": "US", "en-AU": "Australia", "en-IE": "Ireland", "en-IN": "India", "en-ZA": "South Africa", "en-NZ": "New Zealand" };
  function render() {
    loadVoices();
    const current = pickVoice();
    // "Show all" lists every voice the device reports, including joke and non-English voices.
    const opts = showAll ? [...allVoices].sort((a, b) => voiceScore(b) - voiceScore(a)) : goodVoices();
    el.querySelector(".count").textContent = `${allVoices.length} voices on this device, ${voices.length} English`;
    list.replaceChildren();
    const sample = () => say("Hello! Pop the smallest number first!");
    const rec = h('<button class="voice"><span></span><small>Recorded · UK · works offline</small></button>');
    rec.querySelector("span").textContent = RECORDED_NAME;
    rec.classList.toggle("on", useRecorded());
    rec.onclick = () => {
      S.voice = RECORDED_VOICE; S.sound = true; save(); renderControls();
      list.querySelectorAll(".voice").forEach((x) => x.classList.toggle("on", x === rec));
      sample();
    };
    list.append(rec);
    for (const v of opts) {
      const b = h('<button class="voice"><span></span><small></small></button>');
      const q = voiceQuality(v), lang = (v.lang || "").replace("_", "-");
      b.querySelector("span").textContent = v.name + (q && q !== "novelty" && !v.name.includes(q) ? ` (${q})` : "");
      b.querySelector("small").textContent = [LANG[lang] || lang, q === "novelty" ? "joke voice" : ""].filter(Boolean).join(" · ");
      if (!useRecorded() && current && voiceKey(v) === voiceKey(current)) b.classList.add("on");
      b.onclick = () => {
        S.voice = voiceKey(v); S.sound = true; save(); renderControls();
        list.querySelectorAll(".voice").forEach((x) => x.classList.toggle("on", x === b));
        sample();
      };
      list.append(b);
    }
  }
  render();
  // Voices can arrive late (or change after a download); refresh while the panel is open.
  const onChange = () => { if (el.isConnected) render(); };
  speechSynthesis?.addEventListener?.("voiceschanged", onChange);
  el.querySelector(".show-all").onclick = (e) => {
    showAll = !showAll;
    e.currentTarget.textContent = showAll ? "Show best voices only" : "Show all voices";
    render();
  };
  el.querySelector(".done").onclick = () => { speechSynthesis?.removeEventListener?.("voiceschanged", onChange); el.remove(); };
}
addEventListener("hashchange", show);

(function start() {
  const saved = loadState();
  S.score = +saved.score || 0;
  S.sound = saved.sound !== false;
  S.mode = saved.mode === "down" ? "down" : "up";
  S.prog = saved.prog && typeof saved.prog === "object" ? saved.prog : {};
  S.voice = typeof saved.voice === "string" ? saved.voice : "";
  if (saved.voiceV !== 3) S.voice = ""; // v1.8: switch everyone to the recorded Cori voice once
  S.voiceV = 3;
  save();
  show();
})();

// Offline support. Only works over http(s); opening index.html as a file still plays, just not offline-cached.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
