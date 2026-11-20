// Farm Count — tally charts and pictograms. NC Y2 statistics: interpret and construct simple
// pictograms, tally charts and block diagrams; ask and answer questions by counting the number of
// objects in each category, sorting by quantity, and totalling and comparing categorical data.
"use strict";

// Side-view animals in a 100 × 80 box, facing right.
const INK = 'stroke="#1d3557" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const ANIMALS = {
  cow: { plural: "cows", svg: `
    <path d="M18 34 C 8 36, 6 48, 8 58" fill="none" ${INK}/><path d="M5 56 q3 8 7 2 q-1 -6 -7 -2z" fill="#1d3557"/>
    ${[22, 32, 58, 68].map((x) => `<rect x="${x}" y="50" width="9" height="22" rx="3" fill="#fff" ${INK}/><rect x="${x}" y="66" width="9" height="6" rx="2" fill="#1d3557"/>`).join("")}
    <rect x="14" y="24" width="66" height="34" rx="16" fill="#fff" ${INK}/>
    <path d="M24 26 q10 -2 12 8 q-2 12 -14 8 q-6 -8 2 -16z M50 40 q10 -6 16 2 q2 10 -10 12 q-10 -2 -6 -14z M62 25 q8 -1 10 6 q-6 4 -10 -6z" fill="#1d3557"/>
    <ellipse cx="44" cy="58" rx="7" ry="4" fill="#f7a8c4" ${INK}/>
    <path d="M77 15 q-4 -8 2 -10 M91 15 q4 -8 -2 -10" fill="none" stroke="#c9a66b" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="72" cy="22" rx="7" ry="4" fill="#fff" ${INK} transform="rotate(-20 72 22)"/><ellipse cx="96" cy="22" rx="7" ry="4" fill="#fff" ${INK} transform="rotate(20 96 22)"/>
    <ellipse cx="84" cy="30" rx="13" ry="15" fill="#fff" ${INK}/>
    <ellipse cx="86" cy="41" rx="12" ry="8" fill="#f7a8c4" ${INK}/><circle cx="82" cy="41" r="1.8" fill="#1d3557"/><circle cx="90" cy="41" r="1.8" fill="#1d3557"/>
    <circle cx="80" cy="27" r="2.6" fill="#1d3557"/><circle cx="90" cy="27" r="2.6" fill="#1d3557"/>` },
  sheep: { plural: "sheep", svg: `
    ${[30, 40, 58, 68].map((x) => `<rect x="${x}" y="52" width="6" height="20" rx="3" fill="#1d3557"/>`).join("")}
    <g fill="#f4f1ea" stroke="#9a9384" stroke-width="3">${[[20, 36], [26, 24], [40, 18], [55, 18], [68, 24], [74, 38], [66, 50], [50, 54], [34, 52], [22, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join("")}</g>
    <ellipse cx="47" cy="36" rx="27" ry="17" fill="#f4f1ea"/>
    <ellipse cx="80" cy="24" rx="9" ry="4.5" fill="#3a3f4b" ${INK} transform="rotate(-30 80 24)"/>
    <ellipse cx="88" cy="36" rx="12" ry="15" fill="#3a3f4b" ${INK} transform="rotate(20 88 36)"/>
    <circle cx="85" cy="22" r="8" fill="#f4f1ea" stroke="#9a9384" stroke-width="2.5"/>
    <circle cx="91" cy="32" r="3.6" fill="#fff"/><circle cx="92" cy="32.5" r="1.8" fill="#1d3557"/>
    <path d="M93 45 q3 2 6 -1" stroke="#f7a8c4" stroke-width="2.5" fill="none" stroke-linecap="round"/>` },
  pig: { plural: "pigs", svg: `
    <path d="M14 38 c -8 -2, -8 -10, -2 -10 c 5 0, 4 7, -1 6" fill="none" stroke="#c2577f" stroke-width="3" stroke-linecap="round"/>
    ${[24, 34, 56, 66].map((x) => `<rect x="${x}" y="54" width="9" height="16" rx="3" fill="#f9b8cf" stroke="#c2577f" stroke-width="3"/>`).join("")}
    <ellipse cx="46" cy="42" rx="34" ry="21" fill="#f9b8cf" stroke="#c2577f" stroke-width="3"/>
    <ellipse cx="42" cy="34" rx="18" ry="7" fill="#fff" opacity=".35"/>
    <path d="M70 18 l6 -12 l6 12z" fill="#f48fb1" stroke="#c2577f" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="80" cy="34" r="15" fill="#f9b8cf" stroke="#c2577f" stroke-width="3"/>
    <ellipse cx="93" cy="38" rx="7" ry="8" fill="#f48fb1" stroke="#c2577f" stroke-width="3"/>
    <circle cx="91" cy="36" r="1.6" fill="#8f1762"/><circle cx="95" cy="40" r="1.6" fill="#8f1762"/>
    <circle cx="80" cy="29" r="2.6" fill="#1d3557"/>` },
  hen: { plural: "hens", svg: `
    <path d="M40 60 v12 l-5 3 M40 72 l4 3 M54 60 v12 l-5 3 M54 72 l4 3" fill="none" stroke="#ff9f1c" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M22 30 q-8 -16 4 -22 q2 8 6 12 q2 -12 12 -12 q-2 10 2 16z" fill="#c8743a" ${INK}/>
    <path d="M24 34 C 22 22, 40 20, 54 26 C 60 18, 62 12, 66 12 C 76 12, 78 22, 74 30 C 80 46, 66 62, 46 62 C 30 62, 20 50, 24 34 Z" fill="#fffaf0" ${INK}/>
    <path d="M34 38 q12 -6 22 4 q-8 12 -20 6z" fill="#f3e3c3" ${INK}/><path d="M40 44 q6 0 10 2" stroke="#1d3557" stroke-width="2" fill="none"/>
    <path d="M62 12 q1 -8 6 -4 q3 -7 7 0 q5 -3 5 4z" fill="#ff4d6d" ${INK}/>
    <path d="M76 18 l9 4 l-9 4z" fill="#ff9f1c" ${INK}/>
    <path d="M74 26 q4 8 -1 9 q-4 -2 -2 -9z" fill="#ff4d6d" stroke="#1d3557" stroke-width="2"/>
    <circle cx="70" cy="18" r="2.6" fill="#1d3557"/>` },
};
const animalIcon = (k) => `<svg viewBox="0 0 100 80" aria-hidden="true">${ANIMALS[k].svg}</svg>`;
const tallySVG = (n) => {
  let out = "", x = 4;
  for (let g = 0; g < Math.ceil(n / 5); g++) {
    const m = Math.min(5, n - g * 5);
    for (let i = 0; i < Math.min(4, m); i++) out += `<line x1="${x + i * 9}" y1="4" x2="${x + i * 9}" y2="36" stroke="#1d3557" stroke-width="4" stroke-linecap="round"/>`;
    if (m === 5) out += `<line x1="${x - 4}" y1="30" x2="${x + 31}" y2="10" stroke="#d6336c" stroke-width="4" stroke-linecap="round"/>`;
    x += 48;
  }
  return `<svg viewBox="0 0 ${Math.max(48, x)} 40" style="height:100%" aria-hidden="true">${out}</svg>`;
};

