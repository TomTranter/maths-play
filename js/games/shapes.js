// Shape Hunt — 2D shapes. NC Y1: recognise and name common 2D shapes (rectangles incl. squares,
// circles, triangles). NC Y2: identify and describe 2D shapes, including the number of sides.
"use strict";

const SHAPES = {
  circle: { sides: 0, plural: "circles" },
  triangle: { sides: 3, plural: "triangles" },
  square: { sides: 4, plural: "squares" },
  rectangle: { sides: 4, plural: "rectangles" },
  pentagon: { sides: 5, plural: "pentagons" },
  hexagon: { sides: 6, plural: "hexagons" },
};
const SHAPE_COLS = ["#ff4d6d", "#ff9f1c", "#f5c400", "#2ec27e", "#3aa6e8", "#9b5de5", "#f15bb5"];
const RIDDLES = {
  circle: "I am round and I have no corners. What am I?",
  triangle: "I have 3 sides and 3 corners. What am I?",
  square: "I have 4 sides that are all the same length. What am I?",
  rectangle: "I have 4 sides. 2 are long and 2 are short. What am I?",
  pentagon: "I have 5 sides and 5 corners. What am I?",
  hexagon: "I have 6 sides and 6 corners. What am I?",
};

// Corner points of a shape centred on (x, y) with "radius" r, rotated by rot degrees.
function shapePoints(kind, x, y, r, rot) {
  const R = (d) => ((d + rot) * Math.PI) / 180;
  const poly = (n, rad, start) => Array.from({ length: n }, (_, i) => [x + rad * Math.cos(R(start + (360 / n) * i)), y + rad * Math.sin(R(start + (360 / n) * i))]);
  if (kind === "triangle") return poly(3, r * 1.2, -90);
  if (kind === "square") return poly(4, r * 1.15, -45);
  if (kind === "pentagon") return poly(5, r * 1.1, -90);
  if (kind === "hexagon") return poly(6, r * 1.1, 0);
  if (kind === "rectangle") {
    const w = r * 1.6, hh = r * 0.85;
    return [[-w, -hh], [w, -hh], [w, hh], [-w, hh]].map(([dx, dy]) => [x + dx * Math.cos(R(0)) - dy * Math.sin(R(0)), y + dx * Math.sin(R(0)) + dy * Math.cos(R(0))]);
  }
  return [];
}
function shapeEl(kind, x, y, r, rot, color, attrs = "") {
  if (kind === "circle") return `<circle class="shp" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" ${attrs}/>`;
  const pts = shapePoints(kind, x, y, r, rot).map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
  return `<polygon class="shp" points="${pts}" fill="${color}" stroke-linejoin="round" ${attrs}/>`;
}
const shapeIcon = (kind, color = "#3aa6e8") => `<svg viewBox="0 0 80 80" aria-hidden="true">${shapeEl(kind, 40, 40, 26, 0, color)}</svg>`;
const article = () => "a"; // every shape name here takes "a"

