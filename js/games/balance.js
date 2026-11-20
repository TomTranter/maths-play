// Balance Scales — heavier/lighter, then making both sides equal.
// NC Y1: compare mass (heavier/lighter); represent and use number bonds; understand = and solve
// missing number problems such as 7 = ? − 9. NC Y2: recognise and use the = sign.
"use strict";

const SCALE_OBJECTS = {
  feather: { w: 1, svg: '<path d="M8 50 C 20 30, 36 14, 54 8 C 50 26, 36 42, 14 50 Z" fill="#f4efe3" stroke="#8a93a0" stroke-width="2.5"/><path d="M6 54 L40 22" stroke="#8a93a0" stroke-width="2.5" stroke-linecap="round"/>' },
  apple: { w: 3, svg: '<path d="M30 18 C 18 10 4 18 7 34 C 10 50 22 58 30 53 C 38 58 50 50 53 34 C 56 18 42 10 30 18 Z" fill="#e63946" stroke="#9d1c27" stroke-width="2.5"/><path d="M30 18 q1 -8 6 -12" stroke="#7a5128" stroke-width="3.5" fill="none" stroke-linecap="round"/>' },
  book: { w: 5, svg: '<rect x="6" y="14" width="48" height="38" rx="3" fill="#3aa6e8" stroke="#13558a" stroke-width="2.5"/><rect x="10" y="44" width="40" height="5" fill="#fff"/><rect x="14" y="20" width="24" height="4" rx="2" fill="#d4f0ff"/>' },
  pumpkin: { w: 8, svg: '<ellipse cx="30" cy="36" rx="25" ry="19" fill="#ff9f1c" stroke="#a85a00" stroke-width="2.5"/><path d="M30 17 v38 M18 20 q-6 16 0 32 M42 20 q6 16 0 32" stroke="#a85a00" stroke-width="2" fill="none"/><path d="M30 18 q0 -8 6 -12" stroke="#3f8f33" stroke-width="4" fill="none" stroke-linecap="round"/>' },
  watermelon: { w: 10, svg: '<ellipse cx="30" cy="34" rx="27" ry="20" fill="#2ec27e" stroke="#0f6b40" stroke-width="2.5"/><path d="M12 22 q8 12 0 24 M24 15 q8 19 0 38 M36 15 q-8 19 0 38 M48 22 q-8 12 0 24" stroke="#0f6b40" stroke-width="3" fill="none"/>' },
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
      <path d="M${p.x - 60} ${p.y + DROP} h120 q-60 26 -120 0z" fill="#d9dde3" stroke="#7b8492" stroke-width="3"/>`;
    t.svg.innerHTML = `
      <rect x="${PIVOT.x - 7}" y="${PIVOT.y}" width="14" height="158" rx="4" fill="#7a5128"/>
      <rect x="${PIVOT.x - 60}" y="${PIVOT.y + 154}" width="120" height="14" rx="6" fill="#7a5128"/>
      ${pan(L)}${pan(R)}
      <line x1="${L.x}" y1="${L.y}" x2="${R.x}" y2="${R.y}" stroke="#b07a43" stroke-width="12" stroke-linecap="round"/>
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
GAMES.balance = balance;
