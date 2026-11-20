// Robot Route — program a robot to reach the star. NC Y1: describe position, direction and movement,
// including whole, half, quarter and three-quarter turns. NC Y2: order and arrange combinations;
// use mathematical vocabulary for position, direction and movement (straight line, rotation, left, right).
"use strict";

const ROBOT_N = 5, CELL = 100;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up, right, down, left
const ARROW = {
  F: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6 L32 20 H24 V34 H16 V20 H8 Z" fill="#1d3557"/></svg>',
  L: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M30 34 V20 a8 8 0 0 0 -8 -8 H16 V5 L4 15 L16 25 V18 H22 a2 2 0 0 1 2 2 V34 Z" fill="#1d3557"/></svg>',
  R: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 34 V20 a8 8 0 0 1 8 -8 H24 V5 L36 15 L24 25 V18 H18 a2 2 0 0 0 -2 2 V34 Z" fill="#1d3557"/></svg>',
};
const ROBOT_SVG = `<g class="robot-body">
  <line x1="0" y1="-38" x2="0" y2="-28" stroke="#1d3557" stroke-width="4"/><circle cx="0" cy="-40" r="6" fill="#ff4d6d" stroke="#1d3557" stroke-width="3"/>
  <rect x="-30" y="-28" width="60" height="56" rx="14" fill="#3aa6e8" stroke="#1d3557" stroke-width="4"/>
  <circle cx="-12" cy="-10" r="8" fill="#fff" stroke="#1d3557" stroke-width="3"/><circle cx="12" cy="-10" r="8" fill="#fff" stroke="#1d3557" stroke-width="3"/>
  <circle cx="-12" cy="-12" r="3.5" fill="#1d3557"/><circle cx="12" cy="-12" r="3.5" fill="#1d3557"/>
  <rect x="-14" y="8" width="28" height="7" rx="3.5" fill="#1d3557"/>
</g>`;
const STAR_PATH = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => {
  const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
  return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
}).join(" ");

const inGrid = ([x, y]) => x >= 0 && y >= 0 && x < ROBOT_N && y < ROBOT_N;
const addv = ([x, y], [dx, dy], k = 1) => [x + dx * k, y + dy * k];
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

