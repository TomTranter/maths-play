// Number Garden — shared engine: storage, sound, speech, effects, task plumbing, chrome.
// Classic script (not a module) so the app also runs from file://. Top-level let/const here
// are shared with the game scripts that load after it.
"use strict";

const APP_VERSION = "2.3"; // shown in the grown-ups panel, to check a tablet has the latest update
const STORE_KEY = "balloon-pop-maths"; // original key, so existing scores carry over
const ROUNDS_PER_LEVEL = 4;
const COLORS = [
  { base: "#ff4d6d", dark: "#a8123a" },
  { base: "#ff9f1c", dark: "#a85a00" },
  { base: "#f5c400", dark: "#8a6a00" },
  { base: "#2ec27e", dark: "#0f6b40" },
  { base: "#3aa6e8", dark: "#13558a" },
  { base: "#9b5de5", dark: "#52248f" },
  { base: "#f15bb5", dark: "#8f1762" },
];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GAMES = {}; // id -> game; insertion order is the home-screen order

const $ = (id) => document.getElementById(id);
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const pick = (arr) => arr[rand(0, arr.length - 1)];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let S = { score: 0, sound: true, mode: "up", prog: {} };
const prog = (id) => (S.prog[id] ||= { level: 0, rounds: 0 });
function loadState() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch {} }

/* ================= sound ================= */
let ac = null;
function audio() {
  if (!S.sound) return null;
  try {
    if (!ac) {
      // iPad: let the game's sound play even when the silent switch is on (Safari 16.4+).
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
      ac = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ac.state === "suspended") ac.resume();
  } catch { ac = null; }
  return ac;
}
function tone(freq, start, dur, { type = "sine", vol = 0.18, to = null } = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function popSound() {
  const a = audio(); if (!a) return;
  const len = Math.floor(a.sampleRate * 0.09);
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = "bandpass"; f.frequency.value = 1800; g.gain.value = 0.9;
  src.connect(f).connect(g).connect(a.destination); src.start();
  tone(520, 0, 0.08, { type: "triangle", vol: 0.15, to: 140 });
}
const NOTES = [523.25, 659.25, 783.99, 1046.5];
const chime = (step) => tone(NOTES[step % 4], 0.05, 0.3, { type: "triangle", vol: 0.16 });
const click = (up = true) => tone(up ? 880 : 600, 0, 0.06, { type: "triangle", vol: 0.12, to: up ? 1200 : 400 });
const coinSound = () => { tone(1568, 0, 0.12, { type: "square", vol: 0.06 }); tone(2093, 0.07, 0.25, { type: "square", vol: 0.05 }); };
function boing() { tone(260, 0, 0.18, { vol: 0.2, to: 150 }); tone(200, 0.16, 0.22, { vol: 0.16, to: 120 }); }
function fanfare() { NOTES.forEach((n, i) => tone(n, i * 0.11, i === 3 ? 0.5 : 0.18, { type: "triangle", vol: 0.16 })); }

/* ================= speech ================= */
// Voice choice: a grown-up can pick one (S.voice); otherwise take the best English voice on the device.
// Apple ships joke voices (Albert, Bubbles, Zarvox…) that must never be picked automatically.
// Includes Apple's robotic "Eloquence" voices (Eddy, Flo, Reed, Rocko, Sandy, Shelley, Grandma, Grandpa).
const NOVELTY_VOICES = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i;
// On iPad a downloaded Premium/Enhanced voice can share its name with the basic one ("Daniel" twice),
// so voices are identified by voiceURI (e.g. com.apple.voice.premium.en-GB.Serena), which also tells the quality.
let voices = [];      // English voices
let allVoices = [];   // everything the device reports (for the "show all" list)
function loadVoices() {
  try { allVoices = speechSynthesis.getVoices(); } catch { allVoices = []; }
  voices = allVoices.filter((v) => /^en($|[-_])/i.test(v.lang || ""));
}
if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}
const voiceKey = (v) => v.voiceURI || v.name;
const voiceId = (v) => `${v.voiceURI || ""} ${v.name}`;
function voiceQuality(v) {
  const id = voiceId(v);
  if (NOVELTY_VOICES.test(v.name) || /speech\.synthesis\.voice|eloquence/i.test(id)) return "novelty";
  if (/premium/i.test(id)) return "Premium";
  if (/enhanced|neural|natural/i.test(id)) return "Enhanced";
  return "";
}
const isNovelty = (v) => voiceQuality(v) === "novelty";
function voiceScore(v) {
  const q = voiceQuality(v);
  if (q === "novelty") return -100;
  let s = 0;
  if (/en[-_]GB/i.test(v.lang)) s += 10;
  else if (/en[-_](IE|AU|NZ)/i.test(v.lang)) s += 4;
  if (q === "Premium") s += 8;
  else if (q === "Enhanced") s += 6;
  if (/google/i.test(v.name)) s += 2;
  if (v.localService) s += 1;
  return s;
}
const goodVoices = () => voices.filter((v) => !isNovelty(v)).sort((a, b) => voiceScore(b) - voiceScore(a));
function pickVoice() {
  if (S.voice && !S.voice.startsWith("recorded:")) {
    const v = allVoices.find((x) => voiceKey(x) === S.voice) || allVoices.find((x) => x.name === S.voice);
    if (v) return v;
  }
  return goodVoices()[0] || null;
}

