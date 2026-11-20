// Party Bags — sharing and equal groups. NC Y1: solve one-step problems involving multiplication and
// division using concrete objects (sharing, grouping). NC Y2: count in 2s, 5s and 10s; 2, 5, 10 times tables.
"use strict";

const SWEET_COLS = ["#ff4d6d", "#ffd23f", "#2ec27e", "#3aa6e8", "#9b5de5", "#ff9f1c"];
const sweetSVG = (c) => `<svg viewBox="0 0 60 40" aria-hidden="true">
  <path d="M3 8 L19 20 L3 32 Z M57 8 L41 20 L57 32 Z" fill="${c}" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="30" cy="20" rx="14" ry="12" fill="${c}" stroke="#1d3557" stroke-width="2.5"/>
  <path d="M24 14 q6 -4 12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/></svg>`;

const bags = {
  id: "bags", name: "Party Bags", strand: "Sharing & groups",
  levels: [
    { label: "Share", kind: "share" },
    { label: "Fill the bags", kind: "fill" },
    { label: "Count in 2s, 5s, 10s", kind: "count" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[18, 66].map((x) => `<path d="M${x} 30 h36 l-3 52 h-30 z" fill="#e8c084" stroke="#b0844a" stroke-width="2"/><rect x="${x - 1}" y="26" width="38" height="8" rx="2" fill="#d9a95c"/>`).join("")}
    ${[[26, 62, 0], [40, 66, 1], [33, 52, 2], [74, 62, 3], [88, 66, 4], [81, 52, 5]].map(([x, y, i]) => `<g transform="translate(${x - 9} ${y - 6}) scale(.3)">${sweetSVG(SWEET_COLS[i])}</g>`).join("")}
  </svg>`,
  next() {
    const L = level(bags);
    let B, k;
    if (L.kind === "share") { B = rand(2, 3); k = rand(2, 5); }
    else if (L.kind === "fill") { B = rand(2, 4); k = rand(2, 5); }
    else { k = pick([2, 5, 10]); B = rand(2, 5); }
    const N = B * k;
    const t = newTask({ kind: L.kind, B, k, N, inBag: Array.from({ length: B }, () => []), dealt: 0 });

    const wrap = h('<div class="bags-wrap"><div class="pile"></div><div class="bags"></div></div>');
    t.pile = wrap.querySelector(".pile");
    t.bagEls = [];
    for (let i = 0; i < B; i++) {
      const bag = h(`<button class="bag" data-b="${i}" aria-label="Bag ${i + 1}"></button>`);
      t.bagEls.push(bag);
      wrap.querySelector(".bags").append(bag);
    }
    $("stage").replaceChildren(wrap);
    $("ground").replaceChildren();

    if (L.kind === "share") {
      t.pile.innerHTML = Array.from({ length: N }, (_, i) => `<button class="sweet" aria-label="Sweet">${sweetSVG(SWEET_COLS[i % SWEET_COLS.length])}</button>`).join("");
      t.pile.addEventListener("click", (e) => bags.deal(e.target.closest(".sweet")));
      setInstruction(`Share <b>${N}</b> sweets into <b>${B}</b> bags`, `Share ${N} sweets into ${B} bags. Tap a sweet to share it.`);
    } else if (L.kind === "fill") {
      t.pile.remove();
      wrap.querySelector(".bags").addEventListener("click", (e) => bags.fillTap(e));
      bags.renderBags();
      setInstruction(`Put <b>${k}</b> sweets in each bag`, `Put ${k} sweets in each bag. Tap a bag to add a sweet.`);
      checkRow((btn) => bags.check(btn), () => { t.inBag.forEach((b) => (b.length = 0)); bags.renderBags(); });
    } else {
      t.pile.remove();
      t.inBag = t.inBag.map((_, i) => Array.from({ length: k }, (_, j) => SWEET_COLS[(i + j) % SWEET_COLS.length]));
      bags.renderBags();
      setInstruction(`How many sweets <b>altogether</b>?`, `How many sweets altogether? Count in ${k}s.`);
      choices(N, distractors(N, 2, 60, [-k, k, -1, 1]), `Count in ${k}s.`, `Yes! ${N}`, `Yes! ${B} bags of ${k} is ${N}.`);
    }
  },
  renderBags() {
    const t = task;
    t.bagEls.forEach((bag, i) => {
      bag.innerHTML = t.inBag[i].map((c, j) => `<span class="sweet" data-j="${j}">${sweetSVG(c)}</span>`).join("");
      bag.classList.toggle("many", t.inBag[i].length > 6);
    });
  },
  // Share: each tapped sweet goes to the next bag in turn, like dealing cards.
  deal(sweet) {
    const t = task;
    if (!sweet || busy || t.kind !== "share") return;
    const i = t.dealt % t.B, bag = t.bagEls[i];
    const from = sweet.getBoundingClientRect(), to = bag.getBoundingClientRect();
    const color = SWEET_COLS[t.dealt % SWEET_COLS.length];
    sweet.style.visibility = "hidden";
    t.dealt++;
    click();
    const land = () => {
      if (task !== t) return; // moved on while the sweet was flying
      sweet.remove();
      t.inBag[i].push(color);
      t.landed = (t.landed || 0) + 1;
      bags.renderBags();
      if (t.landed === t.N) bags.askEach(); // quick taps can have several sweets in the air
    };
    if (reduced) return land();
    const fl = h(`<div class="flyer sweet-fly">${sweetSVG(color)}</div>`);
    document.body.append(fl);
    fl.animate(
      [{ transform: `translate(${from.left}px, ${from.top}px)` }, { transform: `translate(${to.left + to.width / 2 - 22}px, ${to.top + to.height / 2}px) scale(.7)` }],
      { duration: 380, easing: "cubic-bezier(.5,0,.3,1)" }
    ).onfinish = () => { fl.remove(); land(); };
  },
  askEach() {
    const t = task;
    setInstruction("How many in <b>each</b> bag?", "How many sweets in each bag?");
    choices(t.k, distractors(t.k, 1, 10, [-1, 1, -2, 2]), "Count the sweets in one bag.", `Yes! ${t.k} each`, `Yes! ${t.N} shared into ${t.B} bags is ${t.k} each.`);
  },
  fillTap(e) {
    const t = task;
    if (busy) return;
    const bag = e.target.closest(".bag");
    if (!bag) return;
    const i = +bag.dataset.b, s = e.target.closest(".sweet");
    if (s) { t.inBag[i].splice(+s.dataset.j, 1); click(false); }
    else if (t.inBag[i].length < 10) { t.inBag[i].push(SWEET_COLS[(i + t.inBag[i].length) % SWEET_COLS.length]); click(); }
    bags.renderBags();
  },
  check(btn) {
    const t = task;
    const wrong = t.inBag.map((b, i) => (b.length !== t.k ? i : -1)).filter((i) => i >= 0);
    if (!wrong.length) win(btn, `Yes! ${t.N}`, `Yes! ${t.B} bags of ${t.k} is ${t.N}.`);
    else { wrong.forEach((i) => shakeEl(t.bagEls[i])); miss(`Check every bag has ${t.k}.`); }
  },
};
GAMES.bags = bags;
