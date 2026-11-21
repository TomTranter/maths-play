// My Day — ordering the events of a day. NC Y1: sequence events in chronological order using language
// (for example, before and after, next, first, today, morning, afternoon and evening).
"use strict";

// One school day, in order. `verb` is used in sentences ("We have breakfast."); `when` is the part of the day
// (lunch is left out of the morning/afternoon/evening question because it is in the middle of the day).
const MYDAY_SKY = '<rect x="0" y="0" width="100" height="80" fill="#d4f0ff"/>';
const MYDAY_EVENTS = [
  { label: "Wake up", verb: "wake up", when: "morning",
    svg: `${MYDAY_SKY}<rect x="62" y="8" width="30" height="26" fill="#fff0b3" stroke="#1d3557" stroke-width="2.5"/><circle cx="77" cy="30" r="8" fill="#ffd23f"/><path d="M77 8 V34 M62 21 H92" stroke="#1d3557" stroke-width="2"/>
      <rect x="6" y="44" width="72" height="20" rx="3" fill="#3aa6e8" stroke="#1d3557" stroke-width="2.5"/><rect x="6" y="34" width="8" height="38" rx="2" fill="#b07a43" stroke="#1d3557" stroke-width="2"/>
      <path d="M26 44 V34 q0 -6 8 -6 h4 q8 0 8 6 V44" fill="#ff4d6d" stroke="#1d3557" stroke-width="2.5"/><circle cx="36" cy="20" r="9" fill="#f4c29c" stroke="#1d3557" stroke-width="2.5"/>
      <circle cx="33" cy="19" r="1.6" fill="#1d3557"/><circle cx="39" cy="19" r="1.6" fill="#1d3557"/><path d="M30 31 l-6 -8 M42 31 l6 -8" stroke="#f4c29c" stroke-width="4" stroke-linecap="round"/>` },
  { label: "Breakfast", verb: "have breakfast", when: "morning",
    svg: `${MYDAY_SKY}<rect x="0" y="56" width="100" height="24" fill="#b07a43"/><path d="M14 46 h46 q-2 18 -23 18 q-21 0 -23 -18 z" fill="#fff" stroke="#1d3557" stroke-width="2.5"/>
      <ellipse cx="37" cy="46" rx="23" ry="5" fill="#ffd23f" stroke="#1d3557" stroke-width="2"/><path d="M50 44 l18 -22" stroke="#9aa7b5" stroke-width="4" stroke-linecap="round"/>
      <path d="M70 30 h18 l-3 32 h-12 z" fill="#ff9f1c" stroke="#1d3557" stroke-width="2.5"/><path d="M71 38 h16" stroke="#fff" stroke-width="2" opacity=".6"/>` },
  { label: "Go to school", verb: "go to school", when: "morning",
    svg: `${MYDAY_SKY}<rect x="0" y="66" width="100" height="14" fill="#6cc24a"/><path d="M14 34 L50 12 L86 34 Z" fill="#d6336c" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="18" y="34" width="64" height="34" fill="#fff0b3" stroke="#1d3557" stroke-width="2.5"/><rect x="43" y="48" width="14" height="20" fill="#3aa6e8" stroke="#1d3557" stroke-width="2"/>
      <rect x="24" y="40" width="12" height="10" fill="#d4f0ff" stroke="#1d3557" stroke-width="2"/><rect x="64" y="40" width="12" height="10" fill="#d4f0ff" stroke="#1d3557" stroke-width="2"/>
      <circle cx="50" cy="26" r="5" fill="#fff" stroke="#1d3557" stroke-width="2"/><path d="M50 26 v-3 M50 26 h2" stroke="#1d3557" stroke-width="1.5"/>` },
  { label: "Lunch", verb: "have lunch", when: null,
    svg: `${MYDAY_SKY}<rect x="0" y="56" width="100" height="24" fill="#b07a43"/><rect x="10" y="30" width="44" height="30" rx="5" fill="#2ec27e" stroke="#1d3557" stroke-width="2.5"/>
      <path d="M20 30 q12 -12 24 0" fill="none" stroke="#1d3557" stroke-width="3"/><path d="M58 58 L74 30 L90 58 Z" fill="#f5deb3" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M63 52 L74 34 L85 52" fill="none" stroke="#e0a800" stroke-width="3"/><circle cx="30" cy="46" r="6" fill="#e63946" stroke="#1d3557" stroke-width="2"/><path d="M30 40 v-4" stroke="#3f8f33" stroke-width="2.5"/>` },
  { label: "Go home", verb: "go home", when: "afternoon",
    svg: `${MYDAY_SKY}<circle cx="82" cy="14" r="8" fill="#ffd23f"/><rect x="0" y="64" width="100" height="16" fill="#6cc24a"/>
      <path d="M22 36 L46 16 L70 36 Z" fill="#e63946" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/><rect x="26" y="36" width="40" height="30" fill="#fff" stroke="#1d3557" stroke-width="2.5"/>
      <rect x="40" y="46" width="12" height="20" fill="#b07a43" stroke="#1d3557" stroke-width="2"/><rect x="30" y="42" width="8" height="8" fill="#d4f0ff" stroke="#1d3557" stroke-width="1.5"/>
      <path d="M46 66 L40 80 M52 66 L62 80" stroke="#e0a800" stroke-width="2.5"/>
      <circle cx="80" cy="44" r="6" fill="#f4c29c" stroke="#1d3557" stroke-width="2"/><path d="M80 50 v12 M80 62 l-4 8 M80 62 l4 8 M80 54 l-6 4" stroke="#1d3557" stroke-width="3" stroke-linecap="round"/><rect x="82" y="52" width="8" height="10" rx="2" fill="#3aa6e8" stroke="#1d3557" stroke-width="1.5"/>` },
  { label: "Play in the park", verb: "play in the park", when: "afternoon",
    svg: `${MYDAY_SKY}<circle cx="86" cy="14" r="8" fill="#ffd23f"/><rect x="0" y="64" width="100" height="16" fill="#6cc24a"/>
      <rect x="14" y="40" width="6" height="26" fill="#7a5128"/><circle cx="17" cy="32" r="14" fill="#2ec27e" stroke="#3f8f33" stroke-width="2"/>
      <path d="M40 66 L50 18 L82 18 L92 66" fill="none" stroke="#d6336c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M60 18 V46 M72 18 V46" stroke="#1d3557" stroke-width="2"/><rect x="56" y="46" width="20" height="5" rx="2" fill="#ffd23f" stroke="#1d3557" stroke-width="1.5"/>
      <circle cx="66" cy="36" r="5" fill="#f4c29c" stroke="#1d3557" stroke-width="2"/><path d="M66 41 v5" stroke="#1d3557" stroke-width="3"/>` },
  { label: "Dinner", verb: "have dinner", when: "evening",
    svg: `<rect x="0" y="0" width="100" height="80" fill="#ffd8a8"/><rect x="0" y="56" width="100" height="24" fill="#b07a43"/>
      <ellipse cx="50" cy="54" rx="30" ry="10" fill="#fff" stroke="#1d3557" stroke-width="2.5"/><ellipse cx="50" cy="52" rx="18" ry="5" fill="#ff9f1c"/>
      <circle cx="44" cy="50" r="4" fill="#2ec27e"/><circle cx="56" cy="50" r="3.5" fill="#2ec27e"/>
      <path d="M12 30 v26 M8 30 v10 q4 4 8 0 v-10" stroke="#9aa7b5" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M88 30 q-6 10 0 14 v12" stroke="#9aa7b5" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="80" cy="14" r="7" fill="#ff9f1c" opacity=".8"/>` },
  { label: "Bath", verb: "have a bath", when: "evening",
    svg: `<rect x="0" y="0" width="100" height="80" fill="#e3f6ff"/><path d="M10 40 h80 v10 q0 18 -20 18 h-40 q-20 0 -20 -18 z" fill="#fff" stroke="#1d3557" stroke-width="2.5"/>
      ${[[24, 38, 7], [36, 34, 8], [52, 36, 7], [66, 33, 8], [78, 37, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#3aa6e8" stroke-width="2"/>`).join("")}
      <path d="M20 68 v8 M80 68 v8" stroke="#1d3557" stroke-width="3"/><circle cx="58" cy="20" r="5" fill="#ffd23f" stroke="#1d3557" stroke-width="2"/><path d="M50 26 q8 6 16 0 l-2 -4 h-12 z" fill="#ffd23f" stroke="#1d3557" stroke-width="2"/><path d="M63 19 l4 1" stroke="#ff9f1c" stroke-width="2.5"/>` },
  { label: "Bedtime", verb: "go to bed", when: "evening",
    svg: `<rect x="0" y="0" width="100" height="80" fill="#1d3557"/><path d="M78 8 a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16z" fill="#ffd23f"/>
      ${[[20, 12], [44, 8], [60, 20], [32, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join("")}
      <rect x="8" y="48" width="84" height="18" rx="3" fill="#9b5de5" stroke="#fff" stroke-width="2"/><rect x="8" y="38" width="8" height="36" rx="2" fill="#b07a43"/>
      <ellipse cx="26" cy="46" rx="9" ry="5" fill="#fff"/><circle cx="28" cy="40" r="8" fill="#f4c29c" stroke="#fff" stroke-width="1.5"/>
      <path d="M24 40 q2 2 4 0 M30 40 q2 2 4 0" stroke="#1d3557" stroke-width="1.5" fill="none"/><text x="42" y="36" font-size="10" font-weight="800" fill="#fff" font-family="Baloo 2, sans-serif">z z</text>` },
];
const MYDAY_PERIODS = ["morning", "afternoon", "evening"];
const MYDAY_STEPS = ["first", "next", "last"];
const mydaySvg = (e) => `<svg viewBox="0 0 100 80" aria-hidden="true">${e.svg}</svg>`;
const mydayPeriodSvg = (p) => {
  if (p === "morning") return '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M2 32 H38" stroke="#4a9a32" stroke-width="3"/><path d="M8 32 a12 12 0 0 1 24 0 z" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/></svg>';
  if (p === "afternoon") return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="9" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/>' + Array.from({ length: 8 }, (_, i) => `<path d="M20 4 V8" stroke="#e0a800" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 45} 20 20)"/>`).join("") + "</svg>";
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M22 6 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22z" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/></svg>';
};
const mydayCap = (s) => s[0].toUpperCase() + s.slice(1);