/* ---- recorded voice (Cori) ----
   The default voice is pre-recorded (tools/make_voice.py), because iPad Safari only gives web pages its
   basic voices. A line is split into sentences on . ! ? and each sentence is looked up whole, so it keeps
   its natural rhythm. A sentence without a whole clip is pieced together from fragments (numbers "34",
   pence "34p", "5s", and runs of words matched longest-first). If even that fails, the whole line falls
   back to the device voice. */
const RECORDED_VOICE = "recorded:cori";
const RECORDED_NAME = "Cori";
const CLIP_BASE = "audio/cori/";
let clipMap = null;
fetch(CLIP_BASE + "manifest.json").then((r) => r.json()).then((m) => { clipMap = m; }).catch(() => {});
const useRecorded = () => !S.voice || S.voice.startsWith("recorded:");

// Clip key for a sentence or fragment; must match key() in tools/make_voice.py.
const clipKey = (s) => (s.toLowerCase().replace(/’/g, "'").replace(/&/g, " and ").match(/\d+[ps]?|[a-z']+/g) || []).join(" ");

function toClips(text) {
  if (!clipMap) return null;
  const seq = [];
  for (const sentence of text.match(/[^.!?]+[.!?]*/g) || []) {
    const k = clipKey(sentence);
    if (!k) continue;
    if (clipMap[k]) seq.push({ file: clipMap[k] });
    else {
      const parts = fragmentClips(sentence);
      if (!parts) return null;
      seq.push(...parts);
    }
    seq.push({ pause: 0.3 });
  }
  while (seq.length && seq.at(-1).pause) seq.pop(); // no dead air at the end of a line
  return seq.length ? seq : null;
}

// Safety net: build one sentence from phrase and number clips.
function fragmentClips(sentence) {
  const t = sentence.toLowerCase().replace(/’/g, "'").replace(/&/g, " and ").replace(/([a-z']),\s+(?=[a-z])/g, "$1 ");
  const toks = t.match(/\d+[ps]?|[a-z']+|,/g) || [];
  const seq = [];
  let i = 0;
  while (i < toks.length) {
    const tk = toks[i];
    if (tk === ",") { seq.push({ pause: 0.12 }); i++; continue; }
    if (/^\d/.test(tk)) {
      const f = clipMap[tk];
      if (!f) return null;
      seq.push({ file: f }); i++; continue;
    }
    let j = i;
    while (j < toks.length && /^[a-z']+$/.test(toks[j])) j++;
    let e = j;
    for (; e > i; e--) {
      const f = clipMap[toks.slice(i, e).join(" ")];
      if (f) { seq.push({ file: f }); break; }
    }
    if (e === i) return null;
    i = e;
  }
  return seq;
}

const clipBuffers = new Map(); // file -> Promise<AudioBuffer>; capped so a long session doesn't hoard memory
function loadClip(a, file) {
  if (!clipBuffers.has(file)) {
    if (clipBuffers.size > 160) clipBuffers.delete(clipBuffers.keys().next().value);
    const p = fetch(CLIP_BASE + file)
      .then((r) => r.arrayBuffer())
      .then((b) => new Promise((ok, fail) => a.decodeAudioData(b, ok, fail)));
    p.catch(() => clipBuffers.delete(file));
    clipBuffers.set(file, p);
  }
  return clipBuffers.get(file);
}

let clipRun = null; // the line currently playing: { sources, finish }
function stopClips() {
  if (!clipRun) return;
  const run = clipRun; clipRun = null;
  run.sources.forEach((s) => { try { s.stop(); } catch {} });
  run.finish();
}
// Plays a clip sequence; resolves true when finished or cut off, false if it couldn't play at all.
async function playClips(seq) {
  const a = audio();
  if (!a) return false;
  stopClips();
  let finish;
  const done = new Promise((r) => (finish = r));
  const run = { sources: [], finish: () => finish(true) };
  clipRun = run;
  let bufs;
  try { bufs = await Promise.all(seq.map((s) => (s.file ? loadClip(a, s.file) : null))); }
  catch { if (clipRun === run) clipRun = null; return false; }
  if (clipRun !== run) return true; // a newer line started while loading
  let t = a.currentTime + 0.04;
  seq.forEach((s, k) => {
    if (s.pause) { t += s.pause; return; }
    const src = a.createBufferSource();
    src.buffer = bufs[k];
    src.connect(a.destination);
    src.start(t);
    run.sources.push(src);
    t += bufs[k].duration + 0.035;
  });
  setTimeout(() => { if (clipRun === run) { clipRun = null; finish(true); } }, (t - a.currentTime) * 1000 + 30);
  return done;
}

// Speaks a line and resolves when it has finished (or was cut off by a newer line).
// Fallback timers cover browsers that never fire onend or block speech entirely.
let currentUtterance = null; // held so Chrome doesn't garbage-collect it and drop onend
function say(text, delay = 0) {
  return new Promise((resolve) => {
    if (!text || !S.sound) return resolve();
    setTimeout(async () => {
      if (useRecorded()) {
        const seq = toClips(text);
        if (seq) {
          try { speechSynthesis.cancel(); } catch {}
          if (await playClips(seq)) return resolve();
        }
      }
      stopClips();
      if (!("speechSynthesis" in window)) return resolve();
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-GB";
        try { const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } } catch {} // never lose speech over a voice
        u.rate = 0.92; u.pitch = 1; // raised pitch sounds robotic on iPad voices
        u.onend = finish; u.onerror = finish;
        currentUtterance = u;
        speechSynthesis.speak(u);
        setTimeout(() => { if (!speechSynthesis.speaking && !speechSynthesis.pending) finish(); }, 1200);
        setTimeout(finish, 3000 + text.length * 150);
      } catch { finish(); }
    }, delay);
  });
}

/* ================= effects ================= */
const cv = $("fx"), cx = cv.getContext("2d");
let parts = [], raf = 0;
function sizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", sizeCanvas); sizeCanvas();
function tick() {
  cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
    cx.globalAlpha = Math.min(1, p.life / 20);
    cx.fillStyle = p.color;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
    if (p.rect) cx.fillRect(-p.s, -p.s / 2, p.s * 2, p.s); else { cx.beginPath(); cx.arc(0, 0, p.s, 0, 7); cx.fill(); }
    cx.restore();
  }
  cx.globalAlpha = 1;
  raf = parts.length ? requestAnimationFrame(tick) : 0;
}
const runFx = () => { if (!raf) raf = requestAnimationFrame(tick); };
function burst(x, y, color) {
  const n = reduced ? 6 : 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, sp = 4 + Math.random() * 5;
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.25, s: 4 + Math.random() * 6, rect: i % 2 === 0, rot: a, vr: 0.2, life: 40, color });
  }
  runFx();
}
function confetti() {
  const n = reduced ? 30 : 140, cols = COLORS.map((c) => c.base).concat("#ffd23f", "#ffffff");
  for (let i = 0; i < n; i++) {
    parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.4, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, g: 0.06, s: 5 + Math.random() * 5, rect: true, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 150 + Math.random() * 60, color: cols[i % cols.length] });
  }
  runFx();
}
function floatText(cls, text, x, y) {
  const el = document.createElement("div");
  el.className = cls; el.textContent = text; document.body.appendChild(el);
  const w = el.offsetWidth, hh = el.offsetHeight;
  el.animate(
    [{ transform: `translate(${x - w / 2}px, ${y - hh / 2}px) scale(.6)`, opacity: 1 },
     { transform: `translate(${x - w / 2}px, ${y - hh / 2 - 80}px) scale(1.2)`, opacity: 0 }],
    { duration: 900, easing: "ease-out" }
  ).onfinish = () => el.remove();
}
function banner(text, ms = 1500) {
  document.querySelectorAll(".banner").forEach((b) => b.remove());
  const el = document.createElement("div");
  el.className = "banner"; el.textContent = text; document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}
function shakeEl(el) {
  if (reduced || !el) return;
  el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(-6px)" }, { transform: "translateX(0)" }], { duration: 350 });
}
function bumpScore(by) {
  S.score += by; save(); $("score").textContent = S.score;
  const b = $("scoreBox"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
}

/* ================= task plumbing ================= */
let route = "";
let gen = 0;          // bumps on every new task or screen; stale timers check it
let busy = false;
let task = null;
let spokenInstruction = "";
const later = (fn, ms) => { const g = gen; setTimeout(() => { if (g === gen) fn(); }, ms); };
function newTask(fields) { gen++; busy = false; task = { mistakes: 0, ...fields }; return task; }
const level = (game) => game.levels[prog(game.id).level];

function setInstruction(html, spoken, speak = true) {
  $("say").hidden = false;
  $("sayText").innerHTML = html;
  spokenInstruction = spoken;
  if (speak) say(spoken, 250);
}

function advance() {
  const g = GAMES[route], p = prog(route);
  p.rounds++;
  let up = false;
  if (p.rounds >= ROUNDS_PER_LEVEL) {
    p.rounds = 0;
    if (p.level < g.levels.length - 1) { p.level++; up = true; }
  }
  save(); renderControls();
  return up;
}

// Moves on only once the line has been fully spoken and a minimum celebration time has passed.
function afterSpeech(speech, minMs, fn) {
  const g = gen;
  Promise.all([speech.then(() => wait(400)), wait(minMs)]).then(() => { if (g === gen) fn(); });
}

// Varied praise for a right answer (each is a recorded clip in tools/make_voice.py PHRASES).
const PRAISE = ["Yes!", "Well done!", "Brilliant!", "Great job!", "That's right!", "Fantastic!", "Spot on!"];
let lastPraise = "";
function praise() {
  let p;
  do { p = pick(PRAISE); } while (p === lastPraise);
  return (lastPraise = p);
}

function win(el, text, spoken) {
  busy = true;
  const pts = task.mistakes === 0 ? 2 : 1;
  const r = el.getBoundingClientRect();
  floatText("plus", "+" + pts, r.left + r.width / 2, r.top);
  bumpScore(pts); fanfare(); confetti();
  task.onWin?.();
  // Games write "Yes! …"; swap the opener for a random praise in both the banner and the voice.
  const p = praise();
  text = text.replace(/^Yes!/, p);
  spoken = spoken.replace(/^(Yes|Brilliant)!/, p);
  const up = advance();
  const lvl = GAMES[route].levels[prog(route).level].label;
  banner(up ? "Level up!" : text, 1600);
  afterSpeech(say(up ? `${spoken}. Level up! ${lvl}.` : spoken, 150), up ? 2600 : 2000, () => GAMES[route].next());
}
function miss(text) { task.mistakes++; boing(); say(text); }

function distractors(n, lo, hi, deltas, first = []) {
  const out = [];
  for (const v of [...first, ...shuffle(deltas.map((d) => n + d))]) {
    if (v >= lo && v <= hi && v !== n && !out.includes(v)) out.push(v);
    if (out.length === 2) break;
  }
  return out;
}
// Three big answer buttons on the grass. `fmt` turns a value into its label.
function choices(answer, wrongs, wrongSay, winText, winSay, { fmt = String, wide = false } = {}) {
  const g = $("ground"); g.innerHTML = "";
  shuffle([answer, ...wrongs]).forEach((n) => {
    const b = h(`<button class="choice${wide ? " wide" : ""}"></button>`);
    b.textContent = fmt(n);
    b.onclick = () => {
      if (busy) return;
      if (n === answer) win(b, winText, winSay);
      else { b.disabled = true; shakeEl(b); miss(wrongSay); }
    };
    g.append(b);
  });
}
const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function checkRow(onCheck, onClear) {
  const g = $("ground"); g.innerHTML = "";
  if (onClear) {
    const c = h('<button class="soft">Clear</button>');
    c.onclick = () => { if (!busy) { click(false); onClear(); } };
    g.append(c);
  }
  const b = h(`<button class="check">${TICK}Check</button>`);
  b.onclick = () => { if (!busy) onCheck(b); };
  g.append(b);
}
const moreOrLess = (have, want) => (have < want ? "Not quite. You need more." : "Too many! Take some away.");

/* ================= chrome + routing ================= */
const SPEAKER_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#1d3557"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="#1d3557" stroke-width="2" stroke-linecap="round"/></svg>';
const SPEAKER_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#1d3557"/><path d="M16 9l6 6M22 9l-6 6" stroke="#d6336c" stroke-width="2.4" stroke-linecap="round"/></svg>';

function renderControls() {
  $("score").textContent = S.score;
  $("soundBtn").innerHTML = S.sound ? SPEAKER_ON : SPEAKER_OFF;
  const c = $("controls"); c.replaceChildren();
  const g = GAMES[route];
  if (!g) return;
  const p = prog(g.id);
  if (p.level >= g.levels.length) p.level = 0;
  const dots = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) => `<i class="${i < p.rounds ? "on" : ""}"></i>`).join("");
  const chip = h(`<button class="chip" aria-label="Choose a level"><span class="chip-lvl">Level ${p.level + 1}</span><span>${g.levels[p.level].label}</span><span class="dots">${dots}</span></button>`);
  chip.onclick = () => { click(); openLevelPicker(g); }; // defined in main.js
  c.append(chip);
  g.extraControls?.(c);
}

function showHome() {
  $("homeBtn").hidden = true;
  $("say").hidden = true;
  const grown = h('<button class="soft grownups">Grown-ups</button>');
  grown.onclick = () => openGrownups(); // defined in main.js
  $("ground").replaceChildren(grown);
  const home = h(`<div class="home"><h1>Number Garden</h1><div class="tiles"></div></div>`);
  for (const g of Object.values(GAMES)) {
    const t = h(`<button class="tile">${g.art}<span></span><small></small></button>`);
    t.querySelector("span").textContent = g.name;
    t.querySelector("small").textContent = g.strand;
    t.onclick = () => { audio(); click(); location.hash = g.id; };
    home.querySelector(".tiles").append(t);
  }
  $("stage").replaceChildren(home);
}

function show() {
  gen++; busy = false; task = null;
  try { speechSynthesis.cancel(); } catch {}
  const id = location.hash.slice(1);
  route = GAMES[id] ? id : "";
  renderControls();
  if (!route) { showHome(); return; }
  $("homeBtn").hidden = false;
  GAMES[route].next(true);
}
