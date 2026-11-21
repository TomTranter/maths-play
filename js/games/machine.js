// Number Machine — function machines. NC Y2: recognise and use the inverse relationship between
// addition and subtraction; solve problems with addition and subtraction (and doubling).
"use strict";

const MACHINE_DOUBLE = "double";
// A rule is { op: "add" | "take" | "double", k }. Its label is what is written on the machine and spoken.
const machineLabel = (r) => (r.op === "double" ? MACHINE_DOUBLE : `${r.op === "add" ? "add" : "take away"} ${r.k}`);
const machineApply = (r, n) => (r.op === "add" ? n + r.k : r.op === "take" ? n - r.k : n * 2);

// The machine body: a hopper on top, blinking lights, and a panel with the rule on it.
const machineBody = (label) => `<div class="machine-box">
  <svg class="machine-hopper" viewBox="0 0 100 30" aria-hidden="true"><path d="M8 2 H92 L66 28 H34 Z" fill="#ffd23f" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/></svg>
  <div class="machine-lights"><i></i><i></i><i></i></div>
  <div class="machine-rule">${label}</div>
  <svg class="machine-gear" viewBox="0 0 40 40" aria-hidden="true"><g fill="#ffd23f" stroke="#1d3557" stroke-width="2.5"><path d="M17 2h6l1 6 5 2 5-4 4 4-4 5 2 5 6 1v6l-6 1-2 5 4 5-4 4-5-4-5 2-1 6h-6l-1-6-5-2-5 4-4-4 4-5-2-5-6-1v-6l6-1 2-5-4-5 4-4 5 4 5-2z"/><circle cx="20" cy="20" r="6" fill="#fff"/></g></svg>
</div>`;

