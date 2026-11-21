// Race Day — ordinal numbers and position language. NC Y1: read and use ordinal numbers (1st, 2nd, 3rd …)
// and the language of position. The race stops as the winner crosses the line: whoever is nearest the
// finish came 1st, the next one back came 2nd, and so on.
"use strict";

const RACE_ANIMALS = ["rabbit", "tortoise", "fox", "duck", "frog"];
const RACE_SHORT = ["", "1st", "2nd", "3rd", "4th", "5th"];
const RACE_WORDS = ["", "first", "second", "third", "fourth", "fifth"];
const RACE_HINT = "Start at the finish line and count back.";

// Simple animals facing right (the finish is on the right). viewBox 0 0 60 50.
function raceSvg(a) {
  const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff"/><circle cx="${x + 0.8}" cy="${y}" r="1.8" fill="#1d3557"/>`;
  const s = 'stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"';
  const art = {
    rabbit: `<ellipse cx="26" cy="34" rx="17" ry="11" fill="#e9e4ef" ${s}/><circle cx="9" cy="31" r="5" fill="#fff" ${s}/>
      <ellipse cx="40" cy="7" rx="3.6" ry="10" fill="#e9e4ef" ${s} transform="rotate(-12 40 14)"/><ellipse cx="47" cy="8" rx="3.6" ry="10" fill="#e9e4ef" ${s} transform="rotate(14 47 16)"/>
      <circle cx="44" cy="25" r="10" fill="#e9e4ef" ${s}/>${eye(47, 23)}<circle cx="54" cy="27" r="2" fill="#f15bb5"/>`,
    tortoise: `<rect x="12" y="34" width="7" height="10" rx="3" fill="#9bd17a" ${s}/><rect x="34" y="34" width="7" height="10" rx="3" fill="#9bd17a" ${s}/>
      <circle cx="49" cy="30" r="8" fill="#9bd17a" ${s}/>${eye(51, 28)}
      <path d="M6 38 Q8 12 27 12 Q46 12 46 38 Z" fill="#2ec27e" ${s}/><path d="M17 20 l10 6 l10 -6 M27 26 v12" stroke="#0f6b40" stroke-width="2" fill="none"/>`,
    fox: `<path d="M12 30 Q0 24 2 12 Q10 22 18 26 Z" fill="#ff8c1a" ${s}/><path d="M2 12 Q3 18 7 19" fill="#fff" stroke="none"/>
      <ellipse cx="26" cy="33" rx="15" ry="10" fill="#ff8c1a" ${s}/>
      <path d="M36 14 l3 -10 l6 8 l6 -8 l2 10 Q60 22 58 28 Q50 34 42 30 Q34 26 36 14 Z" fill="#ff8c1a" ${s}/>
      <path d="M50 28 Q56 28 58 28" stroke="#1d3557" stroke-width="2"/>${eye(47, 20)}`,
    duck: `<path d="M6 30 Q4 44 24 45 Q42 45 42 32 Q34 26 18 28 Q10 24 6 30 Z" fill="#ffd23f" ${s}/>
      <circle cx="42" cy="20" r="10" fill="#ffd23f" ${s}/><path d="M51 19 l9 3 l-9 4 Z" fill="#ff9f1c" ${s}/>${eye(44, 17)}
      <path d="M16 34 q8 6 16 0" stroke="#e0a800" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    frog: `<ellipse cx="30" cy="34" rx="22" ry="12" fill="#7cc96a" ${s}/><path d="M10 40 l-6 6 M50 40 l6 6" stroke="#1d3557" stroke-width="2.5"/>
      <circle cx="22" cy="20" r="7" fill="#7cc96a" ${s}/><circle cx="40" cy="20" r="7" fill="#7cc96a" ${s}/>${eye(22, 19)}${eye(40, 19)}
      <path d="M22 36 q9 6 18 0" stroke="#1d3557" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  };
  return `<svg viewBox="0 0 60 50" aria-hidden="true">${art[a]}</svg>`;
}
const raceCap = (s) => s[0].toUpperCase() + s.slice(1);

