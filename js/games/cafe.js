// Café Change — adding prices and giving change. NC Y2: recognise and use £ and p; find different
// combinations of coins that equal the same amounts; solve simple problems in a practical context
// involving addition and subtraction of money of the same unit, including giving change.
"use strict";

const CAFE_ITEMS = {
  cake: '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M12 44 h56 v24 h-56z" fill="#f7c6d9" stroke="#1d3557" stroke-width="3"/><path d="M12 44 q7 -10 14 0 q7 -10 14 0 q7 -10 14 0 q7 -10 14 0" fill="#fff" stroke="#1d3557" stroke-width="3"/><circle cx="40" cy="28" r="7" fill="#ff4d6d" stroke="#1d3557" stroke-width="3"/><path d="M40 21 q2 -6 6 -8" stroke="#3f8f33" stroke-width="3" fill="none"/></svg>',
  juice: '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M24 22 h32 l-4 50 h-24z" fill="#ff9f1c" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/><path d="M24 22 h32" stroke="#1d3557" stroke-width="3"/><path d="M46 22 l8 -16" stroke="#ff4d6d" stroke-width="4" stroke-linecap="round"/><circle cx="40" cy="44" r="8" fill="#ffd23f" opacity=".7"/></svg>',
  biscuit: '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="42" r="26" fill="#d9a95c" stroke="#1d3557" stroke-width="3"/>' + [[30, 32], [48, 36], [36, 52], [52, 52], [42, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#5c3a1a"/>`).join("") + "</svg>",
  sandwich: '<svg viewBox="0 0 80 80" aria-hidden="true"><g stroke="#1d3557" stroke-width="3" stroke-linejoin="round"><path d="M6 58 L70 38 V62 L6 70 Z" fill="#e2b874"/><path d="M6 52 L70 34 V42 L6 62 Z" fill="#ff7a9a"/><path d="M6 46 L70 28 V35 L60 41 L50 38 L40 46 L30 43 L20 52 L6 54 Z" fill="#58c85f"/><path d="M6 42 L70 24 V30 L6 48 Z" fill="#c8843f"/><path d="M6 42 L38 6 L70 24 Z" fill="#f8e3b8"/></g><path d="M30 26 h1 M42 22 h1 M36 32 h1 M50 25 h1" stroke="#d9a95c" stroke-width="3" stroke-linecap="round"/></svg>',
  "ice lolly": '<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="36" y="50" width="8" height="24" rx="4" fill="#d9a95c" stroke="#1d3557" stroke-width="2.5"/><rect x="24" y="8" width="32" height="46" rx="14" fill="#9b5de5" stroke="#1d3557" stroke-width="3"/><path d="M24 26 h32" stroke="#f15bb5" stroke-width="6"/></svg>',
  banana: '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M14 30 Q22 70 68 58 Q70 52 64 52 Q30 56 24 26 Z" fill="#ffd23f" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/><path d="M14 30 l4 -8" stroke="#5c3a1a" stroke-width="4" stroke-linecap="round"/></svg>',
};
const money = (v, pounds) => (pounds ? `£${v}` : `${v}p`);
const moneySay = (v, pounds) => (pounds ? `${v} ${v === 1 ? "pound" : "pounds"}` : `${v}p`);

const cafe = {
  id: "cafe", name: "Café Change", strand: "Money: totals & change",
  levels: [
    { label: "Add two prices", kind: "add" },
    { label: "Change from 10p and 20p", kind: "change", pounds: false },
    { label: "Pounds and change", kind: "change", pounds: true },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true"><g transform="translate(4 8) scale(.6)">${CAFE_ITEMS.cake.replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(56 8) scale(.6)">${CAFE_ITEMS.juice.replace(/<\/?svg[^>]*>/g, "")}</g>
    <rect x="22" y="62" width="76" height="22" rx="11" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/><text x="60" y="79" text-anchor="middle" font-size="16" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">7p + 5p</text></svg>`,
  card(name, price, pounds) {
    return `<div class="cafe-card">${CAFE_ITEMS[name]}<span class="tag">${money(price, pounds)}</span></div>`;
  },
  next() {
    const L = level(cafe);
    newTask({ kind: L.kind });
    if (L.kind === "add") {
      const [x, y] = shuffle(Object.keys(CAFE_ITEMS)).slice(0, 2);
      const a = rand(1, 10), b = rand(1, 10), s = a + b;
      task.answer = s;
      $("stage").replaceChildren(h(`<div class="cafe">${cafe.card(x, a)}<span class="cafe-op">+</span>${cafe.card(y, b)}</div>`));
      setInstruction("How much <b>altogether</b>?", `The ${x} is ${a}p. The ${y} is ${b}p. How much altogether?`);
      choices(s, distractors(s, 2, 25, [-1, 1, -2, 2, 10]), "Start with the bigger price and count on.", `${a}p + ${b}p = ${s}p`, `Yes! ${a}p and ${b}p is ${s}p.`, { fmt: (n) => n + "p" });
      return;
    }
    const pounds = L.pounds;
    const paid = pounds ? pick([5, 10]) : pick([10, 20]);
    const price = rand(1, paid - 1), change = paid - price;
    task.answer = change; task.pounds = pounds;
    const item = pick(Object.keys(CAFE_ITEMS));
    const coin = pounds
      ? `<div class="note-pay">£${paid}</div>`
      : `<div class="coin-pay">${coinSVG(paid)}</div>`;
    $("stage").replaceChildren(h(`<div class="cafe">${cafe.card(item, price, pounds)}<span class="cafe-op">paid with</span>${coin}</div>`));
    setInstruction(`You pay <b>${money(paid, pounds)}</b>. How much <b>change</b>?`,
      `The ${item} costs ${moneySay(price, pounds)}. You pay with ${moneySay(paid, pounds)}. How much change?`);
    choices(change, distractors(change, 1, paid, [-1, 1, -2, 2]), `Count up from ${moneySay(price, pounds)} to ${moneySay(paid, pounds)}.`,
      `Change: ${money(change, pounds)}`, `Yes! ${moneySay(price, pounds)} and ${moneySay(change, pounds)} make ${moneySay(paid, pounds)}.`,
      { fmt: (n) => money(n, pounds) });
  },
};
// Plays the right answer through the real controls (used by ?selftest).
cafe.test = {
  answer() { tapChoice(money(task.answer, task.pounds)); },
};
GAMES.cafe = cafe;
