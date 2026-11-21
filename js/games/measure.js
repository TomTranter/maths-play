// Measure It — compare and measure lengths. NC Y1: compare, describe and solve practical problems
// for lengths (long/short, longer/shorter); measure using non-standard units. NC Y2: choose and use
// appropriate standard units to estimate and measure length in centimetres using a ruler.
"use strict";

const U = 40; // one cube / one centimetre in drawing units
const SNAKE_COLS = { red: "#ff4d6d", blue: "#3aa6e8", green: "#2ec27e", yellow: "#f5c400", purple: "#9b5de5" };
const MEASURE_OBJS = ["pencil", "worm", "crayon", "train"];

// Draw an object `len` units long starting at x, centred vertically on y.
function measureObj(kind, x, y, len, color = "#ff4d6d") {
  const w = len * U;
  if (kind === "snake") {
    return `<rect x="${x}" y="${y - 13}" width="${w - 10}" height="26" rx="13" fill="${color}" stroke="#1d3557" stroke-width="3"/>
      ${Array.from({ length: Math.max(0, len - 1) }, (_, i) => `<circle cx="${x + 20 + i * U}" cy="${y}" r="4" fill="#fff" opacity=".6"/>`).join("")}
      <circle cx="${x + w - 14}" cy="${y}" r="16" fill="${color}" stroke="#1d3557" stroke-width="3"/>
      <circle cx="${x + w - 9}" cy="${y - 5}" r="4" fill="#1d3557"/><path d="M${x + w + 1} ${y + 3} l7 2 l-7 2" stroke="#d6336c" stroke-width="2" fill="none"/>`;
  }
  if (kind === "pencil") {
    return `<rect x="${x}" y="${y - 13}" width="12" height="26" rx="4" fill="#f15bb5" stroke="#1d3557" stroke-width="3"/>
      <rect x="${x + 12}" y="${y - 13}" width="${w - 42}" height="26" fill="#ffd23f" stroke="#1d3557" stroke-width="3"/>
      <path d="M${x + w - 30} ${y - 13} L${x + w} ${y} L${x + w - 30} ${y + 13} Z" fill="#f3d6a4" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${x + w - 9} ${y - 4} L${x + w} ${y} L${x + w - 9} ${y + 4} Z" fill="#1d3557"/>`;
  }
  if (kind === "crayon") {
    return `<rect x="${x}" y="${y - 12}" width="${w - 26}" height="24" rx="4" fill="#3aa6e8" stroke="#1d3557" stroke-width="3"/>
      <rect x="${x + 10}" y="${y - 12}" width="${Math.max(10, w - 56)}" height="24" fill="#fff" opacity=".55"/>
      <path d="M${x + w - 26} ${y - 12} L${x + w} ${y - 3} L${x + w} ${y + 3} L${x + w - 26} ${y + 12} Z" fill="#3aa6e8" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>`;
  }
  if (kind === "worm") {
    return `<rect x="${x}" y="${y - 12}" width="${w}" height="24" rx="12" fill="#f7a8c4" stroke="#c2577f" stroke-width="3"/>
      ${Array.from({ length: Math.max(0, len * 2 - 2) }, (_, i) => `<path d="M${x + 16 + i * (U / 2)} ${y - 9} v18" stroke="#c2577f" stroke-width="2"/>`).join("")}
      <circle cx="${x + w - 10}" cy="${y - 3}" r="3" fill="#1d3557"/>`;
  }
  // train: one carriage per unit
  return Array.from({ length: len }, (_, i) => {
    const cx = x + i * U, engine = i === len - 1;
    return `<rect x="${cx + 2}" y="${y - 16}" width="${U - 4}" height="24" rx="4" fill="${engine ? "#ff4d6d" : "#2ec27e"}" stroke="#1d3557" stroke-width="2.5"/>
      ${engine ? `<rect x="${cx + 22}" y="${y - 26}" width="10" height="12" fill="#1d3557"/>` : ""}
      <circle cx="${cx + 11}" cy="${y + 11}" r="5" fill="#1d3557"/><circle cx="${cx + U - 11}" cy="${y + 11}" r="5" fill="#1d3557"/>`;
  }).join("");
}

