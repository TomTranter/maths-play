// Sorting Baskets — sorting objects and numbers into two groups. NC Y1: recognise and name common 2-D shapes;
// sort objects by a property. NC Y2: recognise odd and even numbers; compare numbers using more than / less than.
//
// Six things wait in a line. Tap the basket the first one belongs in; it hops in and the next one moves up.
// A wrong basket gives a hint and the thing stays. Win when all six are sorted.
"use strict";

const SORTING_COLS = ["#ff4d6d", "#ffd23f", "#2ec27e", "#3aa6e8", "#9b5de5", "#ff9f1c"];
const sortingSvg = (inner) => `<svg viewBox="0 0 60 60" aria-hidden="true">${inner}</svg>`;
const SORTING_INK = 'stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"';

// Level 1 pictures: cat 0 = animal, cat 1 = fruit.
const SORTING_PICS = [
  { cat: 0, fact: "A fish is an animal.", svg: `<path d="M44 30 L57 19 L57 41 Z" fill="#ff9f1c" ${SORTING_INK}/><ellipse cx="27" cy="30" rx="19" ry="12" fill="#ff9f1c" ${SORTING_INK}/><circle cx="17" cy="27" r="2.8" fill="#1d3557"/><path d="M30 22 q5 8 0 16" fill="none" stroke="#1d3557" stroke-width="2"/>` },
  { cat: 0, fact: "A bird is an animal.", svg: `<path d="M24 46 v8 M32 46 v8" stroke="#e0a800" stroke-width="3"/><circle cx="27" cy="35" r="14" fill="#3aa6e8" ${SORTING_INK}/><circle cx="41" cy="21" r="9" fill="#3aa6e8" ${SORTING_INK}/><path d="M49 19 L58 22 L49 25 Z" fill="#ffd23f" ${SORTING_INK}/><circle cx="43" cy="19" r="2.2" fill="#1d3557"/><path d="M16 34 q10 -6 18 2 q-10 6 -18 -2 Z" fill="#13558a"/>` },
  { cat: 0, fact: "A snail is an animal.", svg: `<path d="M4 48 q0 -8 8 -8 h40 q4 0 4 4 v4 Z" fill="#9bd08a" ${SORTING_INK}/><path d="M9 40 l-3 -12 M13 40 l2 -12" stroke="#1d3557" stroke-width="2.5" stroke-linecap="round"/><circle cx="34" cy="28" r="15" fill="#e0a800" ${SORTING_INK}/><path d="M34 28 m-3 0 a3 3 0 1 1 6 0 a6 6 0 1 1 -12 0 a9 9 0 1 1 18 0" fill="none" stroke="#7a5128" stroke-width="2.5"/>` },
  { cat: 0, fact: "A mouse is an animal.", svg: `<path d="M50 40 q10 -2 6 -14" fill="none" stroke="#1d3557" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="32" cy="38" rx="19" ry="13" fill="#9aa5b1" ${SORTING_INK}/><circle cx="20" cy="24" r="8" fill="#f7a8c4" ${SORTING_INK}/><circle cx="17" cy="35" r="2.4" fill="#1d3557"/><circle cx="13" cy="41" r="2.6" fill="#d6336c"/>` },
  { cat: 1, fact: "An apple is a fruit.", svg: `<path d="M30 18 q-12 -8 -20 4 q-6 14 6 28 q7 7 14 3 q7 4 14 -3 q12 -14 6 -28 q-8 -12 -20 -4 Z" fill="#e63946" ${SORTING_INK}/><path d="M30 18 q0 -8 4 -12" fill="none" stroke="#7a5128" stroke-width="3" stroke-linecap="round"/><path d="M33 12 q8 -8 14 -2 q-6 6 -14 2 Z" fill="#2ec27e" ${SORTING_INK}/>` },
  { cat: 1, fact: "A banana is a fruit.", svg: `<path d="M8 20 q4 30 40 30 q8 0 6 -6 q-26 2 -38 -26 q-6 -4 -8 2 Z" fill="#ffd23f" ${SORTING_INK}/><path d="M8 20 l-2 -4" stroke="#7a5128" stroke-width="3" stroke-linecap="round"/>` },
  { cat: 1, fact: "Cherries are fruit.", svg: `<path d="M18 40 q6 -20 18 -32 M42 42 q-2 -20 -6 -34" fill="none" stroke="#2a9d4b" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="44" r="10" fill="#c1121f" ${SORTING_INK}/><circle cx="42" cy="45" r="10" fill="#c1121f" ${SORTING_INK}/><circle cx="14" cy="41" r="2.5" fill="#fff" opacity=".7"/><circle cx="39" cy="42" r="2.5" fill="#fff" opacity=".7"/>` },
  { cat: 1, fact: "A strawberry is a fruit.", svg: `<path d="M10 20 q20 -6 40 0 q2 20 -20 36 q-22 -16 -20 -36 Z" fill="#ff4d6d" ${SORTING_INK}/><path d="M14 18 l6 -8 l5 6 l5 -9 l5 9 l5 -6 l6 8 Z" fill="#2ec27e" ${SORTING_INK}/>${[[20, 28], [30, 26], [40, 28], [25, 37], [35, 37], [30, 46]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.2" fill="#fff0b3"/>`).join("")}` },
];
// Level 1 shapes: cat 0 = 3 sides, cat 1 = 4 sides.
const SORTING_SHAPES = [
  [0, "30,8 54,50 6,50"], [0, "10,8 10,52 52,52"], [0, "30,4 48,56 12,56"], [0, "4,46 56,46 22,12"],
  [1, "10,10 50,10 50,50 10,50"], [1, "4,18 56,18 56,44 4,44"], [1, "30,4 55,30 30,56 5,30"], [1, "16,14 44,14 56,48 4,48"],
];
const SORTING_SETS = {
  pics: { labels: ["Animals", "Fruit"], said: "animals and fruit", hint: "Look again. Is it an animal or a fruit?" },
  sides: { labels: ["3 sides", "4 sides"], said: "3 sides and 4 sides", hint: "Count the sides." },
  oddeven: { labels: ["Odd", "Even"], said: "odd and even", hint: "Look at the dots. Does every dot have a partner?" },
  twenty: { labels: ["Less than 20", "More than 20"], said: "less than 20 and more than 20", hint: "Is it more than 20, or less than 20?" },
};
const SORTING_WIN = {
  pics: "Yes! All sorted. Animals in one basket, fruit in the other.",
  sides: "Yes! All sorted. Triangles have 3 sides.",
  oddeven: "Yes! All sorted. Even numbers make pairs.",
  twenty: "Yes! All sorted.",
};
const sortingOddFact = (n) => `${n} is ${n % 2 ? "odd" : "even"}.`;
const sortingTwentyFact = (n) => `${n} is ${n < 20 ? "less" : "more"} than 20.`;
const SORTING_TWENTY_NUMS = Array.from({ length: 33 }, (_, i) => i + 4).filter((n) => n !== 20); // 4..36

// Six distinct things, with at least two in each basket.
function sortingDeal(pool0, pool1) {
  const a = rand(2, 4);
  return shuffle([...shuffle([...pool0]).slice(0, a), ...shuffle([...pool1]).slice(0, 6 - a)]);
}
// Dots in pairs (two rows), so an odd number has one dot without a partner.
const sortingDots = (n) => `<span class="sorting-dots">${'<i></i>'.repeat(n)}</span>`;
const SORTING_BASKET = `<svg class="sorting-bsvg" viewBox="0 0 120 40" aria-hidden="true" preserveAspectRatio="none">
  <path d="M4 4 H116 L106 38 H14 Z" fill="#d9a95c" stroke="#7a5128" stroke-width="3" stroke-linejoin="round"/>
  <path d="M10 14 H110 M12 26 H108" stroke="#b07a43" stroke-width="3"/>${[30, 50, 70, 90].map((x) => `<path d="M${x} 6 V36" stroke="#b07a43" stroke-width="3"/>`).join("")}</svg>`;

const sorting = {
  id: "sorting", name: "Sorting Baskets", strand: "Sorting & odd/even",
  levels: [
    { label: "Pictures", kind: "pics" },
    { label: "Odd and even", kind: "oddeven" },
    { label: "Compare with 20", kind: "twenty" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[8, 64].map((x) => `<path d="M${x} 50 h48 l-6 32 h-36 z" fill="#d9a95c" stroke="#7a5128" stroke-width="3" stroke-linejoin="round"/><path d="M${x + 3} 62 h42 M${x + 5} 72 h38" stroke="#b07a43" stroke-width="2.5"/>`).join("")}
    <g transform="translate(14 18) scale(.6)">${SORTING_PICS[0].svg}</g>
    <g transform="translate(72 16) scale(.6)">${SORTING_PICS[4].svg}</g>
    <text x="61" y="30" text-anchor="middle" font-size="22" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">?</text>
  </svg>`,
  css: `
    .sorting-wrap { display: grid; justify-items: center; gap: clamp(10px, 2.5vh, 22px); width: 100%; }
    .sorting-now {
      display: grid; justify-items: center; align-content: center; gap: 8px; min-width: clamp(120px, 34vw, 190px);
      min-height: clamp(120px, 22vh, 190px); padding: 10px 18px; background: var(--paper); border-radius: 26px;
      box-shadow: 0 6px 0 var(--lift); animation: bump 0.35s ease-out;
    }
    .sorting-now svg { width: clamp(96px, 26vw, 150px); height: auto; }
    .sorting-num { font-size: clamp(3rem, 14vw, 5rem); font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .sorting-dots { display: grid; grid-auto-flow: column; grid-template-rows: repeat(2, auto); gap: 4px; }
    .sorting-dots i { width: clamp(8px, 2.4vw, 12px); aspect-ratio: 1; border-radius: 50%; background: var(--counter); }
    .sorting-queue { display: flex; gap: clamp(6px, 1.6vw, 12px); justify-content: center; min-height: clamp(40px, 7vh, 60px); }
    .sorting-wait {
      width: clamp(40px, 11vw, 60px); aspect-ratio: 1; display: grid; place-items: center; border-radius: 14px;
      background: var(--paper-soft); font-size: clamp(1.1rem, 4.4vw, 1.6rem); font-weight: 800; font-variant-numeric: tabular-nums;
    }
    .sorting-wait svg { width: 80%; height: auto; }
    .sorting-basket {
      flex: 1 1 0; max-width: 300px; min-width: 0; min-height: clamp(110px, 19vh, 170px); border: 0; border-radius: 22px;
      background: var(--paper); box-shadow: 0 6px 0 var(--grass-dark); padding: 8px 8px 10px;
      display: grid; grid-template-rows: auto 1fr auto; justify-items: center; gap: 4px;
    }
    .sorting-label { font-size: clamp(1.15rem, 4.6vw, 1.7rem); font-weight: 800; line-height: 1.1; color: var(--pink); }
    .sorting-tray { display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-end; gap: 3px; min-height: 30px; }
    .sorting-mini {
      width: clamp(26px, 7vw, 36px); aspect-ratio: 1; display: grid; place-items: center; border-radius: 8px; background: var(--sun-pale);
      font-size: clamp(0.85rem, 3.4vw, 1.1rem); font-weight: 800; font-variant-numeric: tabular-nums; animation: bump 0.35s ease-out;
    }
    .sorting-mini svg { width: 85%; height: auto; }
    .sorting-bsvg { width: 100%; height: clamp(22px, 4vh, 36px); }
    @media (max-height: 560px) {
      .sorting-now { min-height: 96px; }
      .sorting-now svg { width: 80px; }
      .sorting-basket { min-height: 90px; }
    }
  `,

  next() {
    const L = level(sorting);
    let kind = L.kind, items;
    if (kind === "pics") kind = pick(["pics", "sides"]);
    if (kind === "pics") {
      items = sortingDeal(SORTING_PICS.filter((p) => p.cat === 0), SORTING_PICS.filter((p) => p.cat === 1))
        .map((p) => ({ cat: p.cat, svg: sortingSvg(p.svg), fact: p.fact }));
    } else if (kind === "sides") {
      items = sortingDeal(SORTING_SHAPES.filter((s) => s[0] === 0), SORTING_SHAPES.filter((s) => s[0] === 1))
        .map(([cat, pts], i) => ({ cat, svg: sortingSvg(`<polygon points="${pts}" fill="${SORTING_COLS[i]}" ${SORTING_INK} stroke-width="3"/>`), fact: `This shape has ${cat + 3} sides.` }));
    } else if (kind === "oddeven") {
      const nums = Array.from({ length: 20 }, (_, i) => i + 1);
      items = sortingDeal(nums.filter((n) => n % 2), nums.filter((n) => n % 2 === 0))
        .map((n) => ({ cat: n % 2 ? 0 : 1, n, fact: sortingOddFact(n) }));
    } else {
      items = sortingDeal(SORTING_TWENTY_NUMS.filter((n) => n < 20), SORTING_TWENTY_NUMS.filter((n) => n > 20))
        .map((n) => ({ cat: n < 20 ? 0 : 1, n, fact: sortingTwentyFact(n) }));
    }
    const set = SORTING_SETS[kind];
    const t = newTask({ kind, items, i: 0, cat: items[0].cat });

    const wrap = h('<div class="sorting-wrap"><div class="sorting-now"></div><div class="sorting-queue"></div></div>');
    t.nowEl = wrap.querySelector(".sorting-now");
    t.queueEl = wrap.querySelector(".sorting-queue");
    $("stage").replaceChildren(wrap);

    const g = $("ground"); g.innerHTML = "";
    t.baskets = set.labels.map((label, k) => {
      const b = h(`<button class="sorting-basket" data-k="${k}" aria-label="${label}"><span class="sorting-label">${label}</span><span class="sorting-tray"></span>${SORTING_BASKET}</button>`);
      b.onclick = () => sorting.drop(k, b);
      g.append(b);
      return b;
    });
    sorting.render();
    setInstruction(`Sort into <b>${set.labels[0]}</b> and <b>${set.labels[1]}</b>`, `Sort them into ${set.said}. Tap the right basket.`);
  },

  // Big picture of the thing being sorted (with paired dots for odd and even); small ones waiting behind it.
  look(it, big) {
    if (it.svg) return it.svg;
    if (!big) return `${it.n}`;
    return `<span class="sorting-num">${it.n}</span>${task.kind === "oddeven" ? sortingDots(it.n) : ""}`;
  },
  render() {
    const t = task, it = t.items[t.i];
    t.nowEl.innerHTML = sorting.look(it, true);
    t.nowEl.style.animation = "none"; void t.nowEl.offsetWidth; t.nowEl.style.animation = "";
    t.queueEl.innerHTML = t.items.slice(t.i + 1).map((x) => `<span class="sorting-wait">${sorting.look(x, false)}</span>`).join("");
  },

  drop(k, b) {
    const t = task;
    if (busy || t.i >= t.items.length) return;
    const it = t.items[t.i];
    if (k !== it.cat) { shakeEl(b); miss(t.kind === "pics" ? `${SORTING_SETS.pics.hint} ${it.fact}` : SORTING_SETS[t.kind].hint); return; }
    b.querySelector(".sorting-tray").append(h(`<span class="sorting-mini">${sorting.look(it, false)}</span>`));
    chime(t.i);
    t.i++;
    if (t.i === t.items.length) {
      t.nowEl.style.visibility = "hidden";
      win(b, "Yes! All sorted", SORTING_WIN[t.kind]);
      return;
    }
    say(it.fact);
    t.cat = t.items[t.i].cat;
    sorting.render();
  },

  voiceLines() {
    const lines = ["Tap the right basket."];
    for (const [kind, set] of Object.entries(SORTING_SETS)) {
      lines.push(`Sort them into ${set.said}.`, set.hint, SORTING_WIN[kind]);
    }
    SORTING_PICS.forEach((p) => lines.push(p.fact));
    lines.push("This shape has 3 sides.", "This shape has 4 sides.");
    for (let n = 1; n <= 20; n++) lines.push(sortingOddFact(n));
    SORTING_TWENTY_NUMS.forEach((n) => lines.push(sortingTwentyFact(n)));
    return lines;
  },

  test: {
    async answer() {
      const t = task;
      while (task === t && !busy && t.i < t.items.length) {
        document.querySelector(`#ground .sorting-basket[data-k="${t.items[t.i].cat}"]`).click();
        await new Promise((r) => setTimeout(r, 50));
      }
    },
  },
};
addGame(sorting);
