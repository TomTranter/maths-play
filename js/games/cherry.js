// Cherry Bonds — part-whole number bonds. NC Y1: represent and use number bonds and related
// subtraction facts within 20; solve missing number problems such as 7 = ? − 9.
// NC Y2: recall and use addition and subtraction facts to 20; use the inverse relationship.
"use strict";

// Part-whole "cherry": whole on top, two parts below. Values are numbers or "?".
function cherrySVG(whole, a, b, showDots) {
  const dots = (n, cx, cy, r) => {
    if (!showDots || typeof n !== "number" || n > 10) return "";
    const pts = Array.from({ length: n }, (_, i) => { const row = Math.floor(i / 5), col = i % 5; return [cx - 28 + col * 14, cy + 24 + row * 13]; });
    return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ff4d6d"/>`).join("");
  };
  const circle = (v, cx, cy, r, cls) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}${v === "?" ? " missing" : ""}"/>
    <text x="${cx}" y="${cy + (showDots && typeof v === "number" && v <= 10 ? 2 : 14)}" text-anchor="middle" class="cherry-num${v === "?" ? " q" : ""}">${v}</text>`;
  return `<svg viewBox="0 0 320 270" aria-hidden="true">
    <path d="M160 92 L82 178 M160 92 L238 178" stroke="#3f8f33" stroke-width="8" stroke-linecap="round"/>
    ${circle(whole, 160, 62, 56, "whole")}${dots(whole, 160, 62)}
    ${circle(a, 82, 200, 52, "part")}${dots(a, 82, 200)}
    ${circle(b, 238, 200, 52, "part")}${dots(b, 238, 200)}
  </svg>`;
}

const cherry = {
  id: "cherry", name: "Cherry Bonds", strand: "Part-whole & missing numbers",
  levels: [
    { label: "Bonds to 10", kind: "bond", max: 10 },
    { label: "Bonds to 20", kind: "bond", max: 20 },
    { label: "Missing numbers", kind: "eq", max: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true"><g transform="translate(16 2) scale(.28)">${cherrySVG(10, 7, "?", false).replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
  next() {
    const L = level(cherry);
    const whole = rand(L.max === 10 ? 3 : 11, L.max), a = rand(L.max === 10 ? 0 : 1, whole - (L.max === 10 ? 0 : 1)), b = whole - a;
    const t = newTask({ whole, a, b });
    if (L.kind === "bond") {
      const hide = pick(["a", "b", "b", "whole"]);
      const ans = { a, b, whole }[hide];
      t.answer = ans;
      const v = (k) => (k === hide ? "?" : { a, b, whole }[k]);
      const wrap = h(`<div class="cherry">${cherrySVG(v("whole"), v("a"), v("b"), L.max === 10)}</div>`);
      t.wrap = wrap;
      $("stage").replaceChildren(wrap);
      if (hide === "whole") setInstruction("What is the <b>whole</b>?", "What is the whole? Put the parts together.");
      else setInstruction("What is the missing <b>part</b>?", "What is the missing part?");
      t.onWin = () => { t.wrap.innerHTML = cherrySVG(whole, a, b, L.max === 10); };
      choices(ans, distractors(ans, 0, 20, [-1, 1, -2, 2]), hide === "whole" ? "Add the two parts together." : "Count on from the part you know.",
        `${a} + ${b} = ${whole}`, `Yes! ${a} and ${b} make ${whole}.`);
    } else {
      // number sentence with one missing value, in different shapes
      // [sentence, which value is missing]
      const forms = [
        [`? + ${b} = ${whole}`, "a"], [`${a} + ? = ${whole}`, "b"], [`${whole} − ? = ${a}`, "b"],
        [`? − ${b} = ${a}`, "whole"], [`${whole} = ? + ${b}`, "a"], [`${a} = ${whole} − ?`, "b"],
      ];
      const [text, miss_] = pick(forms);
      const ans = { a, b, whole }[miss_];
      t.answer = ans;
      const v = (k) => (k === miss_ ? "?" : { a, b, whole }[k]);
      // the helper cherry hides the same value as the sentence, so it never gives the answer away
      const wrap = h(`<div class="cherry-eq"><div class="eq big">${text.replace("?", '<span class="q">?</span>')}</div><div class="cherry small">${cherrySVG(v("whole"), v("a"), v("b"), false)}</div></div>`);
      t.wrap = wrap;
      $("stage").replaceChildren(wrap);
      setInstruction("What is the missing <b>number</b>?", "What is the missing number? Use the cherry to help.");
      t.onWin = () => {
        wrap.querySelector(".eq").innerHTML = text.replace("?", `<span class="q">${ans}</span>`);
        wrap.querySelector(".cherry").innerHTML = cherrySVG(whole, a, b, false);
      };
      choices(ans, distractors(ans, 0, 20, [-1, 1, -2, 2, 10]), "Find the whole and the two parts.", text.replace("?", ans), "Yes! The number sentence is true.");
    }
  },
};
// Plays the right answer through the real controls (used by ?selftest).
cherry.test = {
  answer() { tapChoice(task.answer); },
};
GAMES.cherry = cherry;
