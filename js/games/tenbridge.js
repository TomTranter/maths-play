// Make Ten Bridge — adding across 10 by making 10 first (8 + 5 = 8 + 2 + 3 = 13). NC Y1: add one-digit
// numbers within 20, represent and use number bonds. NC Y2: add a two-digit number and ones, using
// concrete objects and recognising bonds to 10.
"use strict";

// Every (a, b) pair a level can ask: a is 7, 8 or 9; the total crosses 10 and fits two frames (max 18).
function tenbridgePairs(L) {
  const out = [];
  for (const a of [7, 8, 9]) {
    for (let b = L.bmin; b <= L.bmax; b++) if (a + b > 10 && a + b <= 18) out.push([a, b]);
  }
  return out;
}

const tenbridge = {
  id: "tenbridge", name: "Make Ten Bridge", strand: "Adding across 10",
  levels: [
    { label: "Fill the frame", kind: "tap", bmin: 2, bmax: 5 },
    { label: "Bigger numbers", kind: "tap", bmin: 6, bmax: 9 },
    { label: "Just the sum", kind: "sum", bmin: 2, bmax: 9 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[0, 1].map((f) => `<rect x="${6 + f * 58}" y="24" width="50" height="22" rx="3" fill="#1d3557"/>` +
      Array.from({ length: 10 }, (_, i) => {
        const x = 8 + f * 58 + (i % 5) * 9.4, y = 26 + Math.floor(i / 5) * 9.4;
        const n = f * 10 + i;
        const col = n < 8 ? "#e63946" : n < 13 ? "#f5c400" : "";
        return `<rect x="${x}" y="${y}" width="8.4" height="8.4" rx="1" fill="#fff"/>` + (col ? `<circle cx="${x + 4.2}" cy="${y + 4.2}" r="3.2" fill="${col}"/>` : "");
      }).join("")).join("")}
    <text x="60" y="78" text-anchor="middle" font-size="20" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">8 + 5 = 13</text>
  </svg>`,

  css: `
    .tenbridge {
      --tenbridge-cell: clamp(38px, min(12vw, 7.4vh), 72px);
      display: grid; justify-items: center; gap: clamp(8px, 2vh, 18px); width: 100%;
    }
    .tenbridge-frames { display: grid; gap: clamp(8px, 1.6vh, 16px); justify-items: center; }
    @media (min-width: 720px) { .tenbridge-frames { grid-template-columns: auto auto; gap: 24px; } }
    .tenbridge-frame {
      display: grid; grid-template-columns: repeat(5, var(--tenbridge-cell)); grid-auto-rows: var(--tenbridge-cell);
      background: var(--ink); gap: 4px; padding: 4px; border-radius: 12px; box-shadow: 0 6px 0 var(--lift);
    }
    .tenbridge-frame.tenbridge-full { box-shadow: 0 0 0 5px var(--sun), 0 6px 0 var(--lift); animation: tenbridge-full 0.35s ease-out; }
    @keyframes tenbridge-full { 50% { transform: scale(0.95); } }
    .tenbridge-cell { background: var(--paper); border-radius: 6px; display: grid; place-items: center; }
    .tenbridge-dot {
      width: 72%; aspect-ratio: 1; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ff8a93, var(--counter) 55%, var(--counter-dark));
    }
    .tenbridge-dot.tenbridge-y { background: radial-gradient(circle at 35% 30%, #fff1a8, var(--sun) 55%, var(--sun-dark)); }
    .tenbridge-dot.tenbridge-new { animation: tenbridge-drop 0.25s ease-out; }
    @keyframes tenbridge-drop { from { transform: scale(0.2); opacity: 0; } }
    .tenbridge-pile {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: min(92vw, 380px);
      min-height: clamp(48px, 7vh, 60px); padding: 6px 12px; border-radius: 20px; background: var(--paper-soft);
    }
    .tenbridge-pile:empty { visibility: hidden; }
    .tenbridge-pc {
      width: clamp(46px, 6.6vh, 56px); aspect-ratio: 1; border: 0; padding: 0; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #fff1a8, var(--sun) 55%, var(--sun-dark));
      box-shadow: 0 4px 0 var(--lift);
    }
    .tenbridge-pc:active { transform: scale(0.9); }
    span.tenbridge-pc { display: block; }
    .tenbridge-pile.tenbridge-still .tenbridge-pc { cursor: default; }
  `,

  next() {
    const L = level(tenbridge);
    const [a, b] = pick(tenbridgePairs(L));
    const sum = a + b, k = 10 - a, r = sum - 10;
    const t = newTask({ kind: L.kind, a, b, sum, k, r, answer: sum, placed: 0, phase: L.kind === "tap" ? "tap" : "sum" });

    const cells = (f) => Array.from({ length: 10 }, (_, i) => {
      const n = f * 10 + i;
      return `<div class="tenbridge-cell" data-i="${n}">${n < a ? '<span class="tenbridge-dot"></span>' : ""}</div>`;
    }).join("");
    const pc = L.kind === "tap"
      ? Array.from({ length: b }, () => '<button class="tenbridge-pc" aria-label="Yellow counter"></button>').join("")
      : Array.from({ length: b }, () => '<span class="tenbridge-pc"></span>').join("");
    const wrap = h(`<div class="tenbridge">
      <div class="tenbridge-frames">
        <div class="tenbridge-frame">${cells(0)}</div>
        <div class="tenbridge-frame">${cells(1)}</div>
      </div>
      <div class="tenbridge-pile${L.kind === "tap" ? "" : " tenbridge-still"}">${pc}</div>
    </div>`);
    t.wrap = wrap;
    t.frames = [...wrap.querySelectorAll(".tenbridge-frame")];
    t.cells = [...wrap.querySelectorAll(".tenbridge-cell")];
    t.pile = wrap.querySelector(".tenbridge-pile");
    $("stage").replaceChildren(wrap);
    $("ground").replaceChildren();

    if (L.kind === "tap") {
      t.pile.addEventListener("click", (e) => tenbridge.move(e.target.closest("button.tenbridge-pc")));
      setInstruction(`<b>${a} + ${b}</b>: fill the frame!`, `${a} add ${b}. How many to fill the frame? Tap the yellow counters.`);
    } else {
      tenbridge.ask();
    }
  },

  // Moves one yellow counter from the pile into the next empty space (first frame first).
  move(btn) {
    const t = task;
    if (!btn || busy || t.phase !== "tap") return;
    btn.remove();
    const cell = t.cells[t.a + t.placed];
    cell.append(h('<span class="tenbridge-dot tenbridge-y tenbridge-new"></span>'));
    t.placed++;
    click();
    if (t.placed === t.k) {
      t.frames[0].classList.add("tenbridge-full");
      chime(2);
      if (t.placed < t.b) {
        setInstruction(`<b>${t.k}</b> more makes <b>10</b>!`, `${t.k} more makes ten. Now put in the rest.`);
      }
    }
    if (t.placed === t.b) { t.phase = "sum"; tenbridge.ask(); }
  },

  ask() {
    const t = task;
    const wrongs = distractors(t.sum, 11, 18, [-1, 1, -2, 2]);
    if (t.kind === "tap") {
      setInstruction(`<b>10</b> and <b>${t.r}</b> more: how many?`, `${t.k} more makes ten. Ten and ${t.r} more. How many altogether?`);
      choices(t.sum, wrongs, "Count on from ten.", `Yes! ${t.a} + ${t.b} = ${t.sum}`, `Yes! Ten and ${t.r} make ${t.sum}.`);
    } else {
      setInstruction(`${t.a} + ${t.b} = <b>?</b>`, `What is ${t.a} add ${t.b}?`);
      choices(t.sum, wrongs, `${t.a} and ${t.k} make ten. Then count on.`, `Yes! ${t.a} + ${t.b} = ${t.sum}`, `Yes! ${t.a} add ${t.b} is ${t.sum}.`);
    }
  },

  voiceLines() {
    const lines = new Set(["Now put in the rest.", "Tap the yellow counters.", "How many to fill the frame?", "How many altogether?", "Count on from ten.", "Then count on."]);
    for (const L of tenbridge.levels) {
      for (const [a, b] of tenbridgePairs(L)) {
        const k = 10 - a, r = a + b - 10, sum = a + b;
        lines.add(`${k} more makes ten.`);
        if (L.kind === "tap") {
          lines.add(`${a} add ${b}.`);
          lines.add(`Ten and ${r} more.`);
          lines.add(`Ten and ${r} make ${sum}.`);
        } else {
          lines.add(`What is ${a} add ${b}?`);
          lines.add(`${a} and ${k} make ten.`);
          lines.add(`${a} add ${b} is ${sum}.`);
        }
      }
    }
    return [...lines];
  },

  test: {
    async answer() {
      const t = task;
      if (t.phase === "tap") {
        let btn;
        while ((btn = t.wrap.querySelector("button.tenbridge-pc")) && task === t) {
          btn.click();
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      [...document.querySelectorAll("#ground .choice")].find((b) => +b.textContent === task.answer).click();
    },
  },
};
addGame(tenbridge);
