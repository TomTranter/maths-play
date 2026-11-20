// Hundred Square — count in 10s, 5s and 2s; one more and one less.
// NC Y1: count in multiples of twos, fives and tens; given a number, identify one more and one less.
"use strict";

const hundred = {
  id: "hundred", name: "Hundred Square", strand: "Counting in 2s, 5s & 10s",
  levels: [
    { label: "Count in 10s", step: 10 },
    { label: "Count in 5s", step: 5 },
    { label: "Count in 2s", step: 2 },
    { label: "1 more, 1 less", step: 0 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <rect x="14" y="4" width="92" height="82" rx="5" fill="#1d3557"/>
    ${Array.from({ length: 30 }, (_, i) => { const c = i % 6, r = Math.floor(i / 6); const lit = c === 4 || c === 1; return `<rect x="${17 + c * 15}" y="${7 + r * 15.6}" width="13" height="13.6" rx="2" fill="${lit ? "#ffd23f" : "#fff"}"/>`; }).join("")}
  </svg>`,
  next() {
    const L = level(hundred);
    const grid = h('<div class="hsq" role="grid" aria-label="Hundred square"></div>');
    for (let n = 1; n <= 100; n++) grid.append(h(`<button data-n="${n}">${n}</button>`));
    const cell = (n) => grid.children[n - 1];
    const t = newTask({ step: L.step, grid, cell });
    grid.addEventListener("click", (e) => hundred.tap(e));
    $("stage").replaceChildren(grid);

    if (L.step) {
      const top = 100 / L.step;                 // how many multiples fit on the square
      const k0 = rand(1, top - 5);
      t.shown = [0, 1, 2].map((j) => (k0 + j) * L.step);
      t.need = [3, 4, 5].map((j) => (k0 + j) * L.step);
      t.got = 0;
      t.shown.forEach((n) => cell(n).classList.add("lit"));
      const tray = h('<div class="tray"></div>');
      [...t.shown, ...t.need].forEach((n, i) => tray.append(h(`<div class="box sm${i < 3 ? " filled" : ""}">${i < 3 ? n : ""}</div>`)));
      $("ground").replaceChildren(tray);
      t.boxes = [...tray.children].slice(3);
      t.onWin = () => {
        for (let n = L.step, i = 0; n <= 100; n += L.step, i++) {
          const c = cell(n);
          if (!c.classList.contains("lit")) setTimeout(() => c.classList.add("wave"), reduced ? 0 : i * 40);
        }
      };
      setInstruction(`Count in <b>${L.step}s</b>. Tap the next number!`, `Count in ${L.step}s. ${t.shown.join(", ")}. What comes next?`);
    } else {
      const more = Math.random() < 0.5;
      const ref = more ? rand(1, 99) : rand(2, 100);
      t.ref = ref; t.more = more; t.ans = more ? ref + 1 : ref - 1;
      cell(ref).classList.add("ref");
      $("ground").replaceChildren(h(`<div class="tray"><div class="box sm filled">${ref}</div><span class="sign on">${more ? "+1" : "−1"}</span><div class="box sm">?</div></div>`));
      t.box = $("ground").querySelector(".box:last-child");
      const word = more ? "more" : "less";
      setInstruction(`What is one <b>${word}</b> than ${ref}?`, `What is one ${word} than ${ref}? Find it on the square.`);
    }
  },
  tap(e) {
    const b = e.target.closest("button");
    const t = task;
    if (!b || busy || !t) return;
    const n = +b.dataset.n;
    if (t.step) {
      if (b.classList.contains("lit")) return;
      const want = t.need[t.got];
      if (n === want) {
        b.classList.add("lit"); b.classList.remove("hint");
        const box = t.boxes[t.got];
        box.textContent = n; box.classList.add("filled");
        chime(t.got); t.got++;
        if (t.got === 3) {
          const all = [...t.shown, ...t.need].join(", ");
          win(b, `Counting in ${t.step}s!`, `Brilliant! ${all}`);
        } else say(String(n));
      } else {
        shakeEl(b);
        miss(`Count on ${t.step} more.`);
        if (t.mistakes >= 2) t.cell(want).classList.add("hint");
      }
    } else {
      if (n === t.ans) {
        t.box.textContent = n; t.box.classList.add("filled");
        b.classList.add("lit");
        win(b, `${t.ref} ${t.more ? "+" : "−"} 1 = ${n}`, `Yes! One ${t.more ? "more" : "less"} than ${t.ref} is ${n}`);
      } else if (n !== t.ref) {
        shakeEl(b);
        miss(`Find ${t.ref}. Then look at the number ${t.more ? "after" : "before"} it.`);
        if (t.mistakes >= 2) t.cell(t.ans).classList.add("hint");
      }
    }
  },
};
GAMES.hundred = hundred;
