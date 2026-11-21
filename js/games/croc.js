// Hungry Crocodile — comparing numbers with <, > and =. NC Y1: use the language of equal to, more
// than, less than (fewer), most, least. NC Y2: compare and order numbers from 0 up to 100; use <, > and = signs.
//
// This file is the reference example of a self-contained game (see docs/ADDING_A_GAME.md):
// its look (css), everything it says (voiceLines) and an automatic test (test.answer) all live here.
"use strict";

// The sign drawn as a crocodile's open jaws. "<" opens right (bigger on the right), ">" opens left.
function crocSVG(sign) {
  if (sign === "=") return `<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="18" y="30" width="84" height="14" rx="7" fill="#2ec27e" stroke="#0f6b40" stroke-width="4"/><rect x="18" y="56" width="84" height="14" rx="7" fill="#2ec27e" stroke="#0f6b40" stroke-width="4"/></svg>`;
  const flip = sign === ">" ? 'transform="translate(120 0) scale(-1 1)"' : "";
  return `<svg viewBox="0 0 120 100" aria-hidden="true"><g ${flip}>
    <path d="M14 50 L104 10 L110 24 L32 52 Z" fill="#2ec27e" stroke="#0f6b40" stroke-width="4" stroke-linejoin="round"/>
    <path d="M14 50 L104 90 L110 76 L32 48 Z" fill="#2ec27e" stroke="#0f6b40" stroke-width="4" stroke-linejoin="round"/>
    ${[44, 60, 76, 92].map((x, i) => `<path d="M${x} ${23 + i * -3.6 + 14} l6 10 l6 -12" fill="#fff" stroke="#0f6b40" stroke-width="2"/><path d="M${x} ${77 - i * -3.6 - 14} l6 -10 l6 12" fill="#fff" stroke="#0f6b40" stroke-width="2"/>`).join("")}
    <circle cx="30" cy="38" r="7" fill="#fff" stroke="#0f6b40" stroke-width="3"/><circle cx="31" cy="37" r="3" fill="#1d3557"/>
  </g></svg>`;
}
const crocDots = (n) => n <= 20 ? `<span class="croc-dots">${'<i></i>'.repeat(n)}</span>` : "";
const CROC_SIGN_NAMES = { "<": "less than", ">": "greater than", "=": "equals" };

const croc = {
  id: "croc", name: "Hungry Crocodile", strand: "More, less & equal",
  levels: [
    { label: "Numbers to 20", kind: "num", max: 20 },
    { label: "Numbers to 100", kind: "num", max: 100 },
    { label: "Sums", kind: "sum", max: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <text x="18" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">3</text>
    <g transform="translate(32 18) scale(.5)">${crocSVG("<").replace(/<\/?svg[^>]*>/g, "")}</g>
    <text x="102" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">8</text>
  </svg>`,

  css: `
    .croc { display: flex; align-items: center; justify-content: center; gap: clamp(8px, 3vw, 24px); width: 100%; }
    .croc-side {
      display: grid; justify-items: center; gap: 8px; background: var(--paper); border-radius: 24px; padding: 12px 18px;
      box-shadow: 0 6px 0 var(--lift); min-width: clamp(96px, 28vw, 200px);
    }
    .croc-num { font-size: clamp(2.4rem, 10vw, 4.4rem); font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .croc-dots { display: grid; grid-template-columns: repeat(5, 12px); gap: 4px; }
    .croc-dots i { width: 12px; height: 12px; border-radius: 50%; background: var(--counter); }
    .croc-gap {
      width: clamp(64px, 18vw, 120px); aspect-ratio: 1.2; display: grid; place-items: center; border-radius: 20px;
      border: 4px dashed var(--good); color: var(--good); font-size: 2.4rem; font-weight: 800; background: var(--paper-soft);
    }
    .croc-gap svg { width: 100%; height: auto; }
    .croc-gap.snap { border-color: transparent; background: none; animation: bump 0.35s ease-out; }
    .croc-btn svg { width: 80%; height: auto; }
  `,

  next() {
    const L = level(croc);
    const equal = Math.random() < 0.2;
    let left, right, lv, rv;
    if (L.kind === "num") {
      lv = rand(1, L.max); rv = equal ? lv : rand(1, L.max);
      while (rv === lv && !equal) rv = rand(1, L.max);
      if (L.max === 100 && !equal && Math.random() < 0.4) rv = (lv % 10) * 10 + Math.floor(lv / 10) || rv; // 43 vs 34
      if (rv === lv && !equal) rv = lv === L.max ? lv - 1 : lv + 1;
      left = `${lv}`; right = `${rv}`;
    } else {
      const a = rand(1, 10), b = rand(1, 10);
      lv = a + b;
      if (equal) { const c = rand(Math.max(1, lv - 10), Math.min(10, lv - 1)); rv = lv; right = Math.random() < 0.5 ? `${lv}` : `${c} + ${lv - c}`; }
      else { rv = lv + pick([-2, -1, 1, 2]); if (rv < 1) rv = lv + 1; right = `${rv}`; }
      left = `${a} + ${b}`;
    }
    const answer = lv > rv ? ">" : lv < rv ? "<" : "=";
    const t = newTask({ answer, left, right });
    const showDots = L.kind === "num" && L.max === 20;
    const wrap = h(`<div class="croc">
      <div class="croc-side"><span class="croc-num">${left}</span>${showDots ? crocDots(lv) : ""}</div>
      <div class="croc-gap">?</div>
      <div class="croc-side"><span class="croc-num">${right}</span>${showDots ? crocDots(rv) : ""}</div>
    </div>`);
    t.gap = wrap.querySelector(".croc-gap");
    $("stage").replaceChildren(wrap);
    setInstruction("Which way does the <b>crocodile</b> face?", "Which way does the crocodile face? It always eats the bigger number.");
    const g = $("ground"); g.innerHTML = "";
    for (const s of ["<", ">", "="]) {
      const b = h(`<button class="choice croc-btn" aria-label="${CROC_SIGN_NAMES[s]}">${crocSVG(s)}</button>`);
      b.onclick = () => {
        if (busy) return;
        if (s !== answer) {
          b.disabled = true; shakeEl(b);
          miss(answer === "=" ? "Look again. Are they the same?" : "The crocodile always eats the bigger number.");
          return;
        }
        t.gap.innerHTML = crocSVG(s); t.gap.classList.add("snap");
        tone(180, 0, 0.12, { type: "square", vol: 0.12, to: 90 });
        win(b, `${left} ${s} ${right}`, s === "=" ? "Yes! They are the same, so we use equals." : "Yes! The crocodile eats the bigger number.");
      };
      g.append(b);
    }
  },

  // Every line this game can say. The voice is recorded from this list (tools/make_voice.py).
  voiceLines() {
    return [
      "Which way does the crocodile face? It always eats the bigger number.",
      "Look again. Are they the same?",
      "The crocodile always eats the bigger number.",
      "Yes! They are the same, so we use equals.",
      "Yes! The crocodile eats the bigger number.",
    ];
  },

  // Plays the right answer through the real buttons (used by ?selftest).
  test: {
    answer() {
      document.querySelector(`#ground .choice[aria-label="${CROC_SIGN_NAMES[task.answer]}"]`).click();
    },
  },
};
addGame(croc);
