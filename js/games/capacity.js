// Full or Empty — capacity and volume. NC Y1: compare, describe and solve practical problems for
// capacity and volume (full/empty, more than, less than, half, half full, quarter).
// NC Y2: compare and order volume/capacity and record the results using >, < and =.
"use strict";

const FILL_STATES = { full: 1, "nearly full": 0.85, "half full": 0.5, "nearly empty": 0.15, empty: 0 };
// Pouring moves in eighths; these are the eighths that count as each state.
const STATE_EIGHTHS = { full: [8], "nearly full": [6, 7], "half full": [4], "nearly empty": [1, 2], empty: [0] };
const CONTAINERS = {
  jug: { cupsMin: 4 }, bottle: { cupsMin: 2 }, bucket: { cupsMin: 6 }, vase: { cupsMin: 3 },
};

let glassId = 0;
// A glass (tapered beaker) filled to `level` (0..1).
function glassSVG(level, opts = {}) {
  const id = `gc${++glassId}`, top = 14, bottom = 146, waterY = bottom - (bottom - top) * level;
  const shape = "M20 14 L100 14 L90 146 Q90 152 84 152 L36 152 Q30 152 30 146 Z";
  return `<svg viewBox="0 0 120 160" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
    <path d="${shape}" fill="#f2fbff"/>
    <rect class="water" x="0" y="${waterY.toFixed(1)}" width="120" height="${(160 - waterY).toFixed(1)}" fill="#5fb8ec" clip-path="url(#${id})"/>
    ${level > 0 && level < 1 ? `<line x1="10" y1="${waterY.toFixed(1)}" x2="110" y2="${waterY.toFixed(1)}" stroke="#3a8cc4" stroke-width="3" clip-path="url(#${id})"/>` : ""}
    ${opts.marks ? [0.25, 0.5, 0.75].map((f) => `<line x1="92" y1="${bottom - (bottom - top) * f}" x2="100" y2="${bottom - (bottom - top) * f}" stroke="#8a93a0" stroke-width="2"/>`).join("") : ""}
    <path d="${shape}" fill="none" stroke="#1d3557" stroke-width="5" stroke-linejoin="round"/>
    <path d="M30 26 L36 130" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>
  </svg>`;
}
function containerSVG(kind) {
  const water = "#5fb8ec", ink = "#1d3557";
  const shapes = {
    jug: `<path d="M24 30 H86 L80 140 Q80 148 72 148 H38 Q30 148 30 140 Z" fill="${water}" stroke="${ink}" stroke-width="5"/><path d="M86 46 q22 4 18 30 q-4 22 -22 22" fill="none" stroke="${ink}" stroke-width="6"/><path d="M24 30 l-8 -10 h18" fill="none" stroke="${ink}" stroke-width="5"/>`,
    bottle: `<path d="M48 14 H72 V40 Q90 50 90 70 V140 Q90 148 82 148 H38 Q30 148 30 140 V70 Q30 50 48 40 Z" fill="${water}" stroke="${ink}" stroke-width="5"/><rect x="46" y="6" width="28" height="12" rx="3" fill="#ff4d6d" stroke="${ink}" stroke-width="4"/>`,
    bucket: `<path d="M14 40 H106 L94 146 H26 Z" fill="${water}" stroke="${ink}" stroke-width="5"/><path d="M14 40 Q60 -10 106 40" fill="none" stroke="${ink}" stroke-width="5"/>`,
    vase: `<path d="M44 14 H76 Q70 34 84 60 Q100 96 80 140 Q76 148 68 148 H52 Q44 148 40 140 Q20 96 36 60 Q50 34 44 14 Z" fill="${water}" stroke="${ink}" stroke-width="5"/>`,
  };
  return `<svg viewBox="0 0 120 160" aria-hidden="true">${shapes[kind]}</svg>`;
}
const CUP = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M5 6 H25 L22 26 H8 Z" fill="#ffd23f" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/></svg>';

