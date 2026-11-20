// Ladybird Doubles — doubles and halves, then odd and even with socks.
// NC Y1: represent and use number bonds; doubles. NC Y2: recall and use doubling and halving facts;
// recognise odd and even numbers.
"use strict";

// Spot centres on the left wing (x < 0); the right wing mirrors them. Ladybird centred on (0, 0).
const SPOTS = [[-38, -22], [-58, 4], [-34, 18], [-20, -40], [-62, -26], [-16, 0], [-44, 44], [-20, 34], [-70, 28], [-52, -48]];
const ladybirdSVG = (left, right, hit = false) => `<svg viewBox="-110 -110 220 220" aria-hidden="true">
  <circle cx="0" cy="-82" r="26" fill="#1d3557"/><circle cx="-10" cy="-88" r="5" fill="#fff"/><circle cx="10" cy="-88" r="5" fill="#fff"/>
  <path d="M-14 -104 q-10 -14 -20 -12 M14 -104 q10 -14 20 -12" stroke="#1d3557" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M0 -64 A86 86 0 0 0 0 100 A86 86 0 0 0 0 -64 Z" fill="#1d3557"/>
  <path class="wing-l" d="M-2 -62 C -60 -62, -96 -10, -84 34 C -74 76, -30 96, -2 98 Z" fill="#ff4d6d" stroke="#1d3557" stroke-width="4"/>
  <path class="wing-r${hit ? " wing-tap" : ""}" d="M2 -62 C 60 -62, 96 -10, 84 34 C 74 76, 30 96, 2 98 Z" fill="#ff4d6d" stroke="#1d3557" stroke-width="4"/>
  ${SPOTS.slice(0, left).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#1d3557"/>`).join("")}
  ${SPOTS.slice(0, right).map(([x, y], i) => `<circle class="spot-r" data-i="${i}" cx="${-x}" cy="${y}" r="11" fill="#1d3557"/>`).join("")}
