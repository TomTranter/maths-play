// Fraction Party — fractions of amounts. NC Y2: recognise, find, name and write fractions 1/3, 1/4, 2/4
// and 3/4 of a length, shape, set of objects or quantity; write simple fractions, e.g. 1/2 of 6 = 3, and
// recognise the equivalence of 2/4 and 1/2.
//
// Treats are dealt onto plates one at a time (like Party Bags), then the child says how many make the fraction.
"use strict";

const FRACTIONS_TREATS = {
  cupcake: {
    one: "cupcake", many: "cupcakes",
    svg: `<svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M9 21 h22 l-3 15 h-16 z" fill="#3aa6e8" stroke="#1d3557" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M15 22 l1 13 M20 22 v13 M25 22 l-1 13" stroke="#13558a" stroke-width="1.6"/>
      <path d="M7 22 q0 -8 7 -9 q2 -7 6 -7 q4 0 6 7 q7 1 7 9 z" fill="#f7c6d9" stroke="#1d3557" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="20" cy="6" r="3.4" fill="#e63946" stroke="#1d3557" stroke-width="1.6"/>
      <path d="M13 17 h2 M19 14 h2 M24 18 h2" stroke="#ffd23f" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  strawberry: {
    one: "strawberry", many: "strawberries",
    svg: `<svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 37 q-14 -8 -13 -20 q1 -6 13 -6 q12 0 13 6 q1 12 -13 20 z" fill="#e63946" stroke="#1d3557" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M11 11 l4 -6 l5 5 l5 -5 l4 6 l-9 2 z" fill="#2ec27e" stroke="#0f6b40" stroke-width="2" stroke-linejoin="round"/>
      <g fill="#ffd23f"><circle cx="14" cy="18" r="1.2"/><circle cx="20" cy="17" r="1.2"/><circle cx="26" cy="18" r="1.2"/>
      <circle cx="17" cy="24" r="1.2"/><circle cx="23" cy="24" r="1.2"/><circle cx="20" cy="30" r="1.2"/></g></svg>`,
  },
};

// Every round the game can set, per level: [total treats, plates, plates asked about].
const FRACTIONS_ROUNDS = [
  [4, 6, 8, 10, 12].map((n) => [n, 2, 1]),
  [[6, 3, 1], [9, 3, 1], [12, 3, 1], [8, 4, 1], [12, 4, 1]], // at least 2 on each plate
  [4, 8, 12].flatMap((n) => [[n, 4, 3], [n, 4, 2]]),
];
// How to name "m out of d plates" in words.
function fractionsName(d, m) {
  if (d === 2) return "half";
  if (d === 3) return "a third";
  if (m === 1) return "a quarter";
  return m === 2 ? "two quarters" : "three quarters";
}
const fractionsCap = (s) => s[0].toUpperCase() + s.slice(1);
const fractionsShare = (n, kind, d) => `Share ${n} ${FRACTIONS_TREATS[kind].many} onto ${d} plates.`;
const fractionsWin = (n, d, m) => {
  const name = fractionsName(d, m), a = (n / d) * m;
  return `Yes! ${fractionsCap(name)} of ${n} is ${a}.` + (d === 4 && m === 2 ? " Two quarters is the same as half." : "");
};

const fractions = {
  id: "fractions", name: "Fraction Party", strand: "Fractions of amounts",
  levels: [
    { label: "Find half", lvl: 0 },
    { label: "Thirds and quarters", lvl: 1 },
    { label: "Three quarters", lvl: 2 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <ellipse cx="32" cy="66" rx="26" ry="11" fill="#fff" stroke="#1d3557" stroke-width="3"/>
    <ellipse cx="88" cy="66" rx="26" ry="11" fill="#fff" stroke="#1d3557" stroke-width="3"/>
    ${[[14, 34], [32, 34], [70, 34], [88, 34]].map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(.8)">${(i % 2 ? FRACTIONS_TREATS.strawberry : FRACTIONS_TREATS.cupcake).svg.replace(/<\/?svg[^>]*>/g, "")}</g>`).join("")}
    <text x="60" y="22" text-anchor="middle" font-size="20" font-weight="800" fill="#d6336c" font-family="Baloo 2, sans-serif">½</text>
  </svg>`,
  css: `
    .fractions-wrap { display: grid; gap: clamp(10px, 2.5vh, 22px); justify-items: center; width: 100%; }
    .fractions-pile { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; max-width: 440px; min-height: 48px; }
    .fractions-treat {
      width: clamp(44px, 11vw, 60px); height: clamp(44px, 11vw, 60px); border: 0; padding: 2px; background: none; display: block;
      cursor: pointer;
    }
    .fractions-treat svg, .fractions-fly svg { width: 100%; height: 100%; display: block; }
    .fractions-fly { width: 40px; height: 40px; }
    .fractions-plates { display: flex; gap: clamp(6px, 2vw, 16px); justify-content: center; flex-wrap: nowrap; width: 100%; }
    .fractions-plate {
      position: relative; flex: none; align-self: center; width: clamp(76px, 21vw, 160px); height: clamp(76px, 21vw, 160px); border-radius: 50%;
      background: radial-gradient(circle, var(--paper) 58%, #eef4fb 60%, var(--paper) 70%);
      border: 4px solid #c9d6e6; box-shadow: 0 6px 0 var(--lift);
      display: grid; grid-template-columns: repeat(2, 1fr); align-content: center; padding: clamp(11px, 3vw, 24px);
      transition: border-color .2s, transform .2s, opacity .2s;
    }
    .fractions-plate i { width: 100%; aspect-ratio: 1; display: block; }
    .fractions-plate.fractions-many { grid-template-columns: repeat(3, 1fr); }
    .fractions-plate i svg { width: 100%; height: 100%; display: block; }
    .fractions-plates.fractions-picking .fractions-plate { opacity: .45; }
    .fractions-plates.fractions-picking .fractions-plate.fractions-on { opacity: 1; border-color: var(--sun-dark); box-shadow: 0 0 0 5px var(--sun), 0 6px 0 var(--lift); transform: translateY(-4px); }
    .fractions-tag {
      font-size: clamp(1.3rem, 5vw, 2rem); font-weight: 800; color: var(--pink); background: var(--paper-soft);
      border-radius: 16px; padding: 2px 16px; min-height: 1.4em;
    }
  `,

  next() {
    const L = level(fractions);
    const [N, D, M] = pick(FRACTIONS_ROUNDS[L.lvl]);
    const kind = pick(Object.keys(FRACTIONS_TREATS));
    const t = newTask({ N, D, M, kind, k: N / D, answer: (N / D) * M, phase: "deal", dealt: 0, landed: 0, onPlate: Array(D).fill(0) });

    const wrap = h(`<div class="fractions-wrap"><div class="fractions-pile"></div><div class="fractions-plates"></div><div class="fractions-tag"></div></div>`);
    t.pile = wrap.querySelector(".fractions-pile");
    t.platesEl = wrap.querySelector(".fractions-plates");
    t.tag = wrap.querySelector(".fractions-tag");
    t.plateEls = Array.from({ length: D }, (_, i) => {
      const p = h(`<div class="fractions-plate" aria-label="Plate ${i + 1}"></div>`);
      t.platesEl.append(p);
      return p;
    });
    t.pile.innerHTML = Array.from({ length: N }, () => `<button class="fractions-treat" aria-label="${FRACTIONS_TREATS[kind].one}">${FRACTIONS_TREATS[kind].svg}</button>`).join("");
    t.pile.addEventListener("click", (e) => fractions.deal(e.target.closest(".fractions-treat")));
    $("stage").replaceChildren(wrap);
    $("ground").replaceChildren();
    setInstruction(`Share <b>${N}</b> ${FRACTIONS_TREATS[kind].many} onto <b>${D}</b> plates`, `${fractionsShare(N, kind, D)} Tap a treat to share it.`);
  },

  // Each tapped treat goes onto the next plate in turn, like dealing cards.
  deal(el) {
    const t = task;
    if (!el || busy || !t || t.phase !== "deal" || el.dataset.gone) return;
    el.dataset.gone = "1";
    const i = t.dealt % t.D, plate = t.plateEls[i];
    const from = el.getBoundingClientRect(), to = plate.getBoundingClientRect();
    el.style.visibility = "hidden";
    t.dealt++;
    chime(t.dealt);
    const land = () => {
      if (task !== t) return; // moved on while the treat was flying
      el.remove();
      t.onPlate[i]++;
      fractions.renderPlate(i);
      if (++t.landed === t.N) fractions.ask(); // quick taps can have several treats in the air
    };
    if (reduced) return land();
    const fl = h(`<div class="flyer fractions-fly">${FRACTIONS_TREATS[t.kind].svg}</div>`);
    document.body.append(fl);
    fl.animate(
      [{ transform: `translate(${from.left}px, ${from.top}px)` }, { transform: `translate(${to.left + to.width / 2 - 20}px, ${to.top + to.height / 2 - 20}px) scale(.8)` }],
      { duration: 380, easing: "cubic-bezier(.5,0,.3,1)" }
    ).onfinish = () => { fl.remove(); land(); };
  },

  renderPlate(i) {
    const t = task, n = t.onPlate[i];
    t.plateEls[i].innerHTML = `<i>${FRACTIONS_TREATS[t.kind].svg}</i>`.repeat(n);
    t.plateEls[i].classList.toggle("fractions-many", n > 4);
  },

  ask() {
    const t = task;
    t.phase = "ask";
    t.pile.remove();
    const name = fractionsName(t.D, t.M), a = t.answer;
    const sym = t.D === 2 ? "½" : `${t.M}/${t.D}`;
    t.tag.textContent = `${sym} of ${t.N}`;
    const each = `Each plate has ${fractionsName(t.D, 1)}.`;
    const q = `What is ${name} of ${t.N}?`;
    const wrongs = distractors(a, 1, 12, [-1, 1, -2, 2, 3], t.M > 1 ? [t.k, t.N] : [t.N]);
    if (t.M > 1) {
      t.platesEl.classList.add("fractions-picking");
      t.plateEls.slice(0, t.M).forEach((p) => p.classList.add("fractions-on"));
      setInstruction(`What is <b>${name}</b> of ${t.N}?`, `${each} Look at ${t.M} plates. ${q}`);
      choices(a, wrongs, "Count the treats on the shining plates.", `Yes! ${a}`, fractionsWin(t.N, t.D, t.M));
    } else {
      setInstruction(`What is <b>${name}</b> of ${t.N}?`, `How many on each plate? ${each} ${q}`);
      choices(a, wrongs, "Count the treats on one plate.", `Yes! ${a}`, fractionsWin(t.N, t.D, t.M));
    }
  },

  voiceLines() {
    const lines = [
      "Tap a treat to share it.",
      "How many on each plate?",
      "Count the treats on one plate.",
      "Count the treats on the shining plates.",
      "Look at 2 plates.",
      "Look at 3 plates.",
      "Two quarters is the same as half.",
    ];
    for (const d of [2, 3, 4]) lines.push(`Each plate has ${fractionsName(d, 1)}.`);
    for (const rounds of FRACTIONS_ROUNDS) {
      for (const [n, d, m] of rounds) {
        for (const kind of Object.keys(FRACTIONS_TREATS)) lines.push(fractionsShare(n, kind, d));
        lines.push(`What is ${fractionsName(d, m)} of ${n}?`);
        lines.push(...fractionsWin(n, d, m).replace(/^Yes! /, "").split(/(?<=[.!?]) /));
      }
    }
    return [...new Set(lines)];
  },

  test: {
    async answer() {
      const t = task;
      for (const el of [...document.querySelectorAll("#stage .fractions-treat")]) el.click();
      for (let i = 0; i < 60 && task === t && t.phase !== "ask"; i++) await new Promise((r) => setTimeout(r, 50));
      [...document.querySelectorAll("#ground .choice")].find((b) => +b.textContent === t.answer).click();
    },
  },
};
addGame(fractions);