const robot = {
  id: "robot", name: "Robot Route", strand: "Position & direction",
  levels: [
    { label: "Straight ahead", kind: "straight" },
    { label: "Left and right turns", kind: "turn" },
    { label: "Round the rocks", kind: "rocks" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${10 + (i % 4) * 25}" y="${8 + Math.floor(i / 4) * 25}" width="24" height="24" rx="3" fill="${(i + Math.floor(i / 4)) % 2 ? "#e6f6ea" : "#ffffff"}" stroke="#bcd8c4"/>`).join("")}
    <polygon points="${STAR_PATH(97, 70, 10)}" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/>
    <g transform="translate(22 20) scale(.28)">${ROBOT_SVG}</g>
    <path d="M22 34 V70 H84" stroke="#ff4d6d" stroke-width="3" stroke-dasharray="5 4" fill="none"/>
  </svg>`,
  next() {
    const L = level(robot);
    let start, dir, goal, rocks = [];
    for (let tries = 0; tries < 200; tries++) {
      start = [rand(0, ROBOT_N - 1), rand(0, ROBOT_N - 1)];
      dir = rand(0, 3);
      rocks = [];
      if (L.kind === "straight") {
        const room = robot.room(start, dir, []);
        if (!room) continue;
        goal = addv(start, DIRS[dir], rand(1, room));
      } else if (L.kind === "turn") {
        const a = rand(0, robot.room(start, dir, []));
        const mid = addv(start, DIRS[dir], a);
        const turn = pick([1, 3]); // right or left
        const d2 = (dir + turn) % 4, room = robot.room(mid, d2, []);
        if (!room) continue;
        goal = addv(mid, DIRS[d2], rand(1, room));
      } else {
        goal = [rand(0, ROBOT_N - 1), rand(0, ROBOT_N - 1)];
        if (Math.abs(goal[0] - start[0]) + Math.abs(goal[1] - start[1]) < 3) continue;
        const free = [];
        for (let x = 0; x < ROBOT_N; x++) for (let y = 0; y < ROBOT_N; y++) if (!same([x, y], start) && !same([x, y], goal)) free.push([x, y]);
        rocks = shuffle(free).slice(0, 4);
        if (!robot.reachable(start, goal, rocks)) continue;
        // make sure the rocks actually matter: the straight line ahead must not lead to the star
        if (robot.room(start, dir, rocks) >= 1 && same(addv(start, DIRS[dir], Math.abs(goal[0] - start[0]) + Math.abs(goal[1] - start[1])), goal)) continue;
      }
      if (!same(start, goal)) break;
    }
    const t = newTask({ L, start, dir, goal, rocks, pos: start, d: dir, angle: dir * 90, prog: [] });

    const cells = [];
    for (let y = 0; y < ROBOT_N; y++) for (let x = 0; x < ROBOT_N; x++) cells.push(`<rect x="${x * CELL + 3}" y="${y * CELL + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="10" class="${(x + y) % 2 ? "cell-a" : "cell-b"}"/>`);
    const rockSvg = rocks.map(([x, y]) => `<path class="rock" d="M${x * CELL + 18} ${y * CELL + 74} q-6 -26 16 -40 q14 -18 34 -4 q22 10 14 44 z"/>`).join("");
    const wrap = h(`<div class="robot-wrap">
      <svg class="robot-grid" viewBox="0 0 ${ROBOT_N * CELL} ${ROBOT_N * CELL}" role="img" aria-label="Robot grid">
        ${cells.join("")}${rockSvg}
        <polygon points="${STAR_PATH(goal[0] * CELL + 50, goal[1] * CELL + 50, 36)}" fill="#ffd23f" stroke="#e0a800" stroke-width="4"/>
        <g class="robot-pos">${ROBOT_SVG}</g>
      </svg>
      <div class="prog-strip" aria-label="Your steps"></div>
    </div>`);
    t.robotEl = wrap.querySelector(".robot-pos");
    t.strip = wrap.querySelector(".prog-strip");
    t.gridEl = wrap.querySelector("svg");
    $("stage").replaceChildren(wrap);
    robot.place(true);
    robot.renderStrip();

    const quarter = L.kind === "rocks";
    const g = $("ground"); g.innerHTML = "";
    const btn = (cmd, label) => {
      const b = h(`<button class="cmd-btn" data-cmd="${cmd}">${ARROW[cmd]}<span>${label}</span></button>`);
      b.onclick = () => robot.add(cmd);
      return b;
    };
    g.append(btn("F", "Forward"));
    if (L.kind !== "straight") { g.append(btn("L", quarter ? "¼ turn left" : "Turn left")); g.append(btn("R", quarter ? "¼ turn right" : "Turn right")); }
    const undo = h('<button class="soft cmd-undo" aria-label="Undo">⌫</button>');
    undo.onclick = () => { if (!busy && t.prog.length) { t.prog.pop(); click(false); robot.renderStrip(); } };
    const go = h(`<button class="check">${TICK}Go</button>`);
    go.onclick = () => robot.run(go);
    g.append(undo, go);

    if (L.kind === "straight") setInstruction("Help the robot get to the <b>star</b>", "Help the robot get to the star. Tap forward, then press Go.");
    else if (L.kind === "turn") setInstruction("Get to the <b>star</b>: go forward and turn", "Help the robot get to the star. Use forward and turns, then press Go.");
    else setInstruction("Go round the <b>rocks</b> to the star", "Get to the star. Go round the rocks with quarter turns.");
  },
  room(p, d, rocks) { // free cells straight ahead
    let n = 0, q = addv(p, DIRS[d]);
    while (inGrid(q) && !rocks.some((r) => same(r, q))) { n++; q = addv(q, DIRS[d]); }
    return n;
  },
  reachable(a, b, rocks) {
    const seen = new Set([a.join()]), queue = [a];
    while (queue.length) {
      const p = queue.shift();
      if (same(p, b)) return true;
      for (const d of DIRS) {
        const q = addv(p, d);
        if (inGrid(q) && !rocks.some((r) => same(r, q)) && !seen.has(q.join())) { seen.add(q.join()); queue.push(q); }
      }
    }
    return false;
  },
  place(instant) {
    const t = task, el = t.robotEl;
    if (instant) el.style.transition = "none";
    el.style.transform = `translate(${t.pos[0] * CELL + 50}px, ${t.pos[1] * CELL + 54}px) rotate(${t.angle}deg)`;
    if (instant) { void el.getBoundingClientRect(); el.style.transition = ""; }
  },
  renderStrip() {
    const t = task;
    t.strip.innerHTML = t.prog.length
      ? t.prog.map((c, i) => `<span class="step" data-i="${i}">${ARROW[c]}</span>`).join("")
      : '<span class="strip-hint">Your steps go here</span>';
  },
  add(cmd) {
    const t = task;
    if (busy || t.prog.length >= 14) return;
    t.prog.push(cmd); click(); robot.renderStrip();
  },
  reset() {
    const t = task;
    t.pos = t.start; t.d = t.dir; t.angle = t.dir * 90;
    t.strip.querySelectorAll(".step").forEach((s) => s.classList.remove("now"));
    robot.place(true);
  },
  async run(goBtn) {
    const t = task;
    if (busy) return;
    if (!t.prog.length) { say("Add some steps first."); return; }
    busy = true;
    robot.reset();
    const g = gen;
    const pause = () => wait(reduced ? 60 : 420);
    for (let i = 0; i < t.prog.length; i++) {
      const steps = t.strip.querySelectorAll(".step");
      steps.forEach((s, k) => s.classList.toggle("now", k === i));
      const c = t.prog[i];
      if (c === "L" || c === "R") {
        t.d = (t.d + (c === "R" ? 1 : 3)) % 4; t.angle += c === "R" ? 90 : -90;
        tone(c === "R" ? 660 : 560, 0, 0.1, { type: "triangle", vol: 0.12 });
        robot.place(); await pause(); if (g !== gen) return;
        continue;
      }
      const next = addv(t.pos, DIRS[t.d]);
      const rock = t.rocks.some((r) => same(r, next));
      if (!inGrid(next) || rock) {
        boing(); shakeEl(t.gridEl);
        task.mistakes++;
        say(rock ? "Oops! The robot hit a rock. Try again." : "Oops! The robot hit a wall. Try again.");
        await wait(1300); if (g !== gen) return;
        robot.reset(); busy = false; return;
      }
      t.pos = next; click(); robot.place(); await pause(); if (g !== gen) return;
    }
    if (same(t.pos, t.goal)) { win(goBtn, "Yes! Found the star", "Yes! The robot found the star."); return; }
    miss("Not there yet. Try again.");
    await wait(1300); if (g !== gen) return;
    robot.reset(); busy = false;
  },
};
GAMES.robot = robot;
