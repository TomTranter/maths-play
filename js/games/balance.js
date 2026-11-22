// Balance Scales — heavier/lighter, then making both sides equal.
// NC Y1: compare mass (heavier/lighter); represent and use number bonds; understand = and solve
// missing number problems such as 7 = ? − 9. NC Y2: recognise and use the = sign.
"use strict";

const SCALE_OBJECTS = {
  feather: { w: 1, svg: '<path d="M10 52 C6 28 28 6 54 6 C56 14 52 20 46 22 L50 26 C44 36 38 40 32 40 L34 46 C26 52 18 52 10 52 Z" fill="#c5a3f5" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/><path d="M4 58 Q22 36 46 13 M20 40 l-3 -15 M30 29 l-1 -13 M21 40 l13 1 M32 28 l12 0" stroke="#1d3557" stroke-width="2.3" fill="none" stroke-linecap="round"/>' },
  apple: { w: 3, svg: '<path d="M30 18 C18 10 4 18 7 34 C10 50 22 58 30 53 C38 58 50 50 53 34 C56 18 42 10 30 18 Z" fill="#e63946" stroke="#1d3557" stroke-width="2.5"/><path d="M30 18 q1 -8 5 -13" stroke="#7a5128" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M33 12 q9 -12 19 -4 q-7 11 -19 4z" fill="#58c85f" stroke="#1d3557" stroke-width="2"/><path d="M14 30 q1 -8 8 -9" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>' },
  book: { w: 5, svg: '<path d="M6 40 V14 Q6 8 12 8 H50 V44 H12 Q6 44 6 50 Q6 56 12 56 H54 V14" fill="#3aa6e8" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 44 H50 V52 H12 Q8 48 12 44z" fill="#fff" stroke="#1d3557" stroke-width="2"/><path d="M15 9 v34" stroke="#13558a" stroke-width="3"/><path d="M33 16 l3.5 7 8 1 -6 5 2 8 -7.5 -4 -7.5 4 2 -8 -6 -5 8 -1z" fill="#ffd23f"/>' },
  pumpkin: { w: 8, svg: '<path d="M28 19 q-2 -10 7 -15 l3 5 q-5 4 -4 10z" fill="#3f8f33" stroke="#1d3557" stroke-width="2"/><g fill="#ff9f1c" stroke="#1d3557" stroke-width="2.5"><ellipse cx="17" cy="37" rx="14" ry="18"/><ellipse cx="43" cy="37" rx="14" ry="18"/><ellipse cx="30" cy="37" rx="14" ry="20"/></g><path d="M23 29 q2 -6 7 -7" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>' },
  watermelon: { w: 10, svg: '<ellipse cx="30" cy="36" rx="28" ry="21" fill="#58c85f" stroke="#1d3557" stroke-width="2.5"/><path d="M12 24 q-9 12 1 24 M23 17 l-5 8 4 6 -5 7 6 8 -1 8 M36 17 l5 8 -4 6 5 7 -6 8 1 8 M48 24 q9 12 -1 24" stroke="#1f8a50" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 22 h8" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>' },
};
const BLOCK_COLS = ["#ff4d6d", "#ff9f1c", "#f5c400", "#2ec27e", "#3aa6e8", "#9b5de5", "#f15bb5", "#13558a", "#a85a00", "#0f6b40"];
const PIVOT = { x: 180, y: 64 }, ARM = 128, DROP = 62;

