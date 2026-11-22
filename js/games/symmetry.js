// Butterfly Symmetry — complete a mirror image and spot symmetry. NC Y2: identify and describe the
// properties of 2D shapes, including the number of sides and line symmetry in a vertical line.
"use strict";

const SYM_COLS = ["#ff4d6d", "#3aa6e8", "#ffd23f", "#9b5de5"];

const symmetry = {
  id: "symmetry", name: "Butterfly Symmetry", strand: "Symmetry",
  levels: [
    { label: "Mirror the wing", size: 6, colours: 1, kind: "make" },
    { label: "Bigger, more colours", size: 8, colours: 2, kind: "make" },
    { label: "Spot the symmetry", size: 6, colours: 2, kind: "spot" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[[-1, 0], [-2, 1], [-1, 1], [-3, 2], [-2, 2], [-1, 3], [-2, 3]].flatMap(([dx, r]) => [[60 + dx * 12, r], [60 - dx * 12 - 12, r]]).map(([x, r], i) => `<rect x="${x}" y="${12 + r * 15}" width="12" height="13" rx="3" fill="${i % 4 < 2 ? "#ff4d6d" : "#3aa6e8"}"/>`).join("")}
    <rect x="57" y="8" width="6" height="70" rx="3" fill="#1d3557"/><path d="M60 8 q-8 -6 -12 -2 M60 8 q8 -6 12 -2" stroke="#1d3557" stroke-width="2" fill="none"/>
  </svg>`,
  // left half pattern: half[r][c] = colour index + 1 (0 = empty), c counts from the edge to the middle
  pattern(size, colours, cells) {
    const half = size / 2, grid = Array.from({ length: size }, () => Array(half).fill(0));
    let n = 0;
    while (n < cells) { const r = rand(0, size - 1), c = rand(0, half - 1); if (!grid[r][c]) { grid[r][c] = rand(1, colours); n++; } }
    return grid;
  },
  gridHTML(size, left, right, clickable) {
    const half = size / 2;
    let cells = "";
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const v = c < half ? left[r][c] : right[r][c - half];
      const attrs = `class="sq${c === half - 1 ? " edge" : ""}" data-r="${r}" data-c="${c}" ${v ? `style="background:${SYM_COLS[v - 1]}"` : ""}`;
      // only squares you can paint are buttons: the level 3 cards are buttons themselves, and buttons can't nest
      cells += clickable && c >= half ? `<button ${attrs} aria-label="Square"></button>` : `<span ${attrs}></span>`;
    }
    return `<div class="sym" style="--n:${size}">${cells}<span class="mirror"></span><span class="body"></span></div>`;
  },
  next() {
    const L = level(symmetry);
    const half = L.size / 2;
    const t = newTask({ L });
    if (L.kind === "make") {
      t.left = symmetry.pattern(L.size, L.colours, L.size === 6 ? rand(4, 6) : rand(7, 10));
      t.right = Array.from({ length: L.size }, () => Array(half).fill(0));
      // the mirror image: right[r][c] should equal left[r][half - 1 - c]
      t.want = t.left.map((row) => [...row].reverse());
      const wrap = h('<div class="sym-wrap"></div>');
      t.wrap = wrap;
      symmetry.render();
      wrap.addEventListener("click", (e) => {
        const b = e.target.closest(".sq");
        if (!b || b.disabled || busy) return;
        const r = +b.dataset.r, c = +b.dataset.c - half;
        t.right[r][c] = (t.right[r][c] + 1) % (L.colours + 1);
        click(!!t.right[r][c]); symmetry.render();
      });
      $("stage").replaceChildren(wrap);
      setInstruction("Make the other <b>wing</b> match", L.colours > 1 ? "Make the other wing match, like a mirror. Tap a square to change its colour." : "Make the other wing match, like a mirror. Tap the squares to colour them.");
      checkRow((btn) => {
        let missing = 0, extra = 0;
        t.want.forEach((row, r) => row.forEach((v, c) => { const got = t.right[r][c]; if (v && got !== v) missing++; else if (!v && got) extra++; }));
        if (!missing && !extra) win(btn, "Both wings match!", "Yes! Both wings match.");
        else { shakeEl(t.wrap); miss(extra && !missing ? "Some squares shouldn't be coloured." : "Look at the mirror line. Check each row."); }
      }, () => { t.right.forEach((row) => row.fill(0)); symmetry.render(); });
    } else {
      // three patterns, exactly one symmetrical
      const make = (sym) => {
        const left = symmetry.pattern(L.size, L.colours, rand(4, 6));
        let right = left.map((row) => [...row].reverse());
        if (!sym) { right = right.map((row) => [...row]); const r = rand(0, L.size - 1), c = rand(0, half - 1); right[r][c] = right[r][c] ? 0 : rand(1, L.colours); }
        return { left, right, sym };
      };
      const opts = shuffle([make(true), make(false), make(false)]);
      const row = h('<div class="sym-choices"></div>');
      opts.forEach((o) => {
        const b = h(`<button class="sym-card" aria-label="Pattern">${symmetry.gridHTML(L.size, o.left, o.right, false)}</button>`);
        if (o.sym) t.good = b;
        b.onclick = () => {
          if (busy) return;
          if (o.sym) win(b, "Symmetrical!", "Yes! That pattern is symmetrical.");
          else { b.disabled = true; shakeEl(b); miss("Look at both sides of the mirror line. Do they match?"); }
        };
        row.append(b);
      });
      $("stage").replaceChildren(row);
      $("ground").replaceChildren();
      setInstruction("Which pattern is <b>symmetrical</b>?", "Which pattern is symmetrical? Both sides must match.");
    }
  },
  render() {
    const t = task;
    t.wrap.innerHTML = symmetry.gridHTML(t.L.size, t.left, t.right, true);
  },
};
// Plays the right answer through the real controls (used by ?selftest).
symmetry.test = {
  answer() {
    const t = task;
    if (t.L.kind === "spot") return tap(t.good);
    const half = t.L.size / 2;
    t.want.forEach((row, r) => row.forEach((v, c) => {
      for (let k = 0; k < v; k++) tap(t.wrap.querySelector(`.sq[data-r="${r}"][data-c="${c + half}"]`));
    }));
    tapCheck();
  },
};
GAMES.symmetry = symmetry;