const machine = {
  id: "machine", name: "Number Machine", strand: "Inverse & rules",
  levels: [
    { label: "What comes out?", kind: "out" },
    { label: "What went in?", kind: "in" },
    { label: "What is the rule?", kind: "rule" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <path d="M36 10 H84 L72 22 H48 Z" fill="#ffd23f" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>
    <rect x="30" y="22" width="60" height="54" rx="10" fill="#9b5de5" stroke="#1d3557" stroke-width="3"/>
    <circle cx="44" cy="32" r="4" fill="#ff4d6d"/><circle cx="60" cy="32" r="4" fill="#2ec27e"/><circle cx="76" cy="32" r="4" fill="#3aa6e8"/>
    <rect x="38" y="42" width="44" height="22" rx="5" fill="#fff" stroke="#1d3557" stroke-width="2"/>
    <text x="60" y="59" text-anchor="middle" font-size="16" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">+3</text>
    <circle cx="14" cy="50" r="11" fill="#fff" stroke="#1d3557" stroke-width="2.5"/>
    <text x="14" y="56" text-anchor="middle" font-size="15" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">4</text>
    <circle cx="106" cy="50" r="11" fill="#fff" stroke="#1d3557" stroke-width="2.5"/>
    <text x="106" y="56" text-anchor="middle" font-size="15" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">7</text>
  </svg>`,
  css: `
    .machine-wrap {
      display: grid; grid-template-columns: auto auto auto; align-items: center; justify-items: center;
      column-gap: clamp(6px, 2.5vw, 20px); row-gap: clamp(8px, 2vh, 18px); max-width: 100%;
    }
    .machine-ball {
      width: clamp(60px, 17vw, 104px); aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center;
      background: var(--paper); border: 4px solid var(--ink); box-shadow: 0 5px 0 var(--lift);
      font-size: clamp(1.8rem, 8vw, 3.2rem); font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums;
    }
    .machine-ball.machine-q { border-style: dashed; border-color: var(--pink); color: var(--pink); background: var(--paper-soft); }
    .machine-ball.machine-in { animation: machine-drop 0.6s ease-in both; }
    .machine-ball.machine-out { animation: machine-pop 0.45s ease-out both; }
    .machine-ball.machine-snap { animation: bump 0.4s ease-out; }
    .machine-label { font-size: clamp(0.9rem, 3.4vw, 1.2rem); font-weight: 800; color: var(--muted); grid-row: 1; grid-column: 1; }
    .machine-label-out { grid-column: 3; }
    .machine-box {
      position: relative; grid-column: 2; width: clamp(116px, 34vw, 230px); padding: clamp(10px, 2.4vh, 18px) 10px clamp(12px, 2.6vh, 20px);
      border-radius: 22px; border: 4px solid var(--ink); background: linear-gradient(#b57cf0, #7b3fd0);
      box-shadow: 0 7px 0 var(--lift); display: grid; justify-items: center; gap: clamp(6px, 1.4vh, 12px);
      animation: machine-chug 0.5s ease-in-out 0.55s 2;
    }
    .machine-hopper { position: absolute; top: clamp(-28px, -3.4vh, -20px); width: 64%; height: auto; }
    .machine-lights { display: flex; gap: 10px; }
    .machine-lights i { width: 12px; height: 12px; border-radius: 50%; background: #ff4d6d; border: 2px solid var(--ink); animation: machine-blink 0.6s steps(1) infinite; }
    .machine-lights i:nth-child(2) { background: #2ec27e; animation-delay: 0.2s; }
    .machine-lights i:nth-child(3) { background: #3aa6e8; animation-delay: 0.4s; }
    .machine-rule {
      background: var(--paper); border: 3px solid var(--ink); border-radius: 12px; padding: 4px 10px; text-align: center;
      font-size: clamp(1.15rem, 5vw, 2rem); font-weight: 800; line-height: 1.1; color: var(--ink); min-width: 70%;
    }
    .machine-rule.machine-q { color: var(--pink); }
    .machine-gear { width: clamp(28px, 7vw, 40px); height: auto; animation: machine-spin 2.4s linear infinite; }
    @keyframes machine-drop { from { transform: translateY(-30vh); opacity: 0; } 60% { opacity: 1; } }
    @keyframes machine-pop { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
    @keyframes machine-chug { 25% { transform: rotate(-3deg) scale(1.03); } 75% { transform: rotate(3deg) scale(1.03); } }
    @keyframes machine-blink { 50% { opacity: 0.25; } }
    @keyframes machine-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .machine-ball, .machine-box, .machine-gear, .machine-lights i { animation: none !important; }
    }
  `,

  // A ball (in or out). `q` shows a "?" waiting for the answer. `delay` staggers the animation.
  ball(cls, n, q, delay) {
    return `<div class="machine-ball ${cls}${q ? " machine-q" : ""}" style="animation-delay:${delay}s">${q ? "?" : n}</div>`;
  },

  next() {
    const L = level(machine);
    if (L.kind === "rule") return machine.nextRule();
    // Levels 1 and 2: add or take away 1 to 5, numbers 0 to 20.
    const k = rand(1, 5);
    const r = { op: pick(["add", "take"]), k };
    const a = r.op === "add" ? rand(1, 20 - k) : rand(k, 20);
    const b = machineApply(r, a);
    const askOut = L.kind === "out";
    const answer = askOut ? b : a;
    const t = newTask({ answer, kind: L.kind });
    const label = machineLabel(r);
    const wrap = h(`<div class="machine-wrap">
      <span class="machine-label">in</span><span class="machine-label machine-label-out">out</span>
      ${machine.ball("machine-in", a, !askOut, 0)}
      ${machineBody(label)}
      ${machine.ball("machine-out", b, askOut, 1.4)}
    </div>`);
    wrap.querySelector(".machine-box").style.gridRow = "2";
    wrap.querySelectorAll(".machine-ball").forEach((el, n) => { el.style.gridRow = "2"; el.style.gridColumn = n ? "3" : "1"; });
    t.qEl = wrap.querySelector(".machine-q");
    t.onWin = () => { t.qEl.textContent = answer; t.qEl.classList.remove("machine-q", "machine-in", "machine-out"); t.qEl.style.animationDelay = "0s"; t.qEl.classList.add("machine-snap"); };
    $("stage").replaceChildren(wrap);
    const ruleSay = `The rule is ${label}.`;
    if (askOut) {
      setInstruction(`<b>${a}</b> goes in. What comes <b>out</b>?`, `${a} goes in. ${ruleSay} What comes out?`);
      const wrongOp = r.op === "add" ? a - k : a + k;
      choices(b, distractors(b, 0, 20, [-1, 1, -2, 2], [wrongOp, a]), r.op === "add" ? `Count on ${k}.` : `Count back ${k}.`, `Yes! ${b}`, `Yes! ${b} comes out.`);
    } else {
      setInstruction(`<b>${b}</b> comes out. What went <b>in</b>?`, `${b} comes out. ${ruleSay} What went in?`);
      const forward = r.op === "add" ? b + k : b - k; // the rule done again instead of undone
      choices(a, distractors(a, 0, 20, [-1, 1, -2, 2], [forward, b]), `Undo the rule. ${r.op === "add" ? "Count back" : "Count on"} ${k}.`, `Yes! ${a}`, `Yes! ${a} went in.`);
    }
  },

  // Level 3: two numbers go in, two come out; which rule did it?
  nextRule() {
    const r = Math.random() < 0.25 ? { op: "double", k: 2 } : { op: pick(["add", "take"]), k: rand(1, 5) };
    const lo = r.op === "take" ? r.k : 1;
    const hi = r.op === "double" ? 10 : r.op === "add" ? 20 - r.k : 20;
    const x1 = rand(lo, hi);
    let x2 = rand(lo, hi);
    while (x2 === x1) x2 = rand(lo, hi);
    const pairs = [[x1, machineApply(r, x1)], [x2, machineApply(r, x2)]].sort((p, q) => p[0] - q[0]);
    const answer = machineLabel(r);
    newTask({ answer, kind: "rule" });
    // Wrong rules that are close but do NOT fit both pairs.
    const cands = [];
    for (let k = 1; k <= 5; k++) for (const op of ["add", "take"]) cands.push({ op, k });
    cands.push({ op: "double", k: 2 });
    const fits = (c) => pairs.every(([i, o]) => machineApply(c, i) === o);
    const near = cands.filter((c) => !fits(c) && (c.op === r.op ? Math.abs(c.k - r.k) <= 2 : c.op === "double" || r.op === "double" || c.k === r.k));
    const pool = near.length >= 2 ? near : cands.filter((c) => !fits(c));
    const wrongs = shuffle(pool).slice(0, 2).map(machineLabel);
    const rows = pairs.map(([i, o], n) => `
      ${machine.ball("machine-in", i, false, n * 0.5)}
      ${machine.ball("machine-out", o, false, 1.4 + n * 0.5)}`);
    const wrap = h(`<div class="machine-wrap">
      <span class="machine-label">in</span><span class="machine-label machine-label-out">out</span>
      ${rows.join("")}
    </div>`);
    const box = h(machineBody("?"));
    box.querySelector(".machine-rule").classList.add("machine-q");
    box.style.gridRow = "2 / span 2";
    wrap.append(box);
    const balls = wrap.querySelectorAll(".machine-ball");
    balls.forEach((el, n) => { el.style.gridRow = String(2 + Math.floor(n / 2)); el.style.gridColumn = n % 2 ? "3" : "1"; });
    task.onWin = () => { const p = box.querySelector(".machine-rule"); p.textContent = answer; p.classList.remove("machine-q"); };
    $("stage").replaceChildren(wrap);
    setInstruction("What is the <b>rule</b>?", "What is the rule? Look at both numbers.");
    choices(answer, wrongs, "Look at how much each number changes.", `Yes! ${answer}`, `Yes! The rule is ${answer}.`, { wide: true });
  },

  voiceLines() {
    const lines = [
      "What comes out?", "What went in?", "Undo the rule.",
      "What is the rule?", "Look at both numbers.", "Look at how much each number changes.",
      `The rule is ${MACHINE_DOUBLE}.`,
    ];
    for (let n = 0; n <= 20; n++) lines.push(`${n} comes out.`);
    for (let n = 1; n <= 20; n++) lines.push(`${n} goes in.`, `${n} went in.`);
    for (let k = 1; k <= 5; k++) {
      lines.push(`The rule is add ${k}.`, `The rule is take away ${k}.`, `Count on ${k}.`, `Count back ${k}.`);
    }
    return lines;
  },

  test: {
    answer() {
      [...document.querySelectorAll("#ground .choice")].find((b) => b.textContent === String(task.answer)).click();
    },
  },
};
addGame(machine);