const capacity = {
  id: "capacity", name: "Full or Empty", strand: "Capacity",
  levels: [
    { label: "Full, half full, empty", kind: "spot" },
    { label: "Fill it up", kind: "fill" },
    { label: "Which holds more?", kind: "compare" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[[10, 1], [44, 0.5], [78, 0]].map(([x, l]) => `<g transform="translate(${x} 8) scale(.27 .48)">${glassSVG(l).replace(/<\/?svg[^>]*>/g, "")}</g>`).join("")}
  </svg>`,
  next() {
    const L = level(capacity);
    const t = newTask({ kind: L.kind });
    $("ground").replaceChildren();
    if (L.kind === "spot") {
      const states = shuffle(Object.keys(FILL_STATES)).slice(0, 3);
      const want = pick(states);
      t.want = want;
      const row = h('<div class="glasses"></div>');
      states.forEach((s) => {
        const b = h(`<button class="glass-btn" aria-label="${s}">${glassSVG(FILL_STATES[s])}</button>`);
        b.onclick = () => {
          if (busy) return;
          if (s === want) win(b, `Yes! ${want}`, `Yes! That glass is ${want}.`);
          else { b.disabled = true; shakeEl(b); miss("Look at how much water is in each glass."); }
        };
        row.append(b);
      });
      $("stage").replaceChildren(row);
      setInstruction(`Which glass is <b>${want}</b>?`, `Which glass is ${want}?`);
    } else if (L.kind === "fill") {
      const want = pick(["full", "half full", "nearly full", "nearly empty", "empty"]);
      const start = want === "empty" || want === "nearly empty" ? 8 : 0;
      Object.assign(t, { want, eighths: start });
      const wrap = h('<div class="fill-wrap"><div class="glass-big"></div><div class="pour-row"></div></div>');
      t.glass = wrap.querySelector(".glass-big");
      const pour = h('<button class="soft pour">Pour</button>'), tip = h('<button class="soft pour">Tip out</button>');
      pour.onclick = () => capacity.change(1);
      tip.onclick = () => capacity.change(-1);
      wrap.querySelector(".pour-row").append(tip, pour);
      $("stage").replaceChildren(wrap);
      capacity.renderGlass();
      setInstruction(`Make the glass <b>${want}</b>`, `Make the glass ${want}. Tap pour or tip out.`);
      checkRow((btn) => capacity.checkFill(btn));
    } else {
      const [a, b] = shuffle(Object.keys(CONTAINERS)).slice(0, 2);
      let ca, cb;
      do { ca = rand(2, 10); cb = rand(2, 10); } while (Math.abs(ca - cb) < 2);
      const more = Math.random() < 0.6;
      const answer = (ca > cb) === more ? a : b;
      const row = h('<div class="containers"></div>');
      [[a, ca], [b, cb]].forEach(([k, n]) => {
        const btn = h(`<button class="container-btn" aria-label="${k}">${containerSVG(k)}<span class="cups">${CUP.repeat(n)}</span><span class="c-name">${k}: ${n} cups</span></button>`);
        btn.onclick = () => {
          if (busy) return;
          if (k === answer) win(btn, `Yes! The ${k}`, `Yes! The ${k} holds ${more ? "more" : "less"}.`);
          else { btn.disabled = true; shakeEl(btn); miss("Count the cups each one holds."); }
        };
        row.append(btn);
      });
      $("stage").replaceChildren(row);
      setInstruction(`Which holds <b>${more ? "more" : "less"}</b>?`, `Which holds ${more ? "more" : "less"}? Count the cups.`);
    }
  },
  renderGlass() { task.glass.innerHTML = glassSVG(task.eighths / 8, { marks: true }); },
  change(d) {
    const t = task;
    if (busy) return;
    const e = Math.max(0, Math.min(8, t.eighths + d));
    if (e === t.eighths) return;
    t.eighths = e;
    tone(d > 0 ? 400 + e * 60 : 900 - e * 50, 0, 0.12, { type: "sine", vol: 0.14, to: d > 0 ? 500 + e * 60 : 700 - e * 50 });
    capacity.renderGlass();
  },
  checkFill(btn) {
    const t = task;
    const ok = STATE_EIGHTHS[t.want];
    if (ok.includes(t.eighths)) win(btn, `Yes! ${t.want}`, `Yes! The glass is ${t.want}.`);
    else { shakeEl(t.glass); miss(t.eighths > Math.max(...ok) ? "Too much! Tip some out." : "Pour some more."); }
  },
};
GAMES.capacity = capacity;
