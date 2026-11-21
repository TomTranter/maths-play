// Sticks & Blocks — tens and ones with base-ten pieces. NC Y1/Y2: place value, partitioning 2-digit numbers.
"use strict";

const stickHTML = (btn) => `<${btn ? "button" : "div"} class="stick" aria-label="Ten stick">${'<i class="cube"></i>'.repeat(10)}</${btn ? "button" : "div"}>`;
const MINI_STICK = '<svg viewBox="0 0 12 40" width="12" height="34" aria-hidden="true"><rect x="1" y="1" width="10" height="38" rx="2" fill="#3aa6e8" stroke="#13558a" stroke-width="2"/><path d="M1 8.6h10M1 16.2h10M1 23.8h10M1 31.4h10" stroke="#13558a"/></svg>';
const MINI_CUBE = '<svg viewBox="0 0 14 14" width="18" height="18" aria-hidden="true"><rect x="1" y="1" width="12" height="12" rx="2" fill="#3aa6e8" stroke="#13558a" stroke-width="2"/></svg>';

// "34 is 3 tens and 4 ones" — always the standard split, however the number was built (recorded as one clip).
function blocksLine(n) {
  const t = Math.floor(n / 10), o = n % 10;
  const parts = [t ? plural(t, "ten", "tens") : "", o ? plural(o, "one", "ones") : ""].filter(Boolean);
  return `${n} is ${parts.join(" and ")}`;
}

const blocks = {
  id: "blocks", name: "Sticks & Blocks", strand: "Tens and ones",
  levels: [{ label: "Up to 20", max: 20 }, { label: "Up to 50", max: 50 }, { label: "Up to 99", max: 99 }],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[20, 40].map((x) => `<rect x="${x}" y="8" width="14" height="74" rx="2" fill="#3aa6e8" stroke="#13558a" stroke-width="2"/>` + Array.from({ length: 9 }, (_, i) => `<path d="M${x} ${8 + 7.4 * (i + 1)}h14" stroke="#13558a"/>`).join("")).join("")}
    ${[[70, 68], [86, 68], [70, 52]].map(([x, y]) => `<rect x="${x}" y="${y}" width="14" height="14" rx="2" fill="#3aa6e8" stroke="#13558a" stroke-width="2"/>`).join("")}
  </svg>`,
  next() {
    const max = level(blocks).max;
    const kind = Math.random() < 0.6 ? "make" : "read";
    const target = rand(kind === "make" ? 5 : 11, max);
    const t = newTask({ kind, target, tens: 0, ones: 0 });
    if (kind === "read") { t.tens = Math.floor(target / 10); t.ones = target % 10; }

    const board = h(`<div class="pv ${kind === "read" ? "readonly" : ""}">
      <div class="pv-col">
        <div class="pv-head">Tens</div>
        <div class="mat-tens" data-k="tens"></div>
        <div class="pv-foot"><button class="pm" data-act="tens-" aria-label="Take a stick away">−</button><span class="pv-count" data-c="tens"></span><button class="pm add" data-act="tens+" aria-label="Add a stick">${MINI_STICK}</button></div>
      </div>
      <div class="pv-col">
        <div class="pv-head">Ones</div>
        <div class="mat-ones" data-k="ones"></div>
        <div class="pv-foot"><button class="pm" data-act="ones-" aria-label="Take a block away">−</button><span class="pv-count" data-c="ones"></span><button class="pm add" data-act="ones+" aria-label="Add a block">${MINI_CUBE}</button></div>
        <button class="swap" data-act="swap" hidden>Swap 10 blocks for a stick</button>
      </div>
    </div>`);
    t.board = board;
    board.addEventListener("click", (e) => blocks.onBoard(e));
    $("stage").replaceChildren(board);
    blocks.render();

    if (kind === "make") {
      setInstruction(`Make <b>${target}</b>`, `Make ${target}`);
      checkRow((btn) => blocks.check(btn), () => { t.tens = 0; t.ones = 0; blocks.render(); });
    } else {
      setInstruction("What number is this?", "What number is this? Count the tens, then the ones.");
      const swapped = (target % 10) * 10 + Math.floor(target / 10);
      t.onWin = () => board.classList.add("reveal");
      choices(target, distractors(target, 1, max, [-10, 10, -1, 1], [swapped]),
        "Count the sticks first. Each stick is ten.", `Yes! ${target}`, `Yes! ${blocksLine(target)}.`);
    }
  },
  render(added) {
    const t = task, b = t.board, ro = t.kind === "read";
    const tm = b.querySelector('[data-k="tens"]'), om = b.querySelector('[data-k="ones"]');
    tm.innerHTML = stickHTML(!ro).repeat(t.tens);
    om.innerHTML = (ro ? '<i class="cube"></i>' : '<button class="cube" aria-label="Block"></button>').repeat(t.ones);
    b.querySelector('[data-c="tens"]').textContent = t.tens;
    b.querySelector('[data-c="ones"]').textContent = t.ones;
    b.querySelector('[data-act="tens+"]').disabled = t.tens >= 9;
    b.querySelector('[data-act="ones+"]').disabled = t.ones >= 19;
    b.querySelector('[data-act="tens-"]').disabled = t.tens === 0;
    b.querySelector('[data-act="ones-"]').disabled = t.ones === 0;
    b.querySelector('[data-act="swap"]').hidden = ro || t.ones < 10 || t.tens >= 9;
    const el = added === "tens" ? tm.lastElementChild : added === "ones" ? om.lastElementChild : null;
    if (el && !reduced) el.animate([{ transform: "translateY(-30px) scale(.6)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 220, easing: "ease-out" });
  },
  onBoard(e) {
    const t = task;
    if (busy || t.kind !== "make") return;
    const act = e.target.closest("[data-act]")?.dataset.act;
    const piece = e.target.closest(".stick, .mat-ones .cube");
    if (act === "tens+" && t.tens < 9) { t.tens++; click(); blocks.render("tens"); say(String(t.tens * 10)); }
    else if (act === "ones+" && t.ones < 19) { t.ones++; click(); blocks.render("ones"); }
    else if (act === "tens-" && t.tens > 0) { t.tens--; click(false); blocks.render(); }
    else if (act === "ones-" && t.ones > 0) { t.ones--; click(false); blocks.render(); }
    else if (act === "swap") {
      t.ones -= 10; t.tens++; chime(2); blocks.render("tens");
      say("Ten ones make one ten!");
    } else if (piece) {
      if (piece.classList.contains("stick")) t.tens--; else t.ones--;
      click(false); blocks.render();
    } else return;
    if (t.ones === 10 && act === "ones+") say("Ten blocks! Swap them for a stick.");
  },
  check(btn) {
    const t = task, total = t.tens * 10 + t.ones;
    if (total === t.target) {
      win(btn, `Yes! ${t.target}`, `Yes! ${blocksLine(t.target)}.`);
    } else { shakeEl(t.board); miss(moreOrLess(total, t.target)); }
  },
};
// Plays the right answer through the real controls (used by ?selftest).
blocks.test = {
  answer() {
    const t = task;
    if (t.kind === "read") return tapChoice(t.target);
    for (let i = 0; i < Math.floor(t.target / 10); i++) tap(t.board.querySelector('[data-act="tens+"]'));
    for (let i = 0; i < t.target % 10; i++) tap(t.board.querySelector('[data-act="ones+"]'));
    tapCheck();
  },
};
GAMES.blocks = blocks;
