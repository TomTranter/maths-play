// Rocket Number Line — place and read numbers on a number line. NC Y1: identify and represent numbers
// using objects and pictorial representations including the number line. NC Y2: identify, represent and
// estimate numbers using different representations, including the number line.
"use strict";

const ROCKET = `<g aria-hidden="true">
  <path d="M0 -38 C 10 -28 12 -10 10 6 L-10 6 C -12 -10 -10 -28 0 -38 Z" fill="#ffffff" stroke="#1d3557" stroke-width="3"/>
  <circle cx="0" cy="-16" r="5" fill="#3aa6e8" stroke="#1d3557" stroke-width="2.5"/>
  <path d="M-10 -4 L-18 10 L-10 6 Z M10 -4 L18 10 L10 6 Z" fill="#ff4d6d" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/>
  <path class="flame" d="M-6 8 Q0 26 6 8 Z" fill="#ff9f1c"/>
</g>`;
const LX0 = 30, LX1 = 610, LY = 120; // line ends and height in the drawing

const rocket = {
  id: "rocket", name: "Rocket Number Line", strand: "Number lines & estimating",
  levels: [
    { label: "Land it: 0 to 20", kind: "place", max: 20, tol: 0 },
    { label: "Land it: 0 to 100", kind: "place", max: 100, tol: 4 },
    { label: "Read the line", kind: "read", max: 100 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <path d="M8 66 H112" stroke="#1d3557" stroke-width="3"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${8 + i * 10.4} 60 v12" stroke="#1d3557" stroke-width="${i % 5 ? 1.5 : 3}"/>`).join("")}
    <g transform="translate(70 40) scale(.6)">${ROCKET}</g><path d="M30 20 Q55 0 66 24" stroke="#ffd23f" stroke-width="3" stroke-dasharray="4 4" fill="none"/>
  </svg>`,
  x: (v, max) => LX0 + ((LX1 - LX0) * v) / max,
  v: (x, max) => Math.round(((x - LX0) / (LX1 - LX0)) * max),
  next() {
    const L = level(rocket);
    const t = newTask({ L });
    $("ground").replaceChildren();
    const max = L.max, minorStep = max === 20 ? 1 : L.kind === "read" ? 5 : 10;
    const ticks = [];
    for (let v = 0; v <= max; v += minorStep) {
      const major = v % (max === 20 ? 5 : 10) === 0, x = rocket.x(v, max);
      ticks.push(`<line x1="${x}" y1="${LY - (major ? 16 : 9)}" x2="${x}" y2="${LY + (major ? 16 : 9)}" stroke="#1d3557" stroke-width="${major ? 3 : 2}"/>`);
      if (major) ticks.push(`<text x="${x}" y="${LY + 44}" text-anchor="middle" class="nl-num">${v}</text>`);
    }
    const wrap = h(`<div class="rocket-line"><svg viewBox="0 0 640 190" role="img" aria-label="Number line from 0 to ${max}">
      <rect class="nl-hit" x="0" y="20" width="640" height="150" fill="transparent"/>
      <line x1="${LX0}" y1="${LY}" x2="${LX1}" y2="${LY}" stroke="#1d3557" stroke-width="5" stroke-linecap="round"/>
      ${ticks.join("")}
      <g class="true-mark" visibility="hidden"><line x1="0" y1="${LY - 30}" x2="0" y2="${LY + 22}" stroke="#2a9d4b" stroke-width="5"/><circle cx="0" cy="${LY - 34}" r="7" fill="#2a9d4b"/></g>
      <g class="rkt">${ROCKET}</g>
    </svg></div>`);
    t.svg = wrap.querySelector("svg");
    t.rkt = wrap.querySelector(".rkt");
    t.mark = wrap.querySelector(".true-mark");
    $("stage").replaceChildren(wrap);

    if (L.kind === "place") {
      t.target = rand(max === 20 ? 1 : 3, max - 1);
      if (max === 100 && t.target % 10 === 0) t.target += rand(1, 9) * (t.target < 90 ? 1 : -1);
      rocket.park();
      t.svg.addEventListener("click", (e) => rocket.tapLine(e));
      setInstruction(`Land the rocket on <b>${t.target}</b>`, `Land the rocket on ${t.target}. Tap the number line.`);
    } else {
      const N = rand(1, 19) * 5;
      t.target = N;
      t.rkt.style.transform = `translate(${rocket.x(N, max)}px, ${LY - 22}px)`;
      setInstruction("What number is the <b>rocket</b> on?", "What number is the rocket on? Each small mark is 5.");
      choices(N, distractors(N, 0, 100, [-5, 5, -10, 10]), "Find the nearest ten, then count on in fives.", `Yes! ${N}`, `Yes! The rocket is on ${N}.`);
    }
  },
  park() { task.rkt.style.transition = "none"; task.rkt.style.transform = `translate(${LX0}px, 36px) rotate(0deg)`; void task.rkt.getBoundingClientRect(); task.rkt.style.transition = ""; },
  tapLine(e) {
    const t = task;
    if (busy || t.L.kind !== "place") return;
    const pt = t.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(t.svg.getScreenCTM().inverse());
    const guess = Math.max(0, Math.min(t.L.max, rocket.v(p.x, t.L.max)));
    busy = true;
    tone(300, 0, 0.5, { type: "sawtooth", vol: 0.05, to: 900 });
    t.rkt.style.transform = `translate(${rocket.x(guess, t.L.max)}px, ${LY - 22}px)`;
    later(() => {
      t.mark.setAttribute("transform", `translate(${rocket.x(t.target, t.L.max)} 0)`);
      t.mark.setAttribute("visibility", "visible");
      const off = guess - t.target;
      if (Math.abs(off) <= t.L.tol) {
        const exact = off === 0;
        win(t.rkt, exact ? `Spot on! ${t.target}` : `Close! ${guess}`, exact ? "Yes! You landed right on it." : `Yes! Very close to ${t.target}.`);
      } else {
        miss(off > 0 ? "Too far! Go back a bit." : "Not far enough! Go a bit further.");
        later(() => { t.mark.setAttribute("visibility", "hidden"); rocket.park(); busy = false; }, 1500);
      }
    }, reduced ? 50 : 700);
  },
};
GAMES.rocket = rocket;
