// Dice Dash — dice patterns and adding two dice. NC Y1: recognise patterns (subitising), represent and use
// number bonds and related facts within 20; add one-digit numbers.
"use strict";

// Pip positions on a 100×100 face (left/centre/right × top/middle/bottom).
const DICE_PIPS = {
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[27, 27], [50, 50], [73, 73]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[27, 25], [73, 25], [27, 50], [73, 50], [27, 75], [73, 75]],
};
function diceSVG(n) {
  const pips = DICE_PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5" fill="#1d3557"/>`).join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="18" fill="#fff" stroke="#1d3557" stroke-width="5"/>${pips}</svg>`;
}
const diceDots = (n) => (n === 1 ? "1 dot." : `${n} dots.`);

const dice = {
  id: "dice", name: "Dice Dash", strand: "Dice & adding",
  levels: [
    { label: "One dice", kind: "one" },
    { label: "Two dice", kind: "two" },
    { label: "Make the total", kind: "make" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <g transform="translate(10 22) rotate(-10 24 24) scale(.48)">${diceSVG(5).replace(/<\/?svg[^>]*>/g, "")}</g>
    <g transform="translate(62 18) rotate(8 24 24) scale(.48)">${diceSVG(3).replace(/<\/?svg[^>]*>/g, "")}</g>
  </svg>`,

  css: `
    .dice-row { display: flex; align-items: center; justify-content: center; gap: clamp(8px, 3vw, 24px); width: 100%; }
    .dice-face { width: min(30vw, 26vh, 190px); aspect-ratio: 1; filter: drop-shadow(0 6px 0 var(--lift)); }
    .dice-face svg { width: 100%; height: 100%; display: block; }
    .dice-big .dice-face { width: min(52vw, 34vh, 240px); }
    .dice-roll { animation: dice-roll 0.45s ease-out; }
    @keyframes dice-roll { from { transform: rotate(-40deg) scale(0.6); opacity: 0; } to { transform: none; opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .dice-roll { animation: none; } }
    .dice-sign { font-size: clamp(2rem, 9vw, 3.6rem); font-weight: 800; color: var(--ink); line-height: 1; }
    .dice-slot {
      width: min(21vw, 22vh, 170px); aspect-ratio: 1; display: grid; place-items: center; border-radius: 20px;
      border: 4px dashed var(--good); color: var(--good); font-size: clamp(2rem, 9vw, 3.4rem); font-weight: 800; background: var(--paper-soft);
    }
    .dice-slot.dice-filled { border-color: transparent; background: none; }
    .dice-slot svg { width: 100%; height: 100%; display: block; }
    .dice-target {
      min-width: clamp(64px, 18vw, 120px); padding: 6px 12px; border-radius: 22px; background: var(--sun);
      box-shadow: 0 6px 0 var(--sun-dark); font-size: clamp(2.4rem, 10vw, 4rem); font-weight: 800; text-align: center; line-height: 1.1;
    }
    .dice-make { gap: clamp(6px, 2vw, 20px); }
    .dice-make .dice-face { width: min(21vw, 22vh, 170px); }
    .dice-btn { padding: 6px; display: grid; place-items: center; }
    .dice-btn svg { width: 100%; height: 100%; }
  `,

  next() {
    const L = level(dice);
    const stage = $("stage");
    if (L.kind === "one") {
      const n = rand(1, 6);
      newTask({ answer: n });
      stage.replaceChildren(h(`<div class="dice-row dice-big"><div class="dice-face dice-roll" role="img" aria-label="a dice">${diceSVG(n)}</div></div>`));
      setInstruction("How many <b>dots</b>?", "How many dots?");
      choices(n, distractors(n, 1, 6, [-2, -1, 1, 2]), "Look at the pattern. Count the dots.", `Yes! ${n}`, `Yes! ${diceDots(n)}`);
      return;
    }
    if (L.kind === "two") {
      const a = rand(1, 6), b = rand(1, 6), s = a + b;
      newTask({ answer: s, a, b });
      stage.replaceChildren(h(`<div class="dice-row">
        <div class="dice-face dice-roll" role="img" aria-label="a dice">${diceSVG(a)}</div>
        <div class="dice-face dice-roll" role="img" aria-label="a dice">${diceSVG(b)}</div>
      </div>`));
      setInstruction("How many dots <b>altogether</b>?", "How many dots altogether?");
      choices(s, distractors(s, 2, 12, [-2, -1, 1, 2]), `Count on from ${Math.max(a, b)}.`, `Yes! ${a} + ${b} = ${s}`, `Yes! ${a} and ${b} make ${s}.`);
      return;
    }
    // Make the total: target T = a + b, one dice (a) shown, find b. b is always 1–6.
    let a, b;
    do { a = rand(1, 6); b = rand(1, 6); } while (a + b < 4);
    const T = a + b;
    const t = newTask({ answer: b, a, target: T });
    const wrap = h(`<div class="dice-row dice-make">
      <div class="dice-face dice-roll" role="img" aria-label="a dice">${diceSVG(a)}</div>
      <span class="dice-sign">+</span>
      <div class="dice-slot">?</div>
      <span class="dice-sign">=</span>
      <div class="dice-target">${T}</div>
    </div>`);
    t.slot = wrap.querySelector(".dice-slot");
    stage.replaceChildren(wrap);
    setInstruction(`Make <b>${T}</b>`, `We need ${T} altogether. What does the other dice need to show?`);
    const g = $("ground"); g.innerHTML = "";
    for (const n of shuffle([b, ...distractors(b, 1, 6, [-2, -1, 1, 2, -3, 3])])) {
      const btn = h(`<button class="choice dice-btn" data-n="${n}" aria-label="${plural(n, "dot", "dots")}">${diceSVG(n)}</button>`);
      btn.onclick = () => {
        if (busy) return;
        if (n !== b) {
          btn.disabled = true; shakeEl(btn);
          miss(`Count on from ${a}. Stop at ${T}.`);
          return;
        }
        t.slot.innerHTML = diceSVG(n); t.slot.classList.add("dice-filled", "dice-roll");
        win(btn, `Yes! ${a} + ${b} = ${T}`, `Yes! ${a} and ${b} make ${T}.`);
      };
      g.append(btn);
    }
  },

  // Every line this game can say. The voice is recorded from this list (tools/make_voice.py).
  voiceLines() {
    const lines = [
      "How many dots?",
      "Look at the pattern. Count the dots.",
      "How many dots altogether?",
      "What does the other dice need to show?",
    ];
    for (let n = 1; n <= 6; n++) lines.push(`Yes! ${diceDots(n)}`, `Count on from ${n}.`);
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) lines.push(`Yes! ${a} and ${b} make ${a + b}.`);
    for (let T = 2; T <= 12; T++) lines.push(`We need ${T} altogether.`, `Stop at ${T}.`);
    return lines;
  },

  // Plays the right answer through the real buttons (used by ?selftest).
  test: {
    answer() {
      const btns = [...document.querySelectorAll("#ground .choice")];
      const b = level(dice).kind === "make"
        ? btns.find((x) => +x.dataset.n === task.answer)
        : btns.find((x) => +x.textContent === task.answer);
      b.click();
    },
  },
};
addGame(dice);