const myday = {
  id: "myday", name: "My Day", strand: "Time: order of events",
  levels: [
    { label: "First, next, last", kind: "order" },
    { label: "Before and after", kind: "near" },
    { label: "Morning or evening", kind: "when" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[[6, 0, "#d4f0ff"], [44, 6, "#ffd8a8"], [82, 0, "#1d3557"]].map(([x, d, c]) => `<rect x="${x}" y="${22 + d}" width="32" height="44" rx="6" fill="${c}" stroke="#1d3557" stroke-width="3"/>`).join("")}
    <path d="M12 52 a10 10 0 0 1 20 0 z" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/>
    <ellipse cx="60" cy="54" rx="11" ry="4" fill="#fff" stroke="#1d3557" stroke-width="2"/><ellipse cx="60" cy="53" rx="6" ry="2" fill="#ff9f1c"/>
    <path d="M100 32 a8 8 0 1 0 6 12 a6 6 0 1 1 -6 -12z" fill="#ffd23f"/>
    ${["1", "2", "3"].map((n, i) => `<circle cx="${22 + i * 38}" cy="${74 + (i === 1 ? 4 : 0)}" r="8" fill="#ff4d6d" stroke="#1d3557" stroke-width="2"/><text x="${22 + i * 38}" y="${78 + (i === 1 ? 4 : 0)}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Baloo 2, sans-serif">${n}</text>`).join("")}
  </svg>`,

  css: `
    .myday-row { display: flex; align-items: center; justify-content: center; gap: clamp(8px, 2.5vw, 20px); width: 100%; }
    .myday-card {
      position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px;
      width: clamp(96px, 28vw, 200px); padding: 8px; border: 0; border-radius: 20px; background: var(--paper);
      box-shadow: 0 6px 0 var(--lift); font-family: inherit; color: var(--ink);
    }
    .myday-card svg { width: 100%; max-height: min(26vh, 160px); height: auto; border-radius: 12px; display: block; }
    .myday-card span { font-size: clamp(0.95rem, 3.8vw, 1.4rem); font-weight: 800; line-height: 1.1; text-align: center; min-height: 2.2em; display: grid; place-items: center; }
    button.myday-card { cursor: pointer; }
    .myday-card.myday-done { opacity: 0.45; }
    .myday-card b {
      position: absolute; top: -10px; left: -6px; background: var(--pink); color: var(--paper); border-radius: 999px;
      padding: 2px 10px; font-size: clamp(0.9rem, 3.4vw, 1.2rem);
    }
    .myday-q {
      display: grid; place-items: center; width: clamp(96px, 28vw, 200px); aspect-ratio: 0.9; border-radius: 20px;
      border: 4px dashed var(--pink); background: var(--paper-soft); color: var(--pink);
      font-size: clamp(2.6rem, 10vw, 4.4rem); font-weight: 800;
    }
    .myday-arrow { font-size: clamp(2rem, 8vw, 3.4rem); font-weight: 800; color: var(--ink); line-height: 1; }
    .myday-one { width: clamp(150px, 46vw, 280px); }
    .myday-one svg { max-height: min(34vh, 220px); }
    .myday-slot {
      display: grid; justify-items: center; align-content: start; gap: 2px; width: clamp(92px, 27vw, 150px); min-height: 72px;
      padding: 6px 8px; border-radius: 18px; background: var(--paper-soft); border: 3px dashed var(--paper);
      font-size: clamp(0.85rem, 3.4vw, 1.15rem); font-weight: 800; text-align: center; line-height: 1.1;
    }
    .myday-slot i { font-style: normal; color: var(--pink); font-size: clamp(1rem, 4vw, 1.35rem); }
    .myday-slot.myday-full { background: var(--paper); border-style: solid; }
    .choice.myday-btn { width: clamp(96px, 28vw, 160px); aspect-ratio: auto; padding: 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .choice.myday-btn svg { width: 100%; max-height: 13vh; height: auto; border-radius: 12px; display: block; }
    .choice.myday-btn span { font-size: clamp(0.85rem, 3.4vw, 1.15rem); line-height: 1.1; min-height: 2.2em; display: grid; place-items: center; }
    .choice.myday-when { display: flex; align-items: center; gap: 8px; min-width: 44px; }
    .choice.myday-when svg { width: clamp(30px, 8vw, 42px); height: auto; flex: none; }
    @media (max-height: 560px) { .choice.myday-btn { width: clamp(90px, 22vw, 140px); } .myday-slot { min-height: 56px; } }
  `,

  card(i, tag = "div") {
    const e = MYDAY_EVENTS[i];
    return `<${tag} class="myday-card"${tag === "button" ? ` data-e="${i}" aria-label="${e.label}"` : ""}>${mydaySvg(e)}<span>${e.label}</span></${tag}>`;
  },

  next() {
    const L = level(myday);
    const n = MYDAY_EVENTS.length;
    if (L.kind === "order") {
      // Three events at least two steps apart, so the order is never a matter of opinion.
      const a = rand(0, n - 5), b = rand(a + 2, n - 3), c = rand(b + 2, n - 1);
      const t = newTask({ kind: "order", seq: [a, b, c], step: 0 });
      let jumbled;
      do { jumbled = shuffle([a, b, c]); } while (jumbled[0] === a && jumbled[1] === b); // never already in order
      const row = h(`<div class="myday-row">${jumbled.map((i) => myday.card(i, "button")).join("")}</div>`);
      row.addEventListener("click", (ev) => myday.tapCard(ev.target.closest(".myday-card")));
      $("stage").replaceChildren(row);
      const g = $("ground"); g.innerHTML = "";
      t.slots = MYDAY_STEPS.map((s) => { const el = h(`<div class="myday-slot"><i>${mydayCap(s)}</i><span></span></div>`); g.append(el); return el; });
      setInstruction("Tap them in order: <b>first</b>, next, last", "Tap the pictures in order. What happens first?");
    } else if (L.kind === "near") {
      const after = Math.random() < 0.5;
      const ref = after ? rand(0, n - 2) : rand(1, n - 1);
      const ans = after ? ref + 1 : ref - 1;
      // Wrong cards come from the other side of the reference (or far away), so only one answer is right.
      const near = after ? [...Array(ref).keys()].concat([...Array(n).keys()].filter((i) => i >= ref + 3))
        : [...Array(n).keys()].filter((i) => i > ref).concat([...Array(n).keys()].filter((i) => i <= ref - 3));
      const wrongs = shuffle(near).slice(0, 2);
      const word = after ? "after" : "before";
      const verb = MYDAY_EVENTS[ref].verb;
      const q = `What happens just ${word} we ${verb}?`;
      const t = newTask({ kind: "near", answer: ans });
      const qBox = '<div class="myday-q">?</div>';
      $("stage").replaceChildren(h(`<div class="myday-row">${after ? myday.card(ref) : qBox}<span class="myday-arrow">&rarr;</span>${after ? qBox : myday.card(ref)}</div>`));
      setInstruction(`What happens just <b>${word}</b> we ${verb}?`, q);
      const first = after ? ref : ans, second = after ? ans : ref;
      const winSay = `Yes! We ${MYDAY_EVENTS[first].verb}, then we ${MYDAY_EVENTS[second].verb}.`;
      const g = $("ground"); g.innerHTML = "";
      shuffle([ans, ...wrongs]).forEach((i) => {
        const e = MYDAY_EVENTS[i];
        const b = h(`<button class="choice myday-btn" data-e="${i}" aria-label="${e.label}">${mydaySvg(e)}<span>${e.label}</span></button>`);
        b.onclick = () => {
          if (busy) return;
          if (i === t.answer) win(b, `Yes! ${e.label}`, winSay);
          else { b.disabled = true; shakeEl(b); miss(`${e.label}. ${q}`); }
        };
        g.append(b);
      });
    } else {
      const period = pick(MYDAY_PERIODS);
      const ev = pick(MYDAY_EVENTS.filter((e) => e.when === period));
      const t = newTask({ kind: "when", answer: period });
      $("stage").replaceChildren(h(`<div class="myday-row">${myday.card(MYDAY_EVENTS.indexOf(ev)).replace('class="myday-card"', 'class="myday-card myday-one"')}</div>`));
      setInstruction(`Do we ${ev.verb} in the <b>morning</b>, <b>afternoon</b> or <b>evening</b>?`, `Do we ${ev.verb} in the morning, the afternoon or the evening?`);
      const g = $("ground"); g.innerHTML = "";
      MYDAY_PERIODS.forEach((p) => {
        const b = h(`<button class="choice wide myday-when" data-p="${p}">${mydayPeriodSvg(p)}<span>${mydayCap(p)}</span></button>`);
        b.onclick = () => {
          if (busy) return;
          if (p === t.answer) win(b, `Yes! ${mydayCap(p)}`, `Yes! We ${ev.verb} in the ${p}.`);
          else { b.disabled = true; shakeEl(b); miss(`Not the ${p}. Think about when we ${ev.verb}.`); }
        };
        g.append(b);
      });
    }
  },

  // Level 1: a tapped card is right if it is the next one in the day.
  tapCard(card) {
    const t = task;
    if (!card || busy || t.kind !== "order" || card.classList.contains("myday-done")) return;
    const i = +card.dataset.e, e = MYDAY_EVENTS[i];
    if (i !== t.seq[t.step]) {
      shakeEl(card);
      miss(`${e.label}. What happens ${MYDAY_STEPS[t.step]}?`);
      return;
    }
    card.classList.add("myday-done");
    card.insertAdjacentHTML("beforeend", `<b>${mydayCap(MYDAY_STEPS[t.step])}</b>`);
    const slot = t.slots[t.step];
    slot.classList.add("myday-full");
    slot.querySelector("span").textContent = e.label;
    chime(t.step);
    t.step++;
    if (t.step === 3) win(card, "Yes! First, next, last", "Yes! You put the day in order.");
    else say(`${e.label}. What happens ${MYDAY_STEPS[t.step]}?`);
  },

  voiceLines() {
    const lines = ["Tap the pictures in order. What happens first?", "Yes! You put the day in order."];
    MYDAY_EVENTS.forEach((e, i) => {
      for (const s of MYDAY_STEPS) lines.push(`${e.label}. What happens ${s}?`);
      if (i < MYDAY_EVENTS.length - 1) {
        lines.push(`What happens just after we ${e.verb}?`);
        lines.push(`Yes! We ${e.verb}, then we ${MYDAY_EVENTS[i + 1].verb}.`);
      }
      if (i > 0) lines.push(`What happens just before we ${e.verb}?`);
      if (e.when) {
        lines.push(`Do we ${e.verb} in the morning, the afternoon or the evening?`);
        lines.push(`Yes! We ${e.verb} in the ${e.when}.`);
        for (const p of MYDAY_PERIODS) lines.push(`Not the ${p}. Think about when we ${e.verb}.`);
      }
    });
    return lines;
  },

  test: {
    async answer() {
      if (task.kind === "order") {
        for (const i of [...task.seq]) {
          document.querySelector(`#stage .myday-card[data-e="${i}"]`).click();
          await new Promise((r) => setTimeout(r, 50));
        }
      } else if (task.kind === "near") {
        document.querySelector(`#ground .myday-btn[data-e="${task.answer}"]`).click();
      } else {
        document.querySelector(`#ground .myday-when[data-p="${task.answer}"]`).click();
      }
    },
  },
};
addGame(myday);
