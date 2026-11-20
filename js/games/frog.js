// Frog Hops — add and take away by hopping along a number line.
// NC Y1: add and subtract one-digit and two-digit numbers to 20, including zero; read +, − and = signs.
"use strict";

const FROG = `<g aria-hidden="true">
  <ellipse cx="0" cy="-16" rx="24" ry="17" fill="#3fae49" stroke="#23702b" stroke-width="3"/>
  <circle cx="-11" cy="-33" r="9" fill="#3fae49" stroke="#23702b" stroke-width="3"/>
  <circle cx="11" cy="-33" r="9" fill="#3fae49" stroke="#23702b" stroke-width="3"/>
  <circle cx="-11" cy="-34" r="4.5" fill="#1d3557"/><circle cx="11" cy="-34" r="4.5" fill="#1d3557"/>
  <path d="M-10 -12 q10 8 20 0" fill="none" stroke="#23702b" stroke-width="3" stroke-linecap="round"/>
</g>`;
const PAD_GAP = 60, PAD_Y = 168, PAD_X0 = 32;
const padX = (i) => PAD_X0 + i * PAD_GAP;

const frog = {
  id: "frog", name: "Frog Hops", strand: "Adding & taking away",
  levels: [
    { label: "Add to 10", op: "+", max: 10 },
    { label: "Add to 20", op: "+", max: 20 },
    { label: "Take away", op: "-", max: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="0" y="54" width="120" height="30" rx="12" fill="#4fa3d9"/>
    ${[14, 38, 62, 86, 110].map((x, i) => `<ellipse cx="${x}" cy="68" rx="10" ry="6" fill="${i === 1 ? "#ffd23f" : "#7cc96a"}" stroke="#3f8f33" stroke-width="1.5"/>`).join("")}
    <path d="M38 56 Q62 18 86 56" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="4 4"/>
    <g transform="translate(86 64) scale(.5)">${FROG}</g>
  </svg>`,
  next() {
    const L = level(frog);
    let a, b, ans;
    if (L.op === "+") {
      b = rand(1, L.max === 10 ? 6 : 9);
      a = rand(L.max === 10 ? 0 : 4, L.max - b);
      ans = a + b;
    } else {
      a = rand(6, L.max);
      b = rand(1, Math.min(9, a));
      ans = a - b;
    }
    // 11 pads (0–10 numbers wide) that always contain the start and the answer.
    const lo = rand(Math.max(0, Math.max(a, ans) - 10), Math.min(Math.min(a, ans), L.max - 10));
    const t = newTask({ a, b, ans, op: L.op, lo, pos: a, hops: 0 });

    const pads = Array.from({ length: 11 }, (_, i) => {
      const n = lo + i, x = padX(i);
      return `<g>
        <ellipse cx="${x}" cy="${PAD_Y}" rx="28" ry="21" class="pad${n === a ? " start-pad" : ""}"/>
        <text class="padnum" x="${x}" y="${PAD_Y + 11}" text-anchor="middle">${n}</text>
        <rect class="hit" data-n="${n}" x="${x - PAD_GAP / 2}" y="40" width="${PAD_GAP}" height="170"/>
      </g>`;
    }).join("");
    const river = h(`<div class="river"><svg viewBox="0 0 ${PAD_X0 * 2 + PAD_GAP * 10} 215" role="img" aria-label="Number line from ${lo} to ${lo + 10}">
      <rect class="water" x="0" y="140" width="${PAD_X0 * 2 + PAD_GAP * 10}" height="58" rx="26"/>
      <path class="ripple" d="M20 160 q20 -6 40 0 M300 186 q20 -6 40 0 M540 158 q20 -6 40 0"/>
      <g class="arcs"></g>
      ${pads}
      <g class="frogpos" style="pointer-events:none">${FROG}</g>
    </svg></div>`);
    t.river = river;
    t.arcs = river.querySelector(".arcs");
    t.frogEl = river.querySelector(".frogpos");
    frog.place(a);
    river.addEventListener("click", (e) => frog.tap(e));
    $("stage").replaceChildren(river);
    $("ground").replaceChildren();

    const sign = L.op === "+" ? "+" : "−";
    const word = L.op === "+" ? "add" : "take away";
    setInstruction(`<b>${a} ${sign} ${b}</b> = ?`, `${a} ${word} ${b}. Tap where the frog lands.`);
  },
  place(n) {
    const x = padX(n - task.lo);
    task.frogEl.style.transform = `translate(${x}px, ${PAD_Y - 4}px)`;
  },
  async hop(from, to) {
    const t = task, x1 = padX(from - t.lo), x2 = padX(to - t.lo), y = PAD_Y - 4;
    t.hops++;
    const mid = (x1 + x2) / 2;
    const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arc.setAttribute("class", "hop");
    arc.setAttribute("d", `M${x1} ${PAD_Y - 18} Q${mid} ${PAD_Y - 120} ${x2} ${PAD_Y - 18}`);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "hoplabel"); label.setAttribute("x", mid); label.setAttribute("y", PAD_Y - 78);
    label.setAttribute("text-anchor", "middle"); label.textContent = t.hops;
    t.arcs.append(arc, label);
    tone(392 * Math.pow(2, Math.min(t.hops, 12) / 12), 0, 0.14, { type: "triangle", vol: 0.14 });
    if (!reduced) {
      await t.frogEl.animate(
        [{ transform: `translate(${x1}px, ${y}px)` }, { transform: `translate(${mid}px, ${y - 70}px) scale(1.1)` }, { transform: `translate(${x2}px, ${y}px)` }],
        { duration: 300, easing: "ease-in-out" }
      ).finished;
    }
    t.frogEl.style.transform = `translate(${x2}px, ${y}px)`;
  },
  async tap(e) {
    const hit = e.target.closest(".hit");
    const t = task;
    if (!hit || busy || !t) return;
    const n = +hit.dataset.n;
    if (n === t.pos) { say("Hop to the answer!"); return; }
    busy = true;
    const g = gen, dir = Math.sign(n - t.pos);
    while (t.pos !== n) {
      const next = t.pos + dir;
      await frog.hop(t.pos, next);
      if (g !== gen) return;
      t.pos = next;
    }
    if (n === t.ans) {
      const word = t.op === "+" ? "add" : "take away";
      const sign = t.op === "+" ? "+" : "−";
      win(hit, `${t.a} ${sign} ${t.b} = ${t.ans}`, `Yes! ${t.a} ${word} ${t.b} is ${t.ans}`);
      return;
    }
    miss(t.hops > t.b ? "Too many hops! Count them again." : "Not quite! Count the hops.");
    later(() => {
      t.pos = t.a; t.hops = 0; t.arcs.replaceChildren(); frog.place(t.a);
      busy = false;
    }, 1300);
  },
};
GAMES.frog = frog;
