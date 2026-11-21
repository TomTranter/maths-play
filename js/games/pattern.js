// Pattern Train — repeating patterns and number sequences.
// NC Y1: count forwards/backwards; sequences. NC Y2: order and arrange combinations of objects in
// patterns and sequences; count in steps of 2, 3, 5 and 10 forwards and backwards.
"use strict";

const PATTERN_COLS = ["#ff4d6d", "#3aa6e8", "#2ec27e", "#ffd23f", "#9b5de5", "#ff9f1c"];
const PATTERN_SHAPES = ["circle", "triangle", "square", "hexagon"];
const PATTERNS = ["AB", "AAB", "ABB", "ABC", "AABB"];

// A pattern item: { shape, color } drawn in a 60×60 box.
const itemSVG = (it) => `<svg viewBox="0 0 80 80" aria-hidden="true">${shapeEl(it.shape, 40, 40, 24, 0, it.color, 'stroke="#1d3557" stroke-width="4"')}</svg>`;
const sameItem = (a, b) => a.shape === b.shape && a.color === b.color;

const pattern = {
  id: "pattern", name: "Pattern Train", strand: "Patterns & sequences",
  levels: [
    { label: "Colour patterns", kind: "colour" },
    { label: "Shape patterns", kind: "shape" },
    { label: "Number patterns", kind: "number" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="4" y="40" width="26" height="22" rx="4" fill="#ff4d6d" stroke="#1d3557" stroke-width="2"/><rect x="10" y="30" width="8" height="12" fill="#1d3557"/>
    ${[0, 1, 2].map((i) => `<rect x="${34 + i * 28}" y="40" width="24" height="22" rx="3" fill="#fff" stroke="#1d3557" stroke-width="2"/><circle cx="${46 + i * 28}" cy="51" r="7" fill="${["#3aa6e8", "#ffd23f", "#3aa6e8"][i]}"/>`).join("")}
    ${[17, 46, 74, 102].map((x) => `<circle cx="${x}" cy="66" r="4" fill="#1d3557"/>`).join("")}
    <path d="M0 72 H120" stroke="#7a5128" stroke-width="3"/>
  </svg>`,
  next() {
    const L = level(pattern);
    const t = newTask({ kind: L.kind });
    let cars, answer, options;
    if (L.kind === "number") {
      const up = Math.random() < 0.6, step = pick(up ? [1, 2, 5, 10] : [1, 2, 10]);
      const len = 5;
      const startMax = up ? 100 - step * len : 100, startMin = up ? 0 : step * len;
      let a = rand(Math.ceil(startMin / step), Math.floor(startMax / step)) * step;
      if (step === 1) a = rand(up ? 1 : len + 1, up ? 100 - len : 100);
      const seq = Array.from({ length: len + 1 }, (_, i) => a + (up ? 1 : -1) * step * i);
      answer = seq[len];
      cars = seq.slice(0, len).map((n) => `<span class="car-num">${n}</span>`);
      Object.assign(t, { step, up, answer });
      options = shuffle([answer, ...distractors(answer, 0, 110, [step + 1, -1, 1, up ? -step : step, 2])]);
    } else {
      const p = pick(L.kind === "colour" ? ["AB", "AAB", "ABB", "ABC"] : PATTERNS);
      const letters = [...new Set(p)];
      const cols = shuffle([...PATTERN_COLS]).slice(0, letters.length);
      const shapes_ = shuffle([...PATTERN_SHAPES]).slice(0, letters.length);
      const unit = [...p].map((ch) => {
        const j = letters.indexOf(ch);
        return L.kind === "colour" ? { shape: "circle", color: cols[j] } : { shape: shapes_[j], color: cols[(j + 1) % cols.length] };
      });
      const total = Math.max(6, unit.length * 2 + 1);
      const seq = Array.from({ length: total + 1 }, (_, i) => unit[i % unit.length]);
      answer = seq[total];
      cars = seq.slice(0, total).map((it) => itemSVG(it));
      // wrong options: other items from the pattern, or a lookalike with a different colour/shape
      const pool = unit.filter((u) => !sameItem(u, answer));
      while (pool.length < 2) pool.push({ shape: answer.shape, color: PATTERN_COLS.find((c) => c !== answer.color && !pool.some((q) => q.color === c)) });
      options = shuffle([answer, ...shuffle(pool).slice(0, 2)]);
    }
    t.answer = answer;
    const wrap = h(`<div class="train">
      <div class="engine" aria-hidden="true"><span class="chimney"></span></div>
      ${cars.map((c) => `<div class="car">${c}</div>`).join("")}
      <div class="car mystery">?</div>
    </div>`);
    t.train = wrap;
    $("stage").replaceChildren(wrap);
    setInstruction("What comes <b>next</b>?", L.kind === "number" ? "What comes next?" : "Look at the pattern. What comes next?");
    const g = $("ground"); g.innerHTML = "";
    options.forEach((o) => {
      const num = L.kind === "number";
      const b = h(num ? `<button class="choice">${o}</button>` : `<button class="choice pic" aria-label="Pattern piece">${itemSVG(o)}</button>`);
      if (num ? o === answer : sameItem(o, answer)) t.answerBtn = b;
      b.onclick = () => {
        if (busy) return;
        const ok = num ? o === answer : sameItem(o, answer);
        if (!ok) { b.disabled = true; shakeEl(b); miss(num ? "Look at how much it changes each time." : "Say the pattern out loud. What comes next?"); return; }
        const m = t.train.querySelector(".mystery");
        m.classList.remove("mystery"); m.innerHTML = num ? `<span class="car-num">${o}</span>` : itemSVG(o);
        const steps = t.step === 1 ? "ones" : `${t.step}s`;
        win(b, "Yes!", num ? `Yes! It goes ${t.up ? "up" : "down"} in ${steps}.` : "Yes! The pattern goes on.");
      };
      g.append(b);
    });
  },
};
// Plays the right answer through the real controls (used by ?selftest).
pattern.test = {
  answer() { tap(task.answerBtn); },
};
GAMES.pattern = pattern;