const race = {
  id: "race", name: "Race Day", strand: "Ordinal numbers",
  levels: [
    { label: "Three runners", kind: "who", n: 3 },
    { label: "Five runners", kind: "place", n: 5 },
    { label: "The podium", kind: "podium", n: 4 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="4" y="8" width="112" height="56" rx="10" fill="#c8553d" stroke="#8a3324" stroke-width="3"/>
    <path d="M6 36 h108" stroke="#fff" stroke-width="2" stroke-dasharray="6 5"/>
    <rect x="96" y="10" width="8" height="52" fill="#fff"/><path d="M96 10h4v4h-4zM100 14h4v4h-4zM96 18h4v4h-4zM100 22h4v4h-4zM96 26h4v4h-4zM100 30h4v4h-4zM96 34h4v4h-4zM100 38h4v4h-4zM96 42h4v4h-4zM100 46h4v4h-4zM96 50h4v4h-4zM100 54h4v4h-4z" fill="#1d3557"/>
    <g transform="translate(70 11) scale(.48)">${raceSvg("fox").replace(/<\/?svg[^>]*>/g, "")}</g>
    <g transform="translate(46 38) scale(.48)">${raceSvg("tortoise").replace(/<\/?svg[^>]*>/g, "")}</g>
    <rect x="24" y="70" width="24" height="16" fill="#3aa6e8" stroke="#1d3557" stroke-width="2"/>
    <rect x="48" y="64" width="24" height="22" fill="#ffd23f" stroke="#1d3557" stroke-width="2"/>
    <rect x="72" y="74" width="24" height="12" fill="#ff9f1c" stroke="#1d3557" stroke-width="2"/>
    <text x="60" y="80" text-anchor="middle" font-size="11" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">1st</text>
  </svg>`,

  css: `
    .race { width: min(100%, 720px); display: grid; gap: clamp(6px, 1.5vh, 14px); justify-items: center; }
    .race-track {
      position: relative; width: 100%; overflow: hidden; background: #c8553d; border: 4px solid #8a3324;
      border-radius: 18px; padding: 4px 0; box-shadow: 0 6px 0 var(--lift);
    }
    .race-lane { position: relative; height: clamp(40px, 8vh, 66px); border-bottom: 2px dashed rgba(255, 255, 255, 0.75); }
    .race-lane:last-child { border-bottom: 0; }
    .race-lane.race-ask { background: rgba(255, 210, 63, 0.55); }
    .race-start { position: absolute; top: 0; bottom: 0; left: 17%; width: 4px; background: #fff; opacity: 0.8; }
    .race-finish {
      position: absolute; top: 0; bottom: 0; left: 90%; width: clamp(10px, 2.4vw, 16px); z-index: 0;
      background: repeating-conic-gradient(#1d3557 0 25%, #fff 0 50%) 0 0 / clamp(10px, 2.4vw, 16px) clamp(10px, 2.4vw, 16px);
    }
    .race-animal {
      position: absolute; top: 50%; height: 92%; aspect-ratio: 6 / 5; z-index: 1;
      transform: translate(-100%, -50%); transition: left 1.4s cubic-bezier(.25, .7, .35, 1);
    }
    .race-animal svg { width: 100%; height: 100%; display: block; }
    .race-badge {
      position: absolute; right: 100%; top: 50%; transform: translateY(-50%); margin-right: 4px;
      background: var(--sun); color: var(--ink); border-radius: 12px; padding: 0 8px; font-weight: 800;
      font-size: clamp(0.9rem, 3.4vw, 1.3rem); line-height: 1.5; box-shadow: 0 3px 0 var(--sun-dark); animation: bump 0.35s ease-out;
    }
    .race-podium { display: flex; align-items: flex-end; justify-content: center; gap: 4px; }
    .race-step { display: grid; justify-items: center; width: clamp(72px, 22vw, 124px); }
    .race-slot { height: clamp(36px, 7vh, 60px); aspect-ratio: 6 / 5; display: grid; place-items: center; }
    .race-slot svg { width: 100%; height: 100%; animation: bump 0.35s ease-out; }
    .race-block {
      width: 100%; display: grid; place-items: center; border: 3px solid var(--ink); border-radius: 10px 10px 0 0;
      font-weight: 800; font-size: clamp(1.1rem, 4vw, 1.6rem); color: var(--ink);
    }
    .race-p1 .race-block { height: clamp(48px, 10vh, 84px); background: var(--sun); }
    .race-p2 .race-block { height: clamp(36px, 7vh, 62px); background: #c9d6e3; }
    .race-p3 .race-block { height: clamp(26px, 5vh, 44px); background: #e0a46a; }
    .race-next .race-block { box-shadow: 0 0 0 5px var(--paper); }
    .choice.pic.race-pick { padding: 6px 8px; min-width: 72px; min-height: 64px; font-size: clamp(0.95rem, 3.6vw, 1.2rem); }
    .choice.pic.race-pick svg { width: clamp(44px, 12vw, 68px); }
    @media (prefers-reduced-motion: reduce) { .race-animal { transition: none; } }
  `,

  next() {
    const L = level(race);
    const order = shuffle([...RACE_ANIMALS]).slice(0, L.n);      // order[0] came 1st
    const lanes = shuffle([...order]);                           // top-to-bottom lane order
    const gap = { 3: 20, 4: 16, 5: 14 }[L.n];
    const t = newTask({ kind: L.kind, order, lanes, placed: 0 });

    const wrap = h(`<div class="race"><div class="race-track"></div></div>`);
    const track = wrap.querySelector(".race-track");
    t.animalEls = {};
    for (const a of lanes) {
      const lane = h(`<div class="race-lane" data-animal="${a}"><i class="race-start"></i><i class="race-finish"></i>
        <div class="race-animal" style="left:17%">${raceSvg(a)}</div></div>`);
      t.animalEls[a] = lane.querySelector(".race-animal");
      track.append(lane);
    }
    if (L.kind === "podium") {
      const pod = h(`<div class="race-podium"></div>`);
      t.slots = {};
      for (const p of [2, 1, 3]) {
        const step = h(`<div class="race-step race-p${p}"><div class="race-slot"></div><div class="race-block">${RACE_SHORT[p]}</div></div>`);
        t.slots[p] = step;
        pod.append(step);
      }
      wrap.append(pod);
    }
    $("stage").replaceChildren(wrap);

    // Run the race: everyone starts together; it stops as the winner crosses the line.
    const go = () => order.forEach((a, i) => { t.animalEls[a].style.left = `${93 - i * gap}%`; });
    if (reduced) go(); else { void track.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => { if (task === t) go(); })); }
    t.onWin = () => order.forEach((a, i) => t.animalEls[a].append(h(`<span class="race-badge">${RACE_SHORT[i + 1]}</span>`)));

    if (L.kind === "who") {
      const p = rand(1, L.n);
      t.answer = order[p - 1];
      setInstruction(`Who came <b>${RACE_SHORT[p]}</b>?`, `Who came ${RACE_WORDS[p]}?`);
      race.animalButtons(lanes, (a, b) => {
        if (a === t.answer) win(b, `Yes! The ${a} came ${RACE_SHORT[p]}`, `Yes! The ${a} came ${RACE_WORDS[p]}.`);
        else { b.disabled = true; shakeEl(b); miss(RACE_HINT); }
      });
    } else if (L.kind === "place") {
      const a = pick(order), p = order.indexOf(a) + 1;
      t.answer = p;
      track.querySelector(`.race-lane[data-animal="${a}"]`).classList.add("race-ask");
      setInstruction(`What place did the <b>${a}</b> come?`, `What place did the ${a} come?`);
      choices(p, distractors(p, 1, L.n, [-1, 1, -2, 2]), RACE_HINT, `Yes! ${RACE_SHORT[p]}`, `Yes! The ${a} came ${RACE_WORDS[p]}.`,
        { fmt: (n) => RACE_SHORT[n], wide: true });
    } else {
      setInstruction(`Put the animals on the <b>podium</b>`, "Put the animals on the podium. Who came first?");
      t.slots[1].classList.add("race-next");
      race.animalButtons(lanes, (a, b) => {
        const p = t.placed + 1;
        if (a !== order[p - 1]) { shakeEl(b); miss(RACE_HINT); return; }
        t.placed = p; b.disabled = true; chime(p - 1);
        t.slots[p].classList.remove("race-next");
        t.slots[p].querySelector(".race-slot").innerHTML = raceSvg(a);
        if (p === 3) return win(b, "Yes! 1st, 2nd, 3rd", "Yes! First, second, third.");
        t.slots[p + 1].classList.add("race-next");
        setInstruction(`Who came <b>${RACE_SHORT[p + 1]}</b>?`, `The ${a} came ${RACE_WORDS[p]}. Who came ${RACE_WORDS[p + 1]}?`);
      });
    }
  },

  // Big picture buttons on the grass, one per animal, in the same order as the lanes.
  animalButtons(lanes, onTap) {
    const g = $("ground"); g.innerHTML = "";
    for (const a of lanes) {
      const b = h(`<button class="choice pic race-pick" data-animal="${a}" aria-label="${a}">${raceSvg(a)}<span>${raceCap(a)}</span></button>`);
      b.onclick = () => { if (!busy) onTap(a, b); };
      g.append(b);
    }
  },

  voiceLines() {
    const lines = [RACE_HINT, "Put the animals on the podium. Who came first?", "Yes! First, second, third."];
    for (let p = 1; p <= 5; p++) {
      lines.push(`Who came ${RACE_WORDS[p]}?`);
      for (const a of RACE_ANIMALS) lines.push(`Yes! The ${a} came ${RACE_WORDS[p]}.`);
    }
    for (const a of RACE_ANIMALS) lines.push(`What place did the ${a} come?`);
    return lines;
  },

  test: {
    async answer() {
      const t = task;
      if (t.kind === "who") return document.querySelector(`#ground .race-pick[data-animal="${t.answer}"]`).click();
      if (t.kind === "place") return [...document.querySelectorAll("#ground .choice")].find((b) => b.textContent === RACE_SHORT[t.answer]).click();
      for (let p = t.placed; p < 3; p++) {
        document.querySelector(`#ground .race-pick[data-animal="${t.order[p]}"]`).click();
        await new Promise((r) => setTimeout(r, 50));
      }
    },
  },
};
addGame(race);
