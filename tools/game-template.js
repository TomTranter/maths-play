// <Game name> — <what it practises>. NC Y1/Y2: <the curriculum statement it covers>.
//
// Copy this file to js/games/<id>.js, rename `mygame` everywhere, then follow docs/ADDING_A_GAME.md.
"use strict";

const mygame = {
  id: "mygame",
  name: "My Game",
  strand: "Counting",
  levels: [
    { label: "Up to 10", max: 10 },
    { label: "Up to 20", max: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <circle cx="60" cy="45" r="30" fill="#ff4d6d" stroke="#1d3557" stroke-width="4"/>
  </svg>`,
  css: `
    .mygame-dots { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 420px; }
    .mygame-dots i { width: 44px; height: 44px; border-radius: 50%; background: var(--counter); box-shadow: 0 4px 0 var(--lift); }
  `,

  next() {
    const L = level(mygame);
    const n = rand(1, L.max);
    newTask({ answer: n });
    $("stage").replaceChildren(h(`<div class="mygame-dots">${"<i></i>".repeat(n)}</div>`));
    setInstruction("How many <b>dots</b>?", "How many dots?");
    choices(n, distractors(n, 1, L.max, [-2, -1, 1, 2]), "Count them again. Touch each one.", `Yes! ${n}`, `Yes! There ${n === 1 ? "is" : "are"} ${plural(n, "dot", "dots")}.`);
  },

  voiceLines() {
    const lines = ["How many dots?", "Count them again. Touch each one."];
    for (let n = 1; n <= 20; n++) lines.push(`Yes! There ${n === 1 ? "is" : "are"} ${plural(n, "dot", "dots")}.`);
    return lines;
  },

  test: {
    answer() {
      [...document.querySelectorAll("#ground .choice")].find((b) => +b.textContent === task.answer).click();
    },
  },
};
addGame(mygame);
