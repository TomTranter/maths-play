// Read the Scale — thermometers and measuring jugs. NC Y2: choose and use appropriate standard units to
// estimate and measure temperature (°C) and capacity (ml) to the nearest appropriate unit, using
// thermometers and measuring vessels; count in steps of 2, 5 and 10.
"use strict";

const scales = {
  id: "scales", name: "Read the Scale", strand: "Reading scales",
  levels: [
    { label: "Marks in 10s", step: 10 },
    { label: "Marks in 5s", step: 5 },
    { label: "Marks in 2s", step: 2 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="22" y="6" width="16" height="66" rx="8" fill="#fff" stroke="#1d3557" stroke-width="3"/><rect x="26" y="34" width="8" height="40" fill="#ff4d6d"/><circle cx="30" cy="76" r="10" fill="#ff4d6d" stroke="#1d3557" stroke-width="3"/>
    ${[14, 26, 38, 50, 62].map((y) => `<path d="M38 ${y} h8" stroke="#1d3557" stroke-width="2"/>`).join("")}
    <path d="M64 20 h40 l-4 62 h-32 z" fill="#f2fbff" stroke="#1d3557" stroke-width="3"/><path d="M66 50 h36 l-2.4 32 h-31.2 z" fill="#5fb8ec"/>
    ${[30, 42, 54, 66].map((y) => `<path d="M64 ${y} h10" stroke="#1d3557" stroke-width="2"/>`).join("")}
  </svg>`,
  next() {
    const L = level(scales);
    const kind = Math.random() < 0.5 ? "temp" : "jug";
    const step = L.step, max = step === 2 ? 50 : 100; // marks in 2s on a 0–100 scale would be too crowded
    let value = rand(1, max / step - 1) * step;
    if (step === 10 && Math.random() < 0.3) value = rand(1, 9) * 10;
    const t = newTask({ kind, value, step });
    // vertical scale: 0 at the bottom (y=250), 100 at the top (y=30)
    const y = (v) => 250 - (220 * v) / max;
    const marks = [];
    for (let v = 0; v <= max; v += step) {
      const major = v % 10 === 0;
      marks.push(`<line x1="${kind === "temp" ? 112 : 70}" y1="${y(v)}" x2="${(kind === "temp" ? 112 : 70) + (major ? 26 : 14)}" y2="${y(v)}" stroke="#1d3557" stroke-width="${major ? 3 : 2}"/>`);
      if (major && (step !== 10 || v % 20 === 0 || v === 100 || true)) marks.push(`<text x="${(kind === "temp" ? 112 : 70) + 34}" y="${y(v) + 7}" class="scale-num">${v}</text>`);
    }
    let body;
    if (kind === "temp") {
      body = `<rect x="70" y="20" width="36" height="244" rx="18" fill="#fff" stroke="#1d3557" stroke-width="4"/>
        <rect x="80" y="${y(value)}" width="16" height="${262 - y(value)}" fill="#ff4d6d"/>
        <circle cx="88" cy="276" r="24" fill="#ff4d6d" stroke="#1d3557" stroke-width="4"/>
        <text x="200" y="40" class="scale-unit">°C</text>`;
    } else {
      body = `<path d="M40 20 H160 L150 262 Q150 270 142 270 H58 Q50 270 50 262 Z" fill="#f2fbff" stroke="#1d3557" stroke-width="4"/>
        <path d="M${(42 + (8 * (y(value) - 20)) / 242).toFixed(1)} ${y(value)} H${(158 - (8 * (y(value) - 20)) / 242).toFixed(1)} L148 262 Q148 268 141 268 H59 Q52 268 52 262 Z" fill="#5fb8ec" opacity=".85"/>
        <line x1="45" y1="${y(value)}" x2="155" y2="${y(value)}" stroke="#2f7cb5" stroke-width="4"/>
        <path d="M160 40 q34 10 30 60 q-4 40 -36 50" fill="none" stroke="#1d3557" stroke-width="6"/>
        <text x="48" y="14" class="scale-unit">ml</text>`;
    }
    $("stage").replaceChildren(h(`<div class="scale-wrap"><svg viewBox="0 0 240 310" role="img" aria-label="${kind === "temp" ? "Thermometer" : "Measuring jug"}">${body}${marks.join("")}</svg></div>`));
    const unit = kind === "temp" ? "degrees" : "millilitres";
    if (kind === "temp") setInstruction("What <b>temperature</b> is it?", `What temperature is it? Each mark is ${step}.`);
    else setInstruction("How much <b>water</b> is in the jug?", `How much water is in the jug? Each mark is ${step}.`);
    const odd = value % 10 && step !== 10 ? [Math.floor(value / 10) * 10 + (value % 10) / step] : []; // counting marks as ones
    choices(value, distractors(value, 0, max, [-step, step, -2 * step, 2 * step], odd),
      `Find the nearest ten, then count on in ${step}s.`, `${value} ${kind === "temp" ? "°C" : "ml"}`,
      kind === "temp" ? `Yes! It's ${value} degrees.` : `Yes! There are ${value} millilitres.`,
      { fmt: (n) => `${n}${kind === "temp" ? "°" : " ml"}`, wide: true });
    t.unit = unit;
  },
};
// Plays the right answer through the real controls (used by ?selftest).
scales.test = {
  answer() { const t = task; tapChoice(t.kind === "temp" ? `${t.value}°` : `${t.value} ml`); },
};
GAMES.scales = scales;
