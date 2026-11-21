// Flower Arrays — multiplication as arrays. NC Y2: recall and use multiplication facts for the 2, 5
// and 10 times tables; calculate mathematical statements for multiplication using ×; show that
// multiplication can be done in any order (commutative), using arrays.
"use strict";

const FLOWER = (c) => `<svg viewBox="0 0 40 40" aria-hidden="true">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="20" cy="9" rx="6.5" ry="9" fill="${c}" stroke="#1d3557" stroke-width="1.5" transform="rotate(${a} 20 20)"/>`).join("")}<circle cx="20" cy="20" r="6" fill="#ffd23f" stroke="#1d3557" stroke-width="1.5"/></svg>`;
const FLOWER_COLS = ["#ff4d6d", "#9b5de5", "#3aa6e8", "#f15bb5", "#ff9f1c"];

const arrays = {
  id: "arrays", name: "Flower Arrays", strand: "Arrays & times tables",
  levels: [
    { label: "Count the array", kind: "count" },
    { label: "Times tables", kind: "times" },
    { label: "Make an array", kind: "make" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<g transform="translate(${14 + (i % 4) * 24} ${8 + Math.floor(i / 4) * 26}) scale(.55)">${FLOWER(FLOWER_COLS[Math.floor(i / 4)]).replace(/<\/?svg[^>]*>/g, "")}</g>`).join("")}</svg>`,
  grid(r, c) {
    const col = pick(FLOWER_COLS);
    return `<div class="bed" style="grid-template-columns: repeat(${c}, 1fr); --cols: ${c}">${Array.from({ length: r * c }, () => `<span class="flower">${FLOWER(col)}</span>`).join("")}</div>`;
  },
  next() {
    const L = level(arrays);
    const t = newTask({ kind: L.kind });
    $("ground").replaceChildren();
    if (L.kind !== "make") {
      const c = pick([2, 5, 10]), r = rand(2, c === 10 ? 5 : 6), n = r * c;
      Object.assign(t, { r, c, n });
      const eq = L.kind === "times" ? `<div class="eq">${r} × ${c} = <span class="q">?</span></div>` : "";
      const wrap = h(`<div class="arrays">${arrays.grid(r, c)}${eq}</div>`);
      t.wrap = wrap;
      $("stage").replaceChildren(wrap);
      t.onWin = () => { const e = wrap.querySelector(".eq .q"); if (e) e.textContent = n; };
      if (L.kind === "count") {
        setInstruction(`<b>${r}</b> rows of <b>${c}</b>. How many flowers?`, `There are ${r} rows of ${c}. How many flowers altogether? Count in ${c}s.`);
        choices(n, distractors(n, 2, 70, [-c, c, -1, 1]), `Count in ${c}s.`, `Yes! ${n}`, `Yes! ${r} rows of ${c} is ${n}.`);
      } else {
        setInstruction(`What is <b>${r} × ${c}</b>?`, `What is ${r} times ${c}?`);
        choices(n, distractors(n, 2, 70, [-c, c, -1, 1]), `Count in ${c}s, one row at a time.`, `${r} × ${c} = ${n}`, `Yes! ${r} times ${c} is ${n}.`);
      }
      return;
    }
    const N = pick([6, 8, 10, 12, 15, 16, 18, 20]);
    Object.assign(t, { N, r: 1, c: 1 });
    const wrap = h(`<div class="arrays">
      <div class="bed-slot"></div>
      <div class="steppers">
        <div class="stepper"><span>Rows</span><button class="pm" data-d="r-">−</button><b data-v="r">1</b><button class="pm add" data-d="r+">+</button></div>
        <div class="stepper"><span>In each row</span><button class="pm" data-d="c-">−</button><b data-v="c">1</b><button class="pm add" data-d="c+">+</button></div>
      </div>
    </div>`);
    t.wrap = wrap;
    t.col = pick(FLOWER_COLS);
    wrap.querySelector(".steppers").addEventListener("click", (e) => {
      const d = e.target.closest("[data-d]")?.dataset.d;
      if (!d || busy) return;
      const k = d[0], up = d[1] === "+";
      t[k] = Math.max(1, Math.min(10, t[k] + (up ? 1 : -1)));
      click(up); arrays.renderMake();
    });
    $("stage").replaceChildren(wrap);
    arrays.renderMake();
    setInstruction(`Make an array with <b>${N}</b> flowers`, `Make an array with ${N} flowers. Change the rows and how many in each row.`);
    checkRow((btn) => {
      const n = t.r * t.c;
      if (n === N && t.r > 1 && t.c > 1) win(btn, `${t.r} × ${t.c} = ${N}`, `Yes! ${t.r} rows of ${t.c} is ${N}.`);
      else if (n === N) { boing(); say("That's right, but try making more than one row."); }
      else { shakeEl(wrap.querySelector(".bed-slot")); miss(n < N ? "Not enough flowers yet." : "Too many flowers!"); }
    });
  },
  renderMake() {
    const t = task;
    t.wrap.querySelector(".bed-slot").innerHTML = `<div class="bed" style="grid-template-columns: repeat(${t.c}, 1fr); --cols: ${t.c}">${Array.from({ length: t.r * t.c }, () => `<span class="flower">${FLOWER(t.col)}</span>`).join("")}</div>`;
    t.wrap.querySelector('[data-v="r"]').textContent = t.r;
    t.wrap.querySelector('[data-v="c"]').textContent = t.c;
  },
};
// Plays the right answer through the real controls (used by ?selftest).
arrays.test = {
  answer() {
    const t = task;
    if (t.kind !== "make") return tapChoice(t.n);
    let r = 2;
    while (r <= 10 && (t.N % r || t.N / r > 10)) r++;
    if (r > 10) throw new Error(`no array for ${t.N} fits the 10 × 10 limit`);
    for (let i = 1; i < r; i++) tap(t.wrap.querySelector('[data-d="r+"]'));
    for (let i = 1; i < t.N / r; i++) tap(t.wrap.querySelector('[data-d="c+"]'));
    tapCheck();
  },
};
GAMES.arrays = arrays;
