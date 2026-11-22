// Fair Shares — halves and quarters of shapes. NC Y1: recognise, find and name a half and a quarter
// of an object or shape as one of two / four equal parts.
"use strict";

const SHARE_KINDS = {
  pizza: { base: "#ffd166", line: "#c8743a" },
  bar: { base: "#9a6232", line: "#5c3a1a" },
  cake: { base: "#f7c6d9", line: "#c2577f" },
};
const equalCuts = (n) => Array.from({ length: n + 1 }, (_, i) => i / n);
const UNEQUAL = {
  2: [[0, 0.3, 1], [0, 0.68, 1], [0, 0.35, 1]],
  4: [[0, 0.12, 0.4, 0.7, 1], [0, 0.3, 0.45, 0.85, 1], [0, 0.2, 0.62, 0.8, 1]],
};

// A pizza (slices), chocolate bar or cake (strips) cut at the given boundaries (fractions 0..1).
function shareSVG(kind, cuts, shaded = []) {
  const k = SHARE_KINDS[kind];
  let parts = "";
  for (let i = 0; i < cuts.length - 1; i++) {
    const f0 = cuts[i], f1 = cuts[i + 1], on = shaded.includes(i) ? " on" : "";
    if (kind === "pizza") {
      const r = 52, a0 = f0 * 2 * Math.PI - Math.PI / 2, a1 = f1 * 2 * Math.PI - Math.PI / 2;
      const p = (a) => `${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}`;
      parts += `<path class="part${on}" data-i="${i}" d="M60 60 L${p(a0)} A${r} ${r} 0 ${f1 - f0 > 0.5 ? 1 : 0} 1 ${p(a1)} Z" fill="${k.base}"/>`;
    } else {
      const [x, y, w, hh] = kind === "bar" ? [8, 28, 104, 64] : [14, 14, 92, 92];
      parts += `<rect class="part${on}" data-i="${i}" x="${(x + w * f0).toFixed(2)}" y="${y}" width="${(w * (f1 - f0)).toFixed(2)}" height="${hh}" fill="${k.base}"/>`;
    }
  }
  const outline = kind === "pizza"
    ? `<circle cx="60" cy="60" r="52" fill="none" stroke="${k.line}" stroke-width="5"/>`
    : kind === "bar"
      ? `<rect x="8" y="28" width="104" height="64" rx="4" fill="none" stroke="${k.line}" stroke-width="5"/>`
      : `<rect x="14" y="14" width="92" height="92" rx="6" fill="none" stroke="${k.line}" stroke-width="5"/>`;
  return `<svg viewBox="0 0 120 120" aria-hidden="true">${parts}${outline}</svg>`;
}

const shares = {
  id: "shares", name: "Fair Shares", strand: "Halves & quarters",
  levels: [
    { label: "Halves", target: 2 },
    { label: "Quarters", target: 4 },
    { label: "Halves & quarters", target: 0 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true"><g transform="translate(15 0) scale(.75)">${shareSVG("pizza", equalCuts(4), [0])}</g></svg>`,
  next() {
    const L = level(shares);
    const target = L.target || pick([2, 4]);
    const kind = Math.random() < 0.5 ? "pick" : "shade";
    const t = newTask({ kind, target });

    if (kind === "pick") {
      const kinds = shuffle(Object.keys(SHARE_KINDS));
      const cards = shuffle([
        { cuts: equalCuts(target), ok: true },
        { cuts: pick(UNEQUAL[target]), why: "unequal" },
        { cuts: equalCuts(target === 2 ? 3 : pick([2, 3])), why: "count" },
      ]).map((c, i) => ({ ...c, kind: kinds[i] }));
      const row = h('<div class="share-cards"></div>');
      cards.forEach((c) => {
        const b = h(`<button class="share-card" aria-label="${c.kind}">${shareSVG(c.kind, c.cuts)}</button>`);
        if (c.ok) t.good = b;
        b.onclick = () => {
          if (busy) return;
          if (c.ok) {
            win(b, target === 2 ? "Yes! Halves" : "Yes! Quarters",
              target === 2 ? "Yes! 2 equal parts make halves." : "Yes! 4 equal parts make quarters.");
          } else {
            b.disabled = true; shakeEl(b);
            miss(c.why === "unequal" ? "Those parts are not equal."
              : target === 2 ? "Halves are 2 equal parts." : "Quarters are 4 equal parts.");
          }
        };
        row.append(b);
      });
      $("stage").replaceChildren(row);
      $("ground").replaceChildren();
      if (target === 2) setInstruction("Which one is cut in <b>half</b>?", "Which one is cut in half?");
      else setInstruction("Which one is cut into <b>quarters</b>?", "Which one is cut into quarters?");
    } else {
      const parts = target === 2 ? pick([2, 4]) : pick([4, 8]);
      t.need = parts / target;
      t.shapeKind = parts === 8 ? "pizza" : pick(Object.keys(SHARE_KINDS)); // eight strips are too thin to tap
      t.cuts = equalCuts(parts);
      t.on = new Set();
      const big = h('<div class="share-big"></div>');
      t.big = big;
      shares.render();
      big.addEventListener("click", (e) => {
        const p = e.target.closest(".part");
        if (!p || busy) return;
        const i = +p.dataset.i;
        if (t.on.has(i)) t.on.delete(i); else t.on.add(i);
        click(t.on.has(i)); shares.render();
      });
      $("stage").replaceChildren(big);
      checkRow((btn) => shares.check(btn), () => { t.on.clear(); shares.render(); });
      if (target === 2) setInstruction("Colour <b>half</b>", "Colour half.");
      else setInstruction("Colour <b>a quarter</b>", "Colour a quarter.");
    }
  },
  render() {
    task.big.innerHTML = shareSVG(task.shapeKind, task.cuts, [...task.on]);
  },
  check(btn) {
    const t = task, n = t.on.size;
    if (n === t.need) win(btn, t.target === 2 ? "Yes! Half" : "Yes! A quarter", t.target === 2 ? "Yes! That's half." : "Yes! That's a quarter.");
    else { shakeEl(t.big); miss(n < t.need ? "Colour some more." : "Too much! Tap one to take it off."); }
  },
};
// Plays the right answer through the real controls (used by ?selftest).
shares.test = {
  answer() {
    const t = task;
    if (t.kind === "pick") return tap(t.good);
    for (let i = 0; i < t.need; i++) tap(task.big.querySelectorAll(".part")[i]);
    tapCheck();
  },
};
GAMES.shares = shares;