const balance = {
  id: "balance", name: "Balance Scales", strand: "Equals & weighing",
  levels: [
    { label: "Heavier, lighter", kind: "weigh" },
    { label: "Balance to 10", kind: "eq", max: 10 },
    { label: "Balance to 20", kind: "eq", max: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="57" y="25" width="6" height="55" fill="#7a5128"/><rect x="40" y="78" width="40" height="7" rx="3" fill="#7a5128"/>
    <rect x="16" y="22" width="88" height="6" rx="3" fill="#b07a43" transform="rotate(12 60 25)"/>
    <path d="M17 16 v16 M103 34 v16" stroke="#56627a" stroke-width="1.5"/>
    <path d="M5 32 h24 q-12 9 -24 0z M91 50 h24 q-12 9 -24 0z" fill="#d9dde3" stroke="#7b8492" stroke-width="1.5"/>
    <g transform="translate(9 16) scale(.27)">${SCALE_OBJECTS.feather.svg}</g>
    <g transform="translate(93 33) scale(.29)">${SCALE_OBJECTS.pumpkin.svg}</g>
    <circle cx="60" cy="25" r="4" fill="#ffd23f" stroke="#7a5128" stroke-width="1.5"/>
  </svg>`,
  next() {
    const L = level(balance);
    const t = newTask({ kind: L.kind, theta: 0, left: [], right: [] });
    const wrap = h('<div class="balance"><svg viewBox="-16 0 392 236" role="img" aria-label="Balance scale"></svg><div class="eq" hidden></div></div>');
    t.svg = wrap.querySelector("svg");
    t.eq = wrap.querySelector(".eq");
    $("stage").replaceChildren(wrap);
    $("ground").replaceChildren();

    if (L.kind === "weigh") {
      const [a, b] = shuffle(Object.keys(SCALE_OBJECTS)).slice(0, 2);
      t.left = [{ obj: a }]; t.right = [{ obj: b }];
      t.heavier = SCALE_OBJECTS[a].w > SCALE_OBJECTS[b].w ? a : b;
      t.lighter = t.heavier === a ? b : a;
      t.ask = Math.random() < 0.5 ? "heavier" : "lighter";
      balance.draw();
      balance.tiltTo(balance.weighTilt());
      t.svg.addEventListener("click", (e) => balance.tapObject(e));
      setInstruction(`Which is <b>${t.ask}</b>?`, `Which is ${t.ask}? Tap it.`);
    } else {
      let lhs, c;
      if (L.max === 10) { const s = rand(4, 10); lhs = [s]; c = rand(1, s - 1); }
      else { const s = rand(11, 20); const a = rand(Math.max(1, s - 10), Math.min(10, s - 1)); lhs = [a, s - a]; c = rand(Math.max(1, s - 10), Math.min(10, s - 1)); }
      const s = lhs.reduce((x, y) => x + y, 0), d = s - c;
      Object.assign(t, { s, c, d });
      t.left = lhs.map((n) => ({ n })); t.right = [{ n: c }, { q: true }];
      balance.draw();
      balance.tiltTo(balance.numTilt());
      balance.showEq();
      setInstruction("Make it <b>balance</b>!", "Make it balance! What goes in the empty space?");
      const opts = shuffle([d, ...distractors(d, 1, 10, [-1, 1, -2, 2, 3])]);
      opts.forEach((n) => {
        const b = h(`<button class="choice">${n}</button>`);
        b.onclick = () => balance.tryNumber(n, b);
        $("ground").append(b);
      });
    }
  },
  sum: (side) => side.reduce((a, x) => a + (x.n || 0) + (x.obj ? SCALE_OBJECTS[x.obj].w : 0), 0),
  weighTilt() { return Math.sign(balance.sum(task.right) - balance.sum(task.left)) * 16; },
  numTilt() { return Math.max(-18, Math.min(18, (balance.sum(task.right) - balance.sum(task.left)) * 4)); },
  showEq(done) {
    const t = task;
    const left = t.left.map((x) => x.n).join(" + ");
    t.eq.hidden = false;
    t.eq.innerHTML = `${left} = ${t.c} + <span class="q">${done ? t.d : "?"}</span>`;
  },
  // Pan contents sit on the dish; items are laid side by side.
  panItems(side, px, py, sideName) {
    const items = task[side];
    const widths = items.map((x) => (x.obj ? 58 : 36));
    let x = px - (widths.reduce((a, b) => a + b, 0) + (items.length - 1) * 4) / 2;
    return items.map((it, i) => {
      const w = widths[i], gx = x; x += w + 4;
      if (it.obj) return `<g class="obj-hit" data-obj="${it.obj}" transform="translate(${gx} ${py - 56})"><rect width="58" height="58" fill="transparent"/>${SCALE_OBJECTS[it.obj].svg}</g>`;
      if (it.q) return `<g transform="translate(${gx} ${py - 36})"><rect width="34" height="34" rx="7" fill="#ffffff" stroke="#d6336c" stroke-width="3" stroke-dasharray="6 4"/><text x="17" y="25" text-anchor="middle" class="blk">?</text></g>`;
      return `<g transform="translate(${gx} ${py - 36})"><rect width="34" height="34" rx="7" fill="${BLOCK_COLS[(it.n - 1) % 10]}" stroke="#1d3557" stroke-width="2"/><text x="17" y="25" text-anchor="middle" class="blk blk-n">${it.n}</text></g>`;
    }).join("");
  },
  draw() {
    const t = task, th = (t.theta * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
    const L = { x: PIVOT.x - ARM * c, y: PIVOT.y - ARM * s }, R = { x: PIVOT.x + ARM * c, y: PIVOT.y + ARM * s };
    const pan = (p) => `<path d="M${p.x} ${p.y} L${p.x - 50} ${p.y + DROP} M${p.x} ${p.y} L${p.x + 50} ${p.y + DROP}" stroke="#56627a" stroke-width="2"/>
      <path d="M${p.x - 60} ${p.y + DROP} h120 q-8 24 -60 26 q-52 -2 -60 -26z" fill="#ffd23f" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/><path d="M${p.x - 42} ${p.y + DROP + 9} q16 9 38 9" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
    t.svg.innerHTML = `
      <path d="M${PIVOT.x - 8} ${PIVOT.y} h16 l6 148 h-28z" fill="#b07a43" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${PIVOT.x - 62} ${PIVOT.y + 168} q2 -22 62 -22 q60 0 62 22z" fill="#b07a43" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>
      ${pan(L)}${pan(R)}
      <line x1="${L.x}" y1="${L.y}" x2="${R.x}" y2="${R.y}" stroke="#1d3557" stroke-width="15" stroke-linecap="round"/>
      <line x1="${L.x}" y1="${L.y}" x2="${R.x}" y2="${R.y}" stroke="#e0a45f" stroke-width="9" stroke-linecap="round"/>
      <circle cx="${PIVOT.x}" cy="${PIVOT.y}" r="9" fill="#ffd23f" stroke="#7a5128" stroke-width="3"/>
      ${balance.panItems("left", L.x, L.y + DROP, "left")}${balance.panItems("right", R.x, R.y + DROP, "right")}`;
  },
  tiltTo(target) {
    const t = task, from = t.theta, start = performance.now(), dur = 600;
    const id = (t.anim = (t.anim || 0) + 1); // a newer tilt takes over from this one
    if (reduced) { t.theta = target; balance.draw(); return Promise.resolve(); }
    return new Promise((done) => {
      const step = (now) => {
        if (task !== t || t.anim !== id) return done();
        const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
        t.theta = from + (target - from) * e; balance.draw();
        if (k < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
  },
  tapObject(e) {
    const t = task, g = e.target.closest(".obj-hit");
    if (!g || busy) return;
    const obj = g.dataset.obj, want = t.ask === "heavier" ? t.heavier : t.lighter;
    if (obj === want) win(g, `Yes! The ${obj}`, `Yes! The ${obj} is ${t.ask}.`);
    else { shakeEl(t.svg); miss(t.ask === "heavier" ? "Look at the scale. The heavier side goes down." : "Look at the scale. The lighter side goes up."); }
  },
  async tryNumber(n, btn) {
    const t = task;
    if (busy) return;
    busy = true;
    t.right = [{ n: t.c }, { n }];
    click();
    await balance.tiltTo(balance.numTilt());
    if (task !== t) return;
    if (n === t.d) {
      balance.showEq(true);
      const lhs = t.left.map((x) => x.n).join(" + ");
      win(btn, `${lhs} = ${t.c} + ${n}`, `Yes! Both sides make ${t.s}.`);
      return;
    }
    btn.disabled = true;
    miss(n > t.d ? "Too heavy! Try a smaller number." : "Not heavy enough! Try a bigger number.");
    later(() => {
      t.right = [{ n: t.c }, { q: true }];
      balance.tiltTo(balance.numTilt());
      busy = false; // ready for another go while the scale swings back
    }, 900);
  },
};
// Plays the right answer through the real controls (used by ?selftest).
balance.test = {
  async answer() {
    const t = task;
    await wait(650);
    if (t.kind === "weigh") return tap(t.svg.querySelector(`.obj-hit[data-obj="${t.ask === "heavier" ? t.heavier : t.lighter}"] rect`));
    tapChoice(t.d);
  },
};
GAMES.balance = balance;