const measure = {
  id: "measure", name: "Measure It", strand: "Length",
  levels: [
    { label: "Longer, shorter", kind: "compare" },
    { label: "Measure with cubes", kind: "cubes" },
    { label: "Use a ruler", kind: "ruler" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <g transform="translate(8 14) scale(.25)">${measureObj("pencil", 0, 40, 10)}</g>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${8 + i * 10}" y="34" width="10" height="10" fill="#3aa6e8" stroke="#13558a" stroke-width="1.5"/>`).join("")}
    <rect x="6" y="58" width="108" height="22" rx="3" fill="#fff3c4" stroke="#e0a800" stroke-width="2"/>
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${10 + i * 10} 58 v${i % 5 ? 6 : 10}" stroke="#1d3557" stroke-width="1.5"/>`).join("")}
  </svg>`,
  next() {
    const L = level(measure);
    const t = newTask({ kind: L.kind });
    $("ground").replaceChildren();
    if (L.kind === "compare") {
      const many = Math.random() < 0.5;
      const cols = shuffle(Object.keys(SNAKE_COLS)).slice(0, many ? 3 : 2);
      let lens;
      do { lens = cols.map(() => rand(3, 12)); } while (lens.some((a, i) => lens.some((b, j) => i !== j && Math.abs(a - b) < 2)));
      const want = pick(many ? ["longest", "shortest"] : ["longer", "shorter"]);
      const pickIdx = want.startsWith("long") ? lens.indexOf(Math.max(...lens)) : lens.indexOf(Math.min(...lens));
      Object.assign(t, { cols, lens, want, answer: cols[pickIdx] });
      const H = cols.length * 70 + 20;
      const body = cols.map((c, i) => `<g class="snake-hit" data-c="${c}"><rect x="0" y="${10 + i * 70}" width="${13 * U}" height="60" fill="transparent"/>${measureObj("snake", 20, 40 + i * 70, lens[i], SNAKE_COLS[c])}</g>`).join("");
      const wrap = h(`<div class="measure"><svg viewBox="0 0 ${13 * U + 40} ${H}" role="img" aria-label="Snakes">${body}</svg></div>`);
      t.svg = wrap.querySelector("svg");
      t.svg.addEventListener("click", (e) => {
        const g = e.target.closest(".snake-hit");
        if (!g || busy) return;
        const phrase = want === "longer" || want === "shorter" ? want : `the ${want}`;
        if (g.dataset.c === t.answer) win(g, `Yes! The ${t.answer} snake`, `Yes! The ${t.answer} snake is ${phrase}.`);
        else { shakeEl(t.svg); miss("Look at where each snake ends."); }
      });
      $("stage").replaceChildren(wrap);
      const q = want === "longer" || want === "shorter" ? `Which snake is <b>${want}</b>?` : `Which snake is the <b>${want}</b>?`;
      setInstruction(q, q.replace(/<\/?b>/g, ""));
      return;
    }
    const obj = pick(MEASURE_OBJS);
    if (L.kind === "cubes") {
      const n = rand(3, 10);
      Object.assign(t, { obj, n });
      const cubes = Array.from({ length: 12 }, (_, i) => `<rect class="unit-cube" x="${20 + i * U}" y="80" width="${U}" height="${U}" rx="4"/>`).join("");
      const wrap = h(`<div class="measure"><svg viewBox="0 0 ${12 * U + 40} 136" role="img" aria-label="${obj} and cubes">${measureObj(obj, 20, 46, n)}${cubes}<line x1="20" y1="20" x2="20" y2="124" class="start-line"/></svg></div>`);
      $("stage").replaceChildren(wrap);
      setInstruction(`How long is the <b>${obj}</b>?`, `How long is the ${obj}? Count the cubes.`);
      choices(n, distractors(n, 1, 12, [-1, 1, -2, 2]), "Count the cubes again.", `Yes! ${n} cubes`, `Yes! The ${obj} is ${n} cubes long.`);
      return;
    }
    // ruler
    const n = rand(2, 12), s = Math.random() < 0.6 ? 0 : rand(1, Math.min(3, 15 - n));
    Object.assign(t, { obj, n, s });
    const ticks = Array.from({ length: 151 }, (_, i) => {
      const x = 20 + (i / 10) * U, major = i % 10 === 0, mid = i % 5 === 0;
      return `<line x1="${x}" y1="86" x2="${x}" y2="${86 + (major ? 18 : mid ? 12 : 7)}" stroke="#1d3557" stroke-width="${major ? 2 : 1}"/>` +
        (major ? `<text x="${x}" y="126" text-anchor="middle" class="ruler-num">${i / 10}</text>` : "");
    }).join("");
    const wrap = h(`<div class="measure"><svg viewBox="0 0 ${15 * U + 40} 140" role="img" aria-label="${obj} on a ruler">
      ${measureObj(obj, 20 + s * U, 54, n)}
      <rect x="8" y="84" width="${15 * U + 24}" height="50" rx="6" fill="#fff3c4" stroke="#e0a800" stroke-width="3"/>${ticks}
      <line x1="${20 + s * U}" y1="30" x2="${20 + s * U}" y2="90" class="start-line"/><line x1="${20 + (s + n) * U}" y1="30" x2="${20 + (s + n) * U}" y2="90" class="start-line"/>
      <text x="${15 * U + 24}" y="126" text-anchor="end" class="ruler-unit">cm</text>
    </svg></div>`);
    $("stage").replaceChildren(wrap);
    setInstruction(`How long is the <b>${obj}</b>? (cm)`, `How long is the ${obj}? Use the ruler.`);
    const first = s ? [s + n] : [];
    choices(n, distractors(n, 1, 15, [-1, 1, -2, 2], first),
      s ? "It doesn't start at 0. Count the centimetres from where it starts." : "Look where it starts and where it ends.",
      `Yes! ${n} cm`, `Yes! The ${obj} is ${n} centimetres long.`);
  },
};
// Plays the right answer through the real controls (used by ?selftest).
measure.test = {
  answer() {
    const t = task;
    if (t.kind === "compare") return tap(t.svg.querySelector(`.snake-hit[data-c="${t.answer}"] rect`));
    tapChoice(t.n);
  },
};
GAMES.measure = measure;
