// Bubble Bonds — number bonds. NC Y1: represent and use number bonds within 20.
// NC Y2: recall and use addition facts to 20 fluently, and derive and use related facts up to 100.
//
// Several bubbles float in the sky, each with a number. Tap two that make the target to pop them.
// The round is won when every pair has popped (sometimes one odd bubble has no partner and stays).
"use strict";

const BUBBLES_TINTS = ["#ff4d6d", "#ff9f1c", "#f5c400", "#2ec27e", "#3aa6e8", "#9b5de5", "#f15bb5"];

const bubbles = {
  id: "bubbles", name: "Bubble Bonds", strand: "Number bonds to 10 and 20",
  levels: [
    { label: "Make 10", target: 10, step: 1 },
    { label: "Make 20", target: 20, step: 1 },
    { label: "Make 100", target: 100, step: 10 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[[30, 50, 22, "#3aa6e8", 3], [70, 34, 20, "#ff4d6d", 7], [98, 64, 14, "#2ec27e", 5]].map(([x, y, r, c, n]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".28" stroke="${c}" stroke-width="3"/>
       <ellipse cx="${x - r * 0.4}" cy="${y - r * 0.45}" rx="${r * 0.22}" ry="${r * 0.13}" fill="#fff" opacity=".9" transform="rotate(-35 ${x - r * 0.4} ${y - r * 0.45})"/>
       <text x="${x}" y="${y + r * 0.38}" text-anchor="middle" font-size="${r * 1.1}" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">${n}</text>`).join("")}
  </svg>`,
  css: `
    .bubbles-sky {
      display: flex; flex-wrap: wrap; justify-content: center; align-content: center;
      gap: clamp(8px, 2.5vmin, 22px); width: 100%; max-width: 760px;
    }
    .bubbles-b {
      --size: clamp(76px, min(21vw, 15vh), 132px);
      width: var(--size); height: var(--size); padding: 0; border: 0; background: none; border-radius: 50%;
      animation: bubbles-bob 3.4s ease-in-out infinite;
      transition: opacity .25s ease-out, transform .25s ease-out;
    }
    .bubbles-in {
      position: relative; display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%;
      background: radial-gradient(circle at 34% 30%, rgba(255,255,255,.95) 0 8%, rgba(255,255,255,.35) 22%, var(--tint) 140%);
      border: 4px solid var(--tint); box-shadow: inset 0 -8px 16px rgba(255,255,255,.55), 0 6px 0 var(--lift);
      font-size: calc(var(--size) * .42); font-weight: 800; line-height: 1; color: var(--ink);
      font-variant-numeric: tabular-nums; transition: transform .15s ease-out, box-shadow .15s;
    }
    .bubbles-b.sel .bubbles-in {
      transform: scale(1.1); border-color: var(--sun-dark);
      box-shadow: 0 0 0 6px var(--sun), 0 6px 0 var(--lift);
    }
    .bubbles-b.wob .bubbles-in { animation: bubbles-wobble .5s ease-in-out; }
    .bubbles-b.popped { opacity: 0; transform: scale(1.5); pointer-events: none; visibility: hidden; transition: opacity .25s, transform .25s, visibility 0s .25s; }
    @keyframes bubbles-bob { 50% { translate: 0 -10px; } }
    @keyframes bubbles-wobble {
      20% { transform: scale(1.12, .9) rotate(-8deg); } 45% { transform: scale(.92, 1.1) rotate(7deg); }
      70% { transform: scale(1.06, .95) rotate(-4deg); } 100% { transform: none; }
    }
    @media (prefers-reduced-motion: reduce) { .bubbles-b { animation: none; } .bubbles-b.wob .bubbles-in { animation: none; } }
    .bubbles-sum {
      display: flex; align-items: center; gap: clamp(6px, 2vw, 14px);
      font-size: clamp(2rem, 8vw, 2.8rem); font-weight: 800; color: var(--paper); text-shadow: 0 3px 0 var(--grass-dark);
    }
    .bubbles-slot {
      min-width: clamp(64px, 18vw, 92px); height: clamp(56px, 14vw, 72px); display: grid; place-items: center;
      border-radius: 20px; border: 4px dashed rgba(255,255,255,.85); background: rgba(255,255,255,.25);
      color: var(--ink); text-shadow: none; font-variant-numeric: tabular-nums;
    }
    .bubbles-slot.on { border-style: solid; background: var(--paper); }
    .bubbles-goal {
      min-width: clamp(64px, 18vw, 96px); height: clamp(56px, 14vw, 72px); display: grid; place-items: center; padding: 0 10px;
      border-radius: 20px; background: var(--sun); color: var(--ink); text-shadow: none; box-shadow: 0 5px 0 var(--sun-dark);
    }
  `,

  // Three different bonds (small part picked without repeats), plus maybe one odd bubble with no partner.
  makeRound(T, step) {
    const halves = [];
    for (let a = step; a <= T / 2; a += step) halves.push(a);
    const lows = shuffle(halves).slice(0, 3);
    const vals = lows.flatMap((a) => [a, T - a]);
    let decoy = null;
    if (Math.random() < 0.5) {
      const cands = [];
      for (let d = step; d < T; d += step) if (d * 2 !== T && !vals.includes(d) && !vals.includes(T - d)) cands.push(d);
      if (cands.length) decoy = pick(cands);
    }
    if (decoy !== null) vals.push(decoy);
    return { vals: shuffle(vals), decoy, pairs: lows.length };
  },

  next() {
    const L = level(bubbles), T = L.target;
    const { vals, decoy, pairs } = bubbles.makeRound(T, L.step);
    const t = newTask({ T, vals, decoy, pairs, popped: 0, sel: null, els: [] });

    const sky = h('<div class="bubbles-sky"></div>');
    const tints = shuffle([...BUBBLES_TINTS]);
    vals.forEach((n, i) => {
      const b = h(`<button class="bubbles-b" data-n="${n}" aria-label="Bubble ${n}"><span class="bubbles-in">${n}</span></button>`);
      b.style.setProperty("--tint", tints[i % tints.length]);
      b.style.animationDelay = `${-Math.random() * 3}s`;
      b.style.marginTop = `${rand(0, 3) * 6}px`;
      b.addEventListener("click", () => bubbles.tap(b));
      t.els.push(b);
      sky.append(b);
    });
    $("stage").replaceChildren(sky);
    $("ground").replaceChildren(h(`<div class="bubbles-sum">
      <span class="bubbles-slot"></span><span>+</span><span class="bubbles-slot"></span><span>=</span><span class="bubbles-goal">${T}</span>
    </div>`));
    t.slots = [...$("ground").querySelectorAll(".bubbles-slot")];

    setInstruction(`Pop the pairs that make <b>${T}</b>`,
      `Pop the pairs that make ${T}. ${decoy !== null ? "One bubble has no partner." : "Tap two bubbles."}`);
  },

  showSlots(a, b) {
    const t = task;
    [a, b].forEach((v, i) => {
      t.slots[i].textContent = v === null ? "" : v;
      t.slots[i].classList.toggle("on", v !== null);
    });
  },

  tap(b) {
    const t = task;
    if (busy || !t || !t.els || b.classList.contains("popped")) return;
    const n = +b.dataset.n;
    if (!t.sel) { t.sel = b; b.classList.add("sel"); click(); bubbles.showSlots(n, null); return; }
    if (t.sel === b) { t.sel = null; b.classList.remove("sel"); click(false); bubbles.showSlots(null, null); return; }

    const first = t.sel, a = +first.dataset.n, s = a + n;
    t.sel = null;
    first.classList.remove("sel");
    bubbles.showSlots(a, n);

    if (s !== t.T) {
      for (const el of [first, b]) { el.classList.remove("wob"); void el.offsetWidth; el.classList.add("wob"); }
      // Is a's partner still floating? If not, a is the odd bubble out.
      const partnerHere = t.els.some((el) => el !== first && !el.classList.contains("popped") && +el.dataset.n === t.T - a);
      miss(`That makes ${s}. ${partnerHere ? `${a} needs ${t.T - a}.` : `${a} has no partner here.`}`);
      later(() => { if (!t.sel) bubbles.showSlots(null, null); }, 900);
      return;
    }

    for (const el of [first, b]) {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, el.style.getPropertyValue("--tint"));
      el.classList.add("popped");
    }
    popSound();
    t.popped++;
    if (t.popped === t.pairs) {
      win(b, `Yes! ${a} + ${n} = ${t.T}`, `Yes! All the pairs make ${t.T}.`);
    } else {
      chime(t.popped);
      say(`${a} and ${n} make ${t.T}.`);
      later(() => { if (!t.sel) bubbles.showSlots(null, null); }, 900);
    }
  },

  voiceLines() {
    const lines = new Set();
    for (const L of bubbles.levels) {
      const T = L.target;
      lines.add(`Pop the pairs that make ${T}. One bubble has no partner.`);
      lines.add(`Pop the pairs that make ${T}. Tap two bubbles.`);
      lines.add(`Yes! All the pairs make ${T}.`);
      for (let a = L.step; a < T; a += L.step) {
        lines.add(`${a} and ${T - a} make ${T}.`);
        lines.add(`${a} needs ${T - a}.`);
        lines.add(`${a} has no partner here.`);
      }
      for (let s = 2 * L.step; s <= 2 * (T - L.step); s += L.step) lines.add(`That makes ${s}.`);
    }
    return [...lines];
  },

  test: {
    async answer() {
      const T = task.T;
      for (let guard = 0; guard < 10 && !busy; guard++) {
        const sel = document.querySelector("#stage .bubbles-b.sel");
        if (sel) sel.click();
        const live = [...document.querySelectorAll("#stage .bubbles-b:not(.popped)")];
        let pair = null;
        for (let i = 0; i < live.length && !pair; i++) {
          for (let j = i + 1; j < live.length; j++) {
            if (+live[i].dataset.n + +live[j].dataset.n === T) { pair = [live[i], live[j]]; break; }
          }
        }
        if (!pair) return;
        pair[0].click();
        pair[1].click();
        await new Promise((r) => setTimeout(r, 50));
      }
    },
  },
};
addGame(bubbles);