const farm = {
  id: "farm", name: "Farm Count", strand: "Tally charts & pictograms",
  levels: [
    { label: "Tally chart", chart: "tally", ask: "count" },
    { label: "Pictogram", chart: "picto", ask: "most" },
    { label: "Compare", chart: "picto", ask: "compare" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="4" y="6" width="112" height="78" rx="8" fill="#e6f6ea" stroke="#4a9a32" stroke-width="2"/>
    <g transform="translate(6 10) scale(.4)">${ANIMALS.cow.svg}</g><g transform="translate(6 46) scale(.4)">${ANIMALS.sheep.svg}</g>
    <g transform="translate(48 14) scale(.5)">${tallySVG(4).replace(/<\/?svg[^>]*>/g, "")}</g>
    <g transform="translate(48 46) scale(.5)">${tallySVG(5).replace(/<\/?svg[^>]*>/g, "")}</g>
  </svg>`,
  next() {
    const L = level(farm);
    const kinds = shuffle(Object.keys(ANIMALS)).slice(0, L.ask === "most" ? rand(3, 4) : 3);
    let counts;
    do { counts = kinds.map(() => rand(2, L.ask === "count" ? 6 : kinds.length === 4 ? 6 : 8)); } while (new Set(counts).size !== counts.length);
    const t = newTask({ L, kinds, counts, got: kinds.map(() => 0), left: counts.reduce((a, b) => a + b, 0) });

    // Scatter the animals over a 6 × 4 grid of cells (at most 24 animals); some face left.
    const cells = shuffle(Array.from({ length: 24 }, (_, i) => i));
    const list = shuffle(kinds.flatMap((k, i) => Array(counts[i]).fill(k)));
    const field = list.map((k, i) => {
      const c = cells[i], x = (c % 6) * 100 + rand(0, 6), y = (c / 6 | 0) * 80 + rand(0, 4);
      const flip = Math.random() < 0.4 ? "translate(100 0) scale(-1 1)" : "";
      return `<g class="animal" data-k="${k}" transform="translate(${x} ${y})"><rect width="100" height="80" fill="transparent"/><g transform="${flip}">${ANIMALS[k].svg}</g></g>`;
    }).join("");
    const rows = kinds.map((k, i) => `<div class="chart-row"><span class="chart-key">${animalIcon(k)}</span><span class="chart-val" data-i="${i}"></span></div>`).join("");
    const wrap = h(`<div class="farm">
      <svg class="field" viewBox="0 0 606 324" role="img" aria-label="Field of animals">${field}</svg>
      <div class="chart chart-${L.chart}">${rows}</div>
    </div>`);
    t.field = wrap.querySelector(".field");
    t.vals = [...wrap.querySelectorAll(".chart-val")];
    t.field.addEventListener("click", (e) => farm.countAnimal(e.target.closest(".animal")));
    $("stage").replaceChildren(wrap);
    $("ground").replaceChildren();
    farm.renderChart();
    setInstruction(`Tap each animal to <b>count</b> it`, `Tap each animal to count it.`);
  },
  renderChart() {
    const t = task;
    t.vals.forEach((v, i) => {
      v.innerHTML = t.L.chart === "tally" ? (t.got[i] ? tallySVG(t.got[i]) : "") : Array.from({ length: t.got[i] }, () => `<span class="picto">${animalIcon(t.kinds[i])}</span>`).join("");
    });
  },
  countAnimal(el) {
    const t = task;
    if (!el || busy || el.classList.contains("counted")) return;
    const i = t.kinds.indexOf(el.dataset.k);
    el.classList.add("counted");
    t.got[i]++; t.left--;
    chime(t.got[i] - 1);
    farm.renderChart();
    if (t.left) say(String(t.got[i]));
    else later(() => farm.ask(), 500);
  },
  ask() {
    const t = task, { kinds, counts } = t;
    const ask = t.L.ask === "compare" ? pick(["more", "total"]) : t.L.ask;
    if (ask === "count") {
      const i = rand(0, kinds.length - 1), pl = ANIMALS[kinds[i]].plural;
      setInstruction(`How many <b>${pl}</b> are there?`, `Now look at the chart. How many ${pl} are there?`);
      choices(counts[i], distractors(counts[i], 1, 10, [-1, 1, -2, 2]), "Look at the chart again.", `Yes! ${counts[i]} ${pl}`, `Yes! There are ${counts[i]} ${pl}.`);
    } else if (ask === "most") {
      const most = Math.random() < 0.6;
      const v = most ? Math.max(...counts) : Math.min(...counts), k = kinds[counts.indexOf(v)], pl = ANIMALS[k].plural;
      setInstruction(`Which animal is there <b>${most ? "most" : "fewest"}</b> of?`, `Now look at the chart. Which animal is there ${most ? "most" : "fewest"} of?`);
      const g = $("ground"); g.innerHTML = "";
      const opts = shuffle([k, ...shuffle(kinds.filter((x) => x !== k)).slice(0, 2)]);
      opts.forEach((o) => {
        const b = h(`<button class="choice pic" aria-label="${o}">${animalIcon(o)}<span>${ANIMALS[o].plural}</span></button>`);
        b.onclick = () => {
          if (busy) return;
          if (o === k) win(b, `Yes! ${pl}`, `Yes! There are the ${most ? "most" : "fewest"} ${pl}.`);
          else { b.disabled = true; shakeEl(b); miss(`Look at the chart again. Which row is the ${most ? "longest" : "shortest"}?`); }
        };
        g.append(b);
      });
    } else if (ask === "more") {
      const order = kinds.map((k, i) => i).sort((a, b) => counts[b] - counts[a]);
      const [a, b] = [order[0], order[rand(1, order.length - 1)]];
      const d = counts[a] - counts[b], pa = ANIMALS[kinds[a]].plural, pb = ANIMALS[kinds[b]].plural;
      setInstruction(`How many more <b>${pa}</b> than <b>${pb}</b>?`, `Now look at the chart. How many more ${pa} than ${pb}?`);
      choices(d, distractors(d, 1, 8, [-1, 1, 2, -2]), "Count how many more are in the longer row.", `Yes! ${d} more`, `Yes! There are ${d} more ${pa} than ${pb}.`);
    } else {
      const total = counts.reduce((x, y) => x + y, 0);
      setInstruction("How many animals <b>altogether</b>?", "Now look at the chart. How many animals altogether?");
      choices(total, distractors(total, 3, 30, [-1, 1, -2, 2]), "Add up all the rows.", `Yes! ${total}`, `Yes! There are ${total} animals altogether.`);
    }
  },
};
GAMES.farm = farm;
