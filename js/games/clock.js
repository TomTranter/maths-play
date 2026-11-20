// Clock — read and set analogue times. NC Y1: tell the time to the hour and half past the hour
// and draw the hands to show these times. NC Y2: quarter past / quarter to.
"use strict";

function clockFace() {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i * Math.PI) / 30, big = i % 5 === 0;
    const r1 = big ? 84 : 88, r2 = 93;
    return `<line x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}" stroke="#1d3557" stroke-width="${big ? 3 : 1.2}" stroke-linecap="round"/>`;
  }).join("");
  const digits = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1, a = (n * Math.PI) / 6;
    return `<text class="digits" x="${(100 + 69 * Math.sin(a)).toFixed(1)}" y="${(100 - 69 * Math.cos(a) + 8).toFixed(1)}" text-anchor="middle">${n}</text>`;
  }).join("");
  return `<svg class="clockface" viewBox="0 0 200 200" role="img" aria-label="Clock">
    <circle cx="100" cy="100" r="97" fill="#ffffff" stroke="#1d3557" stroke-width="5"/>
    ${ticks}${digits}
    <g class="hand hour"><line x1="100" y1="108" x2="100" y2="54" stroke-width="10" stroke-linecap="round"/></g>
    <g class="hand minute"><line x1="100" y1="112" x2="100" y2="22" stroke-width="6" stroke-linecap="round"/></g>
    <circle cx="100" cy="100" r="7" fill="#1d3557"/>
  </svg>`;
}
const HAND_ICON = (len, color, w) => `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#fff" stroke="#1d3557" stroke-width="2"/><line x1="20" y1="22" x2="20" y2="${22 - len}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/><path d="M31 9 a15 15 0 0 1 4 9" fill="none" stroke="#1d3557" stroke-width="2.4" stroke-linecap="round"/><path d="M35.5 18.5 l-3.4 -1.4 3.2 -2.4z" fill="#1d3557"/></svg>`;

const timeLabel = (hr, m) =>
  m === 0 ? `${hr} o'clock` : m === 30 ? `half past ${hr}` : m === 15 ? `quarter past ${hr}` : `quarter to ${(hr % 12) + 1}`;

const clock = {
  id: "clock", name: "Clock", strand: "Telling the time",
  levels: [
    { label: "O'clock", mins: [0] },
    { label: "Half past", mins: [0, 30] },
    { label: "Quarter past & to", mins: [0, 15, 30, 45] },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <circle cx="60" cy="45" r="40" fill="#fff" stroke="#1d3557" stroke-width="4"/>
    ${[0, 3, 6, 9].map((k) => { const a = (k * Math.PI) / 6; return `<circle cx="${60 + 32 * Math.sin(a)}" cy="${45 - 32 * Math.cos(a)}" r="3" fill="#1d3557"/>`; }).join("")}
    <line x1="60" y1="45" x2="60" y2="13" stroke="#13558a" stroke-width="4" stroke-linecap="round"/>
    <line x1="60" y1="45" x2="81" y2="45" stroke="#e63946" stroke-width="6" stroke-linecap="round"/>
    <circle cx="60" cy="45" r="4" fill="#1d3557"/>
  </svg>`,
  next() {
    const L = level(clock);
    const kind = Math.random() < 0.55 ? "read" : "set";
    const nonZero = L.mins.filter((m) => m !== 0);
    const m = nonZero.length && Math.random() < 0.7 ? pick(nonZero) : 0;
    let hr = rand(1, 12);
    if (kind === "set" && hr === 12 && m === 0) hr = rand(1, 11);
    const t = newTask({ kind, th: hr, tm: m, h: 12, m: 0, ha: 0, ma: 0, mins: L.mins });

    const wrap = h(`<div class="clockwrap">${clockFace()}</div>`);
    t.hourEl = wrap.querySelector(".hand.hour");
    t.minEl = wrap.querySelector(".hand.minute");
    t.face = wrap.querySelector(".clockface");
    $("stage").replaceChildren(wrap);
    const label = timeLabel(hr, m);

    if (kind === "read") {
      t.h = hr; t.m = m;
      clock.render(true);
      setInstruction("What time is it?", "What time is it?");
      const wrongs = shuffle([
        ...L.mins.filter((x) => x !== m).map((x) => timeLabel(hr, x)),
        timeLabel((hr % 12) + 1, m),
        timeLabel(((hr + 10) % 12) + 1, m),
        timeLabel(((hr + 5) % 12) + 1, m),
      ]).filter((x, i, a) => x !== label && a.indexOf(x) === i).slice(0, 2);
      choices(label, wrongs,
        m === 0 ? "Look at the short hand." : "Look at the long hand first.",
        label, `Yes! It's ${label}`, { wide: true });
    } else {
      clock.render(true);
      const row = h(`<div class="hand-row">
        <button class="hand-btn" data-hand="hour">${HAND_ICON(9, "#e63946", 4)}Short hand</button>
        ${L.mins.length > 1 ? `<button class="hand-btn" data-hand="minute">${HAND_ICON(15, "#13558a", 3)}Long hand</button>` : ""}
      </div>`);
      row.addEventListener("click", (e) => {
        const b = e.target.closest("[data-hand]");
        if (!b || busy) return;
        if (b.dataset.hand === "hour") t.h = (t.h % 12) + 1;
        else t.m = t.mins[(t.mins.indexOf(t.m) + 1) % t.mins.length];
        click(); clock.render();
      });
      wrap.append(row);
      setInstruction(`Make it <b>${label}</b>`, `Make the clock say ${label}`);
      checkRow((btn) => clock.check(btn));
    }
  },
  // Hands always turn clockwise, so angles are kept cumulative.
  render(instant) {
    const t = task;
    const fwd = (prev, deg) => { let a = prev - (((prev % 360) + 360) % 360) + deg; if (a < prev - 0.01) a += 360; return a; };
    t.ha = instant ? (t.h % 12) * 30 + t.m * 0.5 : fwd(t.ha, (t.h % 12) * 30 + t.m * 0.5);
    t.ma = instant ? t.m * 6 : fwd(t.ma, t.m * 6);
    for (const [el, a] of [[t.hourEl, t.ha], [t.minEl, t.ma]]) {
      if (instant) el.style.transition = "none";
      el.style.transform = `rotate(${a}deg)`;
      if (instant) { void el.getBoundingClientRect(); el.style.transition = ""; }
    }
  },
  check(btn) {
    const t = task;
    if (t.h === t.th && t.m === t.tm) {
      const label = timeLabel(t.th, t.tm);
      win(btn, label, `Yes! It's ${label}`);
    } else {
      shakeEl(t.face);
      miss(t.m !== t.tm ? "Look at the long hand." : "Look at the short hand.");
    }
  },
};
GAMES.clock = clock;
