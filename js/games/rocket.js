// Rocket Number Line — place and read numbers on a number line. NC Y1: identify and represent numbers
// using objects and pictorial representations including the number line. NC Y2: identify, represent and
// estimate numbers using different representations, including the number line.
"use strict";

const ROCKET = `<g aria-hidden="true" stroke="#1d3557" stroke-width="3" stroke-linejoin="round">
  <path class="flame" d="M-9 8 Q-14 22 0 32 Q14 22 9 8 Z" fill="#ff9f1c"/><path d="M-4 10 Q-6 18 0 22 Q6 18 4 10 Z" fill="#ffe066" stroke="none"/>
  <path d="M-12 -14 L-24 10 L-10 8 Z M12 -14 L24 10 L10 8 Z" fill="#ff4d6d"/>
  <path d="M0 -50 C16 -34 18 -10 11 10 H-11 C-18 -10 -16 -34 0 -50 Z" fill="#fff"/>
  <path d="M0 -50 C6 -44 10 -38 12.5 -31 H-12.5 C-10 -38 -6 -44 0 -50 Z" fill="#ff4d6d"/>
  <circle cx="0" cy="-16" r="8" fill="#8ad6ff"/><path d="M-4 -18 q2 -4 5 -3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
</g>`;
const LX0 = 30, LX1 = 610, LY = 140; // line ends and height in the drawing

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
      ticks.push(`<line x1="${x}" y1="${LY - (major ? 16 : 9)}" x2="${x}" y2="${LY + (major ? 16 : 9)}" stroke="#fff" stroke-width="${major ? 4 : 2.5}"/>`);
      if (major) ticks.push(`<text x="${x}" y="${LY + 52}" text-anchor="middle" class="nl-num">${v}</text>`);
    }
    const wrap = h(`<div class="rocket-line"><svg viewBox="0 0 640 220" role="img" aria-label="Number line from 0 to ${max}">
      <rect class="nl-hit" x="0" y="0" width="640" height="220" fill="transparent"/>
      <g aria-hidden="true" style="pointer-events:none">${[[90, 22], [150, 64], [226, 30], [300, 72], [362, 20], [430, 56], [470, 14], [610, 70], [40, 84]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 2.5 : 4}" fill="#fff6bf"/>`).join("")}
        <circle cx="546" cy="38" r="22" fill="#f4f1de"/><circle cx="539" cy="32" r="5" fill="#d8d3b8"/><circle cx="555" cy="47" r="4" fill="#d8d3b8"/></g>
      <line x1="${LX0}" y1="${LY}" x2="${LX1}" y2="${LY}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
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
      // slide a finger along the line and the rocket follows it, mark by mark; it lands when you let go
      const aim = (e) => { if (!busy && t.aiming) rocket.hover(e); };
      t.svg.addEventListener("pointerdown", (e) => {
        if (busy) return;
        t.aiming = true;
        try { t.svg.setPointerCapture(e.pointerId); } catch {}
        aim(e);
      });
      t.svg.addEventListener("pointermove", aim);
      t.svg.addEventListener("pointerup", (e) => { if (t.aiming) { t.aiming = false; rocket.tapLine(e); } }); // a slide never becomes a click on touch screens
      t.svg.addEventListener("pointercancel", () => { t.aiming = false; if (!busy) rocket.park(); });
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
  park() { task.rkt.style.transition = "none"; task.rkt.style.transform = `translate(${LX0}px, 54px) rotate(0deg)`; void task.rkt.getBoundingClientRect(); task.rkt.style.transition = ""; },
  at(e) {
    const t = task, box = t.svg.getBoundingClientRect(); // not getScreenCTM: Safari ignores the fitting scale there
    return Math.max(0, Math.min(t.L.max, rocket.v(((e.clientX - box.left) / box.width) * 640, t.L.max)));
  },
  hover(e) {
    const t = task;
    t.rkt.style.transition = "none";
    t.rkt.style.transform = `translate(${rocket.x(rocket.at(e), t.L.max)}px, ${LY - 38}px)`;
    void t.rkt.getBoundingClientRect();
    t.rkt.style.transition = "";
  },
  tapLine(e) {
    const t = task;
    if (busy || t.L.kind !== "place") return;
    const guess = rocket.at(e);
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
// Plays the right answer through the real controls (used by ?selftest).
rocket.test = {
  answer() {
    const t = task;
    if (t.L.kind === "read") return tapChoice(t.target);
    const box = t.svg.getBoundingClientRect();
    tap(t.svg, box.left + (rocket.x(t.target, t.L.max) / 640) * box.width, box.top + (LY / 220) * box.height);
  },
};
GAMES.rocket = rocket;
