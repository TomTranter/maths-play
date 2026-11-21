// Number Words — reading numbers as words. NC Y1: read and write numbers from 1 to 20 in numerals and words.
"use strict";

const WORDS_NAMES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

// A dot picture laid out like a ten frame (two rows of five), for 1 to 10.
function wordsDots(n) {
  const cells = Array.from({ length: 10 }, (_, i) => {
    const x = 4 + (i % 5) * 21, y = 4 + Math.floor(i / 5) * 21;
    return `<rect x="${x}" y="${y}" width="19" height="19" rx="3" fill="#fff" stroke="#1d3557" stroke-width="1.5"/>`
      + (i < n ? `<circle cx="${x + 9.5}" cy="${y + 9.5}" r="7" fill="#e63946"/>` : "");
  }).join("");
  return `<svg viewBox="0 0 113 50" aria-hidden="true">${cells}</svg>`;
}

const words = {
  id: "words", name: "Number Words", strand: "Numbers in words",
  levels: [
    { label: "One to ten", kind: "pick", lo: 1, hi: 10 },
    { label: "Eleven to twenty", kind: "pick", lo: 11, hi: 20 },
    { label: "Find the word", kind: "word", lo: 1, hi: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="6" y="14" width="66" height="34" rx="10" fill="#fff" stroke="#1d3557" stroke-width="3"/>
    <text x="39" y="38" text-anchor="middle" font-size="17" font-weight="800" fill="#d6336c" font-family="Baloo 2, sans-serif">seven</text>
    <rect x="70" y="44" width="44" height="40" rx="10" fill="#ffd23f" stroke="#1d3557" stroke-width="3"/>
    <text x="92" y="76" text-anchor="middle" font-size="30" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">7</text>
    <path d="M44 56 q8 18 24 12" fill="none" stroke="#1d3557" stroke-width="3" stroke-linecap="round"/>
    <path d="M62 62 l7 6 l-8 4" fill="none" stroke="#1d3557" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  css: `
    .words-card {
      background: var(--paper); border-radius: 28px; box-shadow: 0 6px 0 var(--lift);
      padding: clamp(10px, 3vh, 24px) clamp(24px, 7vw, 56px); text-align: center; line-height: 1.1;
      font-weight: 800; color: var(--pink); font-size: clamp(2.6rem, min(13vw, 12vh), 5.4rem);
      max-width: 100%; overflow-wrap: anywhere;
    }
    .words-card.words-num { color: var(--ink); font-size: clamp(3.4rem, min(22vw, 20vh), 8rem); font-variant-numeric: tabular-nums; min-width: clamp(120px, 34vw, 220px); }
    .words-btn.pic { padding: 10px; min-width: 44px; min-height: 44px; }
    .words-btn.pic svg { width: clamp(80px, 24vw, 120px); height: auto; }
    .words-btn.wide { min-width: 44px; padding: 8px 12px; font-size: clamp(1.1rem, 4.4vw, 1.8rem); }
  `,

  next() {
    const L = level(words);
    const n = rand(L.lo, L.hi);
    // Same-feel distractors: neighbours, and the teen/unit mix-up (4 and 14) inside the range shown.
    const deltas = L.kind === "word" ? [-10, 10, -1, 1, -2, 2] : [-1, 1, -2, 2, -3, 3];
    const first = L.kind === "word" ? shuffle([n - 10, n + 10]) : [];
    const wrongs = distractors(n, L.lo, L.hi, deltas, first);
    const dots = L.kind === "pick" && L.hi <= 10 && Math.random() < 0.5;
    const t = newTask({ answer: n, dots });
    const w = WORDS_NAMES[n];

    if (L.kind === "pick") {
      $("stage").replaceChildren(h(`<div class="words-card">${w}</div>`));
      if (dots) setInstruction(`Which picture shows <b>${w}</b>?`, `Which picture shows ${w}?`);
      else setInstruction(`Which number is <b>${w}</b>?`, `Which number is ${w}?`);
    } else {
      $("stage").replaceChildren(h(`<div class="words-card words-num">${n}</div>`));
      setInstruction(`Which word says <b>${n}</b>?`, `Which word says ${w}?`);
    }

    const g = $("ground"); g.innerHTML = "";
    for (const v of shuffle([n, ...wrongs])) {
      const b = h(`<button class="choice words-btn" data-n="${v}"></button>`);
      if (L.kind === "word") { b.classList.add("wide"); b.textContent = WORDS_NAMES[v]; }
      else if (dots) { b.classList.add("pic"); b.innerHTML = wordsDots(v); b.setAttribute("aria-label", `${v} dots`); }
      else b.textContent = String(v);
      b.onclick = () => {
        if (busy) return;
        if (v !== n) { b.disabled = true; shakeEl(b); miss(`That's ${WORDS_NAMES[v]}. Look again.`); return; }
        if (dots) win(b, `Yes! ${w}`, `Yes! That's ${plural(n, "dot", "dots").replace(/^\d+/, w)}.`);
        else win(b, `Yes! ${n} is ${w}`, `Yes! ${n} is ${w}.`);
      };
      g.append(b);
    }
  },

  voiceLines() {
    const lines = ["Look again."];
    for (let n = 1; n <= 20; n++) {
      const w = WORDS_NAMES[n];
      lines.push(`Which number is ${w}?`, `Which word says ${w}?`, `That's ${w}.`, `Yes! ${n} is ${w}.`);
      if (n <= 10) lines.push(`Which picture shows ${w}?`, `Yes! That's ${w} ${n === 1 ? "dot" : "dots"}.`);
    }
    return lines;
  },

  test: {
    answer() {
      document.querySelector(`#ground .words-btn[data-n="${task.answer}"]`).click();
    },
  },
};
addGame(words);