</svg>`;
const SOCK_COLS = ["#ff4d6d", "#3aa6e8", "#2ec27e", "#ffd23f", "#9b5de5", "#ff9f1c"];
const sockSVG = (c) => `<svg viewBox="0 0 40 56" aria-hidden="true"><path d="M8 2 h18 v30 l10 10 a8 8 0 0 1 -6 13 h-14 a8 8 0 0 1 -8 -8 z" fill="${c}" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/><rect x="8" y="2" width="18" height="8" fill="#fff" opacity=".6"/></svg>`;

const doubles = {
  id: "doubles", name: "Ladybird Doubles", strand: "Doubles, odd & even",
  levels: [
    { label: "Copy the spots", kind: "copy" },
    { label: "Doubles and halves", kind: "double" },
    { label: "Odd or even", kind: "oddeven" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true"><g transform="translate(60 47) scale(.38)">${ladybirdSVG(3, 3).replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
  next() {
    const L = level(doubles);
    const t = newTask({ kind: L.kind });
    $("ground").replaceChildren();
    if (L.kind === "copy") {
      Object.assign(t, { n: rand(1, 5), right: 0, phase: "copy" });
      const wrap = h('<div class="ladybird"></div>');
      t.wrap = wrap;
      doubles.renderBug();
      wrap.addEventListener("click", (e) => doubles.tapWing(e));
      $("stage").replaceChildren(wrap);
      setInstruction("Give the other wing the <b>same</b> spots", "Give the other wing the same spots. Tap the wing to add a spot.");
      checkRow((btn) => doubles.checkCopy(btn), () => { t.right = 0; doubles.renderBug(); });
    } else if (L.kind === "double") {
      const n = rand(1, 10), half = Math.random() < 0.4;
      Object.assign(t, { n });
      $("stage").replaceChildren(h(`<div class="ladybird">${ladybirdSVG(n, n)}</div>`));
      if (half) {
        setInstruction(`This ladybird has <b>${2 * n}</b> spots. How many on each wing?`, `This ladybird has ${2 * n} spots. How many on each wing?`);
        choices(n, distractors(n, 1, 12, [-1, 1, -2, 2]), "Count the spots on one wing.", `Yes! ${n}`, `Yes! Half of ${2 * n} is ${n}.`);
      } else {
        setInstruction(`What is double <b>${n}</b>?`, `What is double ${n}?`);
        choices(2 * n, distractors(2 * n, 2, 20, [-1, 1, -2, 2]), "Count all the spots.", `Yes! ${2 * n}`, `Yes! Double ${n} is ${2 * n}.`);
      }
    } else {
      const N = rand(3, 16);
      Object.assign(t, { N, placed: 0, landed: 0 });
      const wrap = h(`<div class="socks"><div class="sock-pile"></div><div class="line">${Array.from({ length: Math.ceil(N / 2) }, () => '<div class="pair"><span class="peg"></span><span class="peg"></span></div>').join("")}</div></div>`);
      const pile = wrap.querySelector(".sock-pile");
      t.pairs = [...wrap.querySelectorAll(".pair")];
      t.cols = Array.from({ length: Math.ceil(N / 2) }, (_, i) => SOCK_COLS[i % SOCK_COLS.length]);
      pile.innerHTML = shuffle(Array.from({ length: N }, (_, i) => i)).map(() => `<button class="sock" aria-label="Sock">${sockSVG("#d9dde3")}</button>`).join("");
      pile.addEventListener("click", (e) => doubles.hangSock(e.target.closest(".sock")));
      $("stage").replaceChildren(wrap);
      setInstruction(`Pair up the <b>${N}</b> socks`, `Pair up the ${N} socks. Tap a sock to hang it up.`);
    }
  },
  renderBug() {
    const t = task;
    t.wrap.innerHTML = ladybirdSVG(t.n, t.right, true);
  },
  tapWing(e) {
    const t = task;
    if (busy || t.phase !== "copy") return;
    if (e.target.closest(".spot-r")) { t.right--; click(false); }
    else if (e.target.closest(".wing-r") && t.right < 10) { t.right++; click(); }
    else return;
    doubles.renderBug();
  },
  checkCopy(btn) {
    const t = task;
    if (t.right !== t.n) { shakeEl(t.wrap); miss(t.right < t.n ? "Count the spots on each wing." : "Too many spots! Tap a spot to take it off."); return; }
    t.phase = "ask";
    chime(2);
    setInstruction(`What is double <b>${t.n}</b>?`, `Both wings have ${t.n}. What is double ${t.n}?`);
    choices(2 * t.n, distractors(2 * t.n, 2, 12, [-1, 1, -2, 2]), "Count all the spots.", `Yes! ${2 * t.n}`, `Yes! Double ${t.n} is ${2 * t.n}.`);
  },
  hangSock(sock) {
    const t = task;
    if (!sock || busy || t.kind !== "oddeven" || sock.classList.contains("gone")) return;
    const i = t.placed++, pair = t.pairs[Math.floor(i / 2)], color = t.cols[Math.floor(i / 2)];
    sock.classList.add("gone");
    click();
    const s = h(`<span class="hung">${sockSVG(color)}</span>`);
    pair.append(s);
    if (!reduced) s.animate([{ transform: "translateY(60px) scale(.6)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 250, easing: "ease-out" });
    if (t.placed === t.N) {
      const odd = t.N % 2 === 1;
      if (odd) pair.classList.add("alone");
      later(() => {
        setInstruction(`Is <b>${t.N}</b> odd or even?`, `Is ${t.N} odd or even?`);
        const g = $("ground"); g.innerHTML = "";
        for (const ans of ["odd", "even"]) {
          const b = h(`<button class="choice wide">${ans === "odd" ? "Odd" : "Even"}</button>`);
          b.onclick = () => {
            if (busy) return;
            if ((ans === "odd") === odd) win(b, `Yes! ${t.N} is ${ans}`, odd ? `Yes! ${t.N} is odd. One sock is left over.` : `Yes! ${t.N} is even. Every sock has a partner.`);
            else { b.disabled = true; shakeEl(b); miss("Look at the last sock. Does it have a partner?"); }
          };
          g.append(b);
        }
      }, 400);
    }
  },
};
GAMES.doubles = doubles;
