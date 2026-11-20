// Bead Rack (rekenrek) — 20 and 100 bead racks. NC Y1: count to 100, represent numbers; groups of 5 and 10.
"use strict";

const beads = {
  id: "beads", name: "Bead Rack", strand: "Counting to 100",
  levels: [
    { label: "Up to 10", rows: 2, lo: 1, max: 10 },
    { label: "Up to 20", rows: 2, lo: 11, max: 20 },
    { label: "Up to 100", rows: 10, lo: 11, max: 100 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="6" y="14" width="108" height="62" rx="4" fill="#fdf6e9"/><rect x="6" y="14" width="8" height="62" fill="#b07a43"/><rect x="106" y="14" width="8" height="62" fill="#b07a43"/>
    ${[33, 57].map((y, r) => `<path d="M14 ${y}h92" stroke="#7a5128" stroke-width="2"/>` + Array.from({ length: 10 }, (_, k) => { const on = k < (r === 0 ? 10 : 3); const x = on ? 21 + k * 8.4 : 106 - (10 - k) * 8.4 + 1.2; return `<circle cx="${x}" cy="${y}" r="4.2" fill="${k < 5 ? "#e63946" : "#f3efe4"}" stroke="${k < 5 ? "#9d1c27" : "#b9b2a2"}"/>`; }).join("")).join("")}
  </svg>`,
  next() {
    const L = level(beads);
    const kind = Math.random() < 0.55 ? "make" : "read";
    const n = rand(L.lo, L.max);
    const counts = Array(L.rows).fill(0);
    if (kind === "read") { let left = n; for (let r = 0; r < L.rows; r++) { counts[r] = Math.min(10, left); left -= counts[r]; } }
    const t = newTask({ kind, n, counts, L });

    const rack = h(`<div class="rack ${L.rows === 2 ? "size20" : "size100"}"></div>`);
    for (let r = 0; r < L.rows; r++) {
      const w = h(`<div class="wire ${r === 4 && L.rows === 10 ? "gap" : ""}"></div>`);
      for (let k = 0; k < 10; k++) {
        const b = h(`<button class="bead ${k < 5 ? "red" : "white"}" data-r="${r}" data-k="${k}" aria-label="Bead"></button>`);
        b.style.setProperty("--i", k);
        w.append(b);
      }
      rack.append(w);
    }
    t.rack = rack;
    rack.addEventListener("click", (e) => beads.tap(e));
    $("stage").replaceChildren(rack);
    beads.render();

    if (kind === "make") {
      setInstruction(`Slide <b>${n}</b> ${n === 1 ? "bead" : "beads"} across`, `Slide ${plural(n, "bead", "beads")} across to the left.`);
      checkRow((btn) => beads.check(btn), () => { t.counts.fill(0); beads.render(); });
    } else {
      setInstruction("How many beads on the left?", "How many beads on the left?");
      const deltas = L.max > 20 ? [-10, 10, -1, 1] : [-2, -1, 1, 2];
      choices(n, distractors(n, 1, L.max, deltas), "Each full row is ten.", `Yes! ${n}`, beads.sayWin(n));
    }
  },
  sayWin(n) { return n > 10 && n < 20 ? `Yes! Ten and ${n - 10} make ${n}` : `Yes! ${n}`; },
  render() {
    const t = task;
    t.rack.querySelectorAll(".bead").forEach((b) => b.classList.toggle("on", +b.dataset.k < t.counts[+b.dataset.r]));
  },
  tap(e) {
    const t = task, b = e.target.closest(".bead");
    if (!b || busy || t.kind !== "make") return;
    const r = +b.dataset.r, k = +b.dataset.k;
    const toLeft = k >= t.counts[r];
    t.counts[r] = toLeft ? k + 1 : k;
    click(toLeft); beads.render();
  },
  check(btn) {
    const t = task, have = t.counts.reduce((a, b) => a + b, 0);
    if (have === t.n) win(btn, `Yes! ${t.n}`, beads.sayWin(t.n));
    else { shakeEl(t.rack); miss(moreOrLess(have, t.n)); }
  },
};
GAMES.beads = beads;
