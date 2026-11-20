// Ten Frame — subitising, making numbers, bonds to 10. NC Y1: number bonds within 10/20, counting objects.
"use strict";

const tenframe = {
  id: "tenframe", name: "Ten Frame", strand: "Number bonds to 10",
  levels: [{ label: "Up to 10", max: 10, frames: 1 }, { label: "Up to 20", max: 20, frames: 2 }],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="8" y="22" width="104" height="44" rx="5" fill="#1d3557"/>
    ${Array.from({ length: 10 }, (_, i) => { const x = 11 + (i % 5) * 20, y = 25 + Math.floor(i / 5) * 20; return `<rect x="${x}" y="${y}" width="18" height="18" rx="2" fill="#fff"/>` + (i < 7 ? `<circle cx="${x + 9}" cy="${y + 9}" r="6.5" fill="#e63946"/>` : ""); }).join("")}
  </svg>`,
  next() {
    const L = level(tenframe);
    const kind = pick(L.frames === 1 ? ["count", "make", "ten"] : ["count", "make", "count"]);
    const n = kind === "ten" ? rand(1, 9) : rand(L.frames === 1 ? 1 : 8, L.max);
    const filled = Array(L.frames * 10).fill(false);
    if (kind !== "make") for (let i = 0; i < n; i++) filled[i] = true;
    const t = newTask({ kind, n, filled, frames: L.frames });

    const wrap = h('<div class="frames"></div>');
    for (let f = 0; f < L.frames; f++) {
      const fr = h('<div class="frame"></div>');
      for (let k = 0; k < 10; k++) fr.append(h(`<button class="cell" data-i="${f * 10 + k}" aria-label="Space"></button>`));
      wrap.append(fr);
    }
    t.wrap = wrap;
    wrap.addEventListener("click", (e) => tenframe.tap(e));
    $("stage").replaceChildren(wrap);
    tenframe.render(true);

    if (kind === "make") {
      setInstruction(`Put in <b>${n}</b> ${n === 1 ? "counter" : "counters"}`, `Put in ${plural(n, "counter", "counters")}.`);
      checkRow((btn) => tenframe.check(btn), () => { t.filled.fill(false); tenframe.render(); });
    } else if (kind === "count") {
      setInstruction("How many counters?", "How many counters?");
      choices(n, distractors(n, 1, L.max, [-2, -1, 1, 2]), "Count again. A full row is five.", `Yes! ${n}`, `Yes! ${n}`);
    } else {
      const m = 10 - n;
      setInstruction("How many more to make <b>10</b>?", "How many more to make ten?");
      t.onWin = () => {
        t.wrap.querySelectorAll(".cell").forEach((c, i) => {
          if (!t.filled[i]) { const d = h('<span class="counter alt"></span>'); d.style.animationDelay = `${(i - n) * 80}ms`; c.append(d); }
        });
      };
      choices(m, distractors(m, 0, 10, [-2, -1, 1, 2]), "Count the empty spaces.", `${n} + ${m} = 10`, `Yes! ${n} and ${m} make ten`);
    }
  },
  render(stagger) {
    const t = task;
    t.wrap.querySelectorAll(".cell").forEach((c, i) => {
      const has = !!c.firstChild;
      if (t.filled[i] && !has) {
        const d = h('<span class="counter"></span>');
        if (stagger) d.style.animationDelay = `${i * 70}ms`;
        c.append(d);
      } else if (!t.filled[i] && has) c.replaceChildren();
    });
  },
  tap(e) {
    const t = task, c = e.target.closest(".cell");
    if (!c || busy || t.kind !== "make") return;
    const i = +c.dataset.i;
    t.filled[i] = !t.filled[i];
    click(t.filled[i]); tenframe.render();
  },
  check(btn) {
    const t = task, have = t.filled.filter(Boolean).length;
    if (have === t.n) win(btn, `Yes! ${t.n}`, `Yes! That's ${t.n}`);
    else { shakeEl(t.wrap); miss(moreOrLess(have, t.n)); }
  },
};
GAMES.tenframe = tenframe;
