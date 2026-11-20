// Coin Shop — UK coins. NC Y1: recognise and know the value of different coins.
// NC Y2: combine amounts to make a particular value; find different combinations of coins.
"use strict";

// Radius in px ≈ real diameter in mm / 2 × 2, so the coins keep their real relative sizes.
const COIN_SPEC = {
  1: { r: 20, metal: "cu", hept: false },
  2: { r: 26, metal: "cu", hept: false },
  5: { r: 18, metal: "ag", hept: false },
  10: { r: 24.5, metal: "ag", hept: false },
  20: { r: 21.5, metal: "ag", hept: true },
  50: { r: 27.5, metal: "ag", hept: true },
};
function coinSVG(v) {
  const { r, metal, hept } = COIN_SPEC[v], s = r + 2;
  const rim = metal === "cu" ? "#8a4a1c" : "#7b8492";
  const poly = (rad) => Array.from({ length: 7 }, (_, k) => { const a = (k * 2 * Math.PI) / 7 - Math.PI / 2; return `${(rad * Math.cos(a)).toFixed(1)},${(rad * Math.sin(a)).toFixed(1)}`; }).join(" ");
  const body = hept
    ? `<polygon points="${poly(r)}" fill="url(#coin-${metal})" stroke="${rim}" stroke-width="2" stroke-linejoin="round"/><polygon points="${poly(r - 4)}" fill="none" stroke="${rim}" stroke-width="1" opacity=".6"/>`
    : `<circle r="${r}" fill="url(#coin-${metal})" stroke="${rim}" stroke-width="2"/><circle r="${r - 4}" fill="none" stroke="${rim}" stroke-width="1" opacity=".6"/>`;
  return `<svg viewBox="${-s} ${-s} ${2 * s} ${2 * s}" style="width: calc(${2 * s}px * var(--k))" aria-hidden="true">
    ${body}<text class="coin-text" y="${(r * 0.24).toFixed(1)}" text-anchor="middle" font-size="${(r * 0.66).toFixed(1)}">${v}p</text>
  </svg>`;
}
const SHOP_ITEMS = [
  { name: "apple", svg: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 30 C 30 16 8 30 13 56 C 18 84 37 96 50 87 C 63 96 82 84 87 56 C 92 30 70 16 50 30 Z" fill="#e63946" stroke="#9d1c27" stroke-width="3"/><path d="M50 30 q2 -14 10 -20" stroke="#7a5128" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M55 22 q16 -12 26 1 q-15 9 -26 -1z" fill="#3fae49"/><ellipse cx="32" cy="48" rx="6" ry="11" fill="#fff" opacity=".4"/></svg>` },
  { name: "lolly", svg: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="46" y="54" width="8" height="44" rx="4" fill="#fdf6e9" stroke="#b9b2a2" stroke-width="2"/><circle cx="50" cy="36" r="30" fill="#f15bb5" stroke="#8f1762" stroke-width="3"/><path d="M50 36 m-4 0 a4 4 0 1 1 8 0 a9 9 0 1 1 -17 0 a14 14 0 1 1 27 0 a20 20 0 1 1 -38 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>` },
  { name: "ball", svg: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="40" fill="#3aa6e8" stroke="#13558a" stroke-width="3"/><path d="M12 44 Q50 62 88 44 M14 64 Q50 82 86 64" stroke="#ffd23f" stroke-width="8" fill="none"/><ellipse cx="34" cy="34" rx="8" ry="12" fill="#fff" opacity=".4" transform="rotate(30 34 34)"/></svg>` },
  { name: "toy car", svg: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 64 L14 48 Q18 42 28 42 L36 28 Q40 22 50 22 L66 22 Q74 22 78 30 L84 42 Q92 44 92 54 L92 64 Z" fill="#ff9f1c" stroke="#a85a00" stroke-width="3" stroke-linejoin="round"/><path d="M40 40 L46 28 L60 28 L60 40 Z M66 40 L66 28 Q72 28 74 32 L78 40 Z" fill="#d4f0ff"/><circle cx="30" cy="66" r="11" fill="#1d3557"/><circle cx="74" cy="66" r="11" fill="#1d3557"/><circle cx="30" cy="66" r="4" fill="#d9dde3"/><circle cx="74" cy="66" r="4" fill="#d9dde3"/></svg>` },
];

const coins = {
  id: "coins", name: "Coin Shop", strand: "Money",
  levels: [
    { label: "Up to 10p", coins: [1, 2, 5], lo: 3, max: 10 },
    { label: "Up to 20p", coins: [1, 2, 5, 10], lo: 8, max: 20 },
    { label: "Up to 50p", coins: [1, 2, 5, 10, 20], lo: 15, max: 50 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <defs><radialGradient id="tile-cu" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f3b07a"/><stop offset="1" stop-color="#b8662e"/></radialGradient>
    <radialGradient id="tile-ag" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#aab2bd"/></radialGradient></defs>
    <circle cx="40" cy="50" r="26" fill="url(#tile-ag)" stroke="#7b8492" stroke-width="2"/><text x="40" y="58" text-anchor="middle" font-size="20" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">10p</text>
    <circle cx="84" cy="44" r="21" fill="url(#tile-cu)" stroke="#8a4a1c" stroke-width="2"/><text x="84" y="51" text-anchor="middle" font-size="17" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">2p</text>
  </svg>`,
  next() {
    const L = level(coins);
    const kind = Math.random() < 0.6 ? "pay" : "count";
    const t = newTask({ kind, purse: [] });
    const shop = h('<div class="shop"></div>');
    const purse = h('<div class="purse" aria-label="Purse"></div>');
    t.purseEl = purse;
    $("stage").replaceChildren(shop);

    if (kind === "pay") {
      const item = pick(SHOP_ITEMS);
      t.price = rand(L.lo, L.max);
      shop.append(h(`<div class="shelf">${item.svg}<span class="tag">${t.price}p</span></div>`));
      shop.append(purse);
      const bank = h('<div class="bank"></div>');
      for (const v of L.coins) {
        const b = h(`<button class="coin" aria-label="${v}p coin">${coinSVG(v)}</button>`);
        b.onclick = () => {
          if (busy || t.purse.length >= 15) return;
          t.purse.push(v); coinSound(); coins.render(true);
        };
        bank.append(b);
      }
      shop.append(bank);
      purse.addEventListener("click", (e) => {
        const c = e.target.closest(".coin");
        if (!c || busy) return;
        t.purse.splice(+c.dataset.i, 1); click(false); coins.render();
      });
      coins.render();
      setInstruction(`Pay <b>${t.price}p</b> for the ${item.name}`, `The ${item.name} costs ${t.price}p. Put ${t.price}p in the purse.`);
      checkRow((btn) => coins.check(btn), () => { t.purse = []; coins.render(); });
    } else {
      let set, total;
      do {
        set = Array.from({ length: rand(2, 4) }, () => pick(L.coins));
        total = set.reduce((a, b) => a + b, 0);
      } while (total > L.max || total < 3);
      set.sort((a, b) => b - a);
      t.purse = set; t.total = total;
      shop.append(purse);
      coins.render(false, true);
      setInstruction("How much money?", "How much money is in the purse?");
      const names = set.map((v) => v + "p");
      const said = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
      choices(total, distractors(total, 1, L.max + 5, [-2, -1, 1, 2, 5, -5]), "Count the biggest coin first, then count on.",
        `Yes! ${total}p`, `Yes! ${said} make ${total}p`, { fmt: (n) => n + "p" });
    }
  },
  render(added, still) {
    const t = task;
    t.purseEl.innerHTML = t.purse.map((v, i) => still
      ? `<span class="coin">${coinSVG(v)}</span>`
      : `<button class="coin" data-i="${i}" aria-label="Take back ${v}p">${coinSVG(v)}</button>`).join("");
    const last = t.purseEl.lastElementChild;
    if (added && last && !reduced) last.animate([{ transform: "translateY(60px) scale(.5)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 250, easing: "ease-out" });
  },
  check(btn) {
    const t = task, total = t.purse.reduce((a, b) => a + b, 0);
    if (total === t.price) win(btn, `Yes! ${t.price}p`, `Yes! That's ${t.price}p. Thank you!`);
    else { shakeEl(t.purseEl); miss(total < t.price ? "Not enough money yet." : "Too much! Take a coin back."); }
  },
};
GAMES.coins = coins;