const shapes = {
  id: "shapes", name: "Shape Hunt", strand: "2D shapes",
  levels: [
    { label: "Find the shape", kinds: ["circle", "triangle", "square", "rectangle"] },
    { label: "More shapes", kinds: Object.keys(SHAPES) },
    { label: "Sides & corners", kinds: null },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${shapeEl("triangle", 30, 52, 20, 0, "#ff4d6d")}${shapeEl("circle", 64, 30, 16, 0, "#3aa6e8")}${shapeEl("square", 90, 58, 16, 0, "#f5c400")}${shapeEl("hexagon", 62, 70, 12, 0, "#2ec27e")}
  </svg>`,
  next() {
    const L = level(shapes);
    if (L.kinds) shapes.hunt(L.kinds);
    else if (Math.random() < 0.5) shapes.count();
    else shapes.riddle();
  },

  // Tap every shape of one kind in a busy picture.
  hunt(kinds) {
    const target = pick(kinds), want = rand(2, 4);
    let others = kinds.filter((k) => k !== target);
    if (target === "rectangle") others = others.filter((k) => k !== "square"); // squares are rectangles too
    const cells = shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, 10);
    const list = shuffle([...Array(want).fill(target), ...Array.from({ length: 10 - want }, () => pick(others))]);
    const t = newTask({ kind: "hunt", target, want, found: 0 });
    const body = list.map((k, i) => {
      const c = cells[i], cx = 50 + (c % 4) * 100 + rand(-12, 12), cy = 44 + Math.floor(c / 4) * 86 + rand(-8, 8);
      const rot = k === "circle" ? 0 : rand(-25, 25);
      return shapeEl(k, cx, cy, rand(22, 28), rot, pick(SHAPE_COLS), `data-k="${k}" data-i="${i}"`);
    }).join("");
    const wrap = h(`<div class="hunt"><svg viewBox="-16 -8 432 276" role="img" aria-label="Shapes">${body}</svg></div>`);
    t.svg = wrap.querySelector("svg");
    t.svg.addEventListener("click", (e) => shapes.tapShape(e));
    $("stage").replaceChildren(wrap);
    const tray = h('<div class="tray"></div>');
    for (let i = 0; i < want; i++) tray.append(h('<div class="box sm"></div>'));
    $("ground").replaceChildren(tray);
    t.boxes = [...tray.children];
    const pl = SHAPES[target].plural;
    setInstruction(`Tap all the <b>${pl}</b>`, `Tap all the ${pl}.`);
  },
  tapShape(e) {
    const t = task, el = e.target.closest(".shp");
    if (!el || busy || t.kind !== "hunt" || el.classList.contains("found")) return;
    const k = el.dataset.k;
    if (k === t.target) {
      el.classList.add("found"); el.classList.remove("hint");
      const box = t.boxes[t.found];
      box.innerHTML = shapeIcon(t.target, el.getAttribute("fill")); box.classList.add("filled");
      chime(t.found); t.found++;
      if (t.found === t.want) {
        const pl = SHAPES[t.target].plural;
        win(el, `Yes! ${t.want} ${pl}`, `Yes! That's all ${t.want} ${pl}.`);
      } else say(String(t.found));
    } else {
      shakeEl(t.svg);
      miss(`That's ${article()} ${k}. Find ${article()} ${t.target}.`);
      if (t.mistakes >= 2) t.svg.querySelector(`.shp[data-k="${t.target}"]:not(.found)`)?.classList.add("hint");
    }
  },

  // How many sides / corners?
  count() {
    const kind = pick(["triangle", "square", "rectangle", "pentagon", "hexagon"]);
    const what = Math.random() < 0.5 ? "sides" : "corners";
    const n = SHAPES[kind].sides;
    const t = newTask({ kind: "count", shape: kind });
    const pts = shapePoints(kind, 100, 100, 64, 0);
    const wrap = h(`<div class="shape-big"><svg viewBox="0 0 200 200" role="img" aria-label="${kind}">${shapeEl(kind, 100, 100, 64, 0, pick(SHAPE_COLS))}<g class="marks"></g></svg></div>`);
    t.onWin = () => {
      // Number the corners (or the middle of each side) so the count is visible.
      const marks = pts.map(([x, y], i) => {
        const [nx, ny] = what === "corners" ? [x, y] : [(x + pts[(i + 1) % pts.length][0]) / 2, (y + pts[(i + 1) % pts.length][1]) / 2];
        return `<circle cx="${nx}" cy="${ny}" r="13" fill="#ffd23f" stroke="#1d3557" stroke-width="2.5"/><text x="${nx}" y="${ny + 6}" text-anchor="middle" class="blk">${i + 1}</text>`;
      }).join("");
      wrap.querySelector(".marks").innerHTML = marks;
    };
    $("stage").replaceChildren(wrap);
    setInstruction(`How many <b>${what}</b> does a ${kind} have?`, `How many ${what} does a ${kind} have?`);
    choices(n, distractors(n, 3, 7, [-1, 1, 2, -2]), "Count them again.", `Yes! ${n} ${what}`, `Yes! A ${kind} has ${n} ${what}.`);
  },

  // "I have 3 sides and 3 corners. What am I?" — answer by tapping a picture.
  riddle() {
    const kind = pick(Object.keys(SHAPES));
    newTask({ kind: "riddle" });
    const wrong = shuffle(Object.keys(SHAPES).filter((k) => k !== kind && !(kind === "rectangle" && k === "square") && !(kind === "square" && k === "rectangle"))).slice(0, 2);
    $("stage").replaceChildren(h(`<div class="riddle-mark">?</div>`));
    setInstruction(RIDDLES[kind].replace(/(\d+)/g, "<b>$1</b>"), RIDDLES[kind]);
    const g = $("ground"); g.innerHTML = "";
    shuffle([kind, ...wrong]).forEach((k) => {
      const b = h(`<button class="choice pic" aria-label="${k}">${shapeIcon(k, pick(SHAPE_COLS))}<span>${k}</span></button>`);
      b.onclick = () => {
        if (busy) return;
        if (k === kind) win(b, `Yes! A ${kind}`, `Yes! It's a ${kind}.`);
        else { b.disabled = true; shakeEl(b); miss("Look again. Count the sides."); }
      };
      g.append(b);
    });
  },
};
GAMES.shapes = shapes;
