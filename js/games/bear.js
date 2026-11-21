// Hungry Bear — subtraction as taking away. NC Y1: read, write and interpret mathematical statements involving
// subtraction (-) and equals (=) signs; subtract one-digit and two-digit numbers to 20, including zero;
// solve missing number problems such as 7 = ? - 9.
//
// A plate of cookies; the bear eats some (each leaves an empty dashed space with crumbs), then the number
// sentence appears and the child picks the answer. Level 3 asks how many the bear ate (count the empty spaces).
"use strict";

const BEAR_FACE = `
  <circle cx="22" cy="22" r="15" fill="#b07a43" stroke="#7a5128" stroke-width="4"/>
  <circle cx="98" cy="22" r="15" fill="#b07a43" stroke="#7a5128" stroke-width="4"/>
  <circle cx="22" cy="22" r="7" fill="#e8c084"/><circle cx="98" cy="22" r="7" fill="#e8c084"/>
  <circle cx="60" cy="56" r="44" fill="#b07a43" stroke="#7a5128" stroke-width="4"/>
  <circle cx="44" cy="44" r="5.5" fill="#1d3557"/><circle cx="76" cy="44" r="5.5" fill="#1d3557"/>
  <circle cx="45.5" cy="42.5" r="1.8" fill="#fff"/><circle cx="77.5" cy="42.5" r="1.8" fill="#fff"/>
  <ellipse cx="60" cy="70" rx="22" ry="17" fill="#e8c084"/>
  <ellipse cx="60" cy="61" rx="8" ry="5.5" fill="#1d3557"/>`;
const BEAR_SVG = `<svg viewBox="0 0 120 110" aria-hidden="true">${BEAR_FACE}
  <path class="bear-mouth" d="M50 75 q10 9 20 0" fill="none" stroke="#1d3557" stroke-width="3.5" stroke-linecap="round"/>
  <ellipse class="bear-open" cx="60" cy="78" rx="8" ry="6" fill="#7a1f2b"/></svg>`;
const BEAR_COOKIE = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#e0a85a" stroke="#9c6a2c" stroke-width="3"/>
  <circle cx="13" cy="14" r="3" fill="#5a3418"/><circle cx="25" cy="12" r="2.6" fill="#5a3418"/><circle cx="27" cy="25" r="3" fill="#5a3418"/>
  <circle cx="15" cy="27" r="2.6" fill="#5a3418"/><circle cx="20" cy="20" r="2" fill="#5a3418"/></svg>`;
const BEAR_CRUMBS = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="14" cy="24" r="2.4" fill="#c98f44"/><circle cx="24" cy="18" r="2" fill="#c98f44"/><circle cx="26" cy="27" r="1.8" fill="#c98f44"/></svg>`;
const BEAR_MAX_N = 20;

const bear = {
  id: "bear", name: "Hungry Bear", strand: "Take away",
  levels: [
    { label: "Take away to 10", kind: "left", lo: 3, hi: 10 },
    { label: "Take away to 20", kind: "left", lo: 11, hi: 20 },
    { label: "How many eaten?", kind: "ate", lo: 5, hi: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    <g transform="translate(4 8) scale(.5)">${BEAR_FACE}<path d="M50 75 q10 9 20 0" fill="none" stroke="#1d3557" stroke-width="3.5" stroke-linecap="round"/></g>
    <ellipse cx="88" cy="66" rx="30" ry="10" fill="#fff" stroke="#1d3557" stroke-width="3"/>
    <g transform="translate(66 46) scale(.5)">${BEAR_COOKIE.replace(/<\/?svg[^>]*>/g, "")}</g>
    <g transform="translate(88 46) scale(.5)">${BEAR_COOKIE.replace(/<\/?svg[^>]*>/g, "")}</g>
    <g transform="translate(77 34) scale(.5)">${BEAR_COOKIE.replace(/<\/?svg[^>]*>/g, "")}</g>
  </svg>`,

  css: `
    .bear-wrap { display: flex; flex-direction: column; align-items: center; gap: clamp(6px, 1.6vh, 14px); width: 100%; }
    .bear-scene { display: flex; align-items: center; justify-content: center; gap: clamp(8px, 3vw, 28px); width: 100%; }
    .bear-me { width: clamp(84px, min(24vw, 20vh), 180px); flex: none; }
    .bear-me svg { width: 100%; height: auto; display: block; }
    .bear-me .bear-open { opacity: 0; }
    .bear-me.chomp .bear-open { opacity: 1; }
    .bear-me.chomp .bear-mouth { opacity: 0; }
    .bear-me.chomp svg { animation: bear-munch 0.22s ease-in-out; }
    @keyframes bear-munch { 50% { transform: scale(1.06) rotate(-3deg); } }
    .bear-plate {
      display: grid; grid-template-columns: repeat(5, var(--bear-c)); gap: clamp(3px, 0.8vh, 8px);
      --bear-c: clamp(28px, min(8.5vw, 6.2vh), 58px);
      background: var(--paper); border: 4px solid var(--ink); border-radius: 50%/38%;
      padding: clamp(14px, 3vh, 26px) clamp(18px, 5vw, 36px); box-shadow: 0 6px 0 var(--lift);
    }
    .bear-c { width: var(--bear-c); height: var(--bear-c); border-radius: 50%; position: relative; }
    .bear-c svg { width: 100%; height: 100%; display: block; }
    .bear-c.gone { border: 3px dashed var(--muted); background: var(--paper-soft); }
    .bear-sum {
      background: var(--paper); border-radius: 22px; padding: 4px 22px; box-shadow: 0 5px 0 var(--lift);
      font-size: clamp(2rem, min(9vw, 6vh), 3.4rem); font-weight: 800; line-height: 1.2; font-variant-numeric: tabular-nums;
      white-space: nowrap; animation: bump 0.35s ease-out;
    }
    .bear-sum b { color: var(--pink); }
    .bear-sum[hidden] { display: none; }
  `,

  next() {
    const L = level(bear);
    const n = rand(L.lo, Math.min(L.hi, BEAR_MAX_N));
    const k = rand(1, n - 1);
    const left = n - k;
    const answer = L.kind === "ate" ? k : left;
    const t = newTask({ kind: L.kind, n, k, left, answer, ready: false });

    const wrap = h(`<div class="bear-wrap">
      <div class="bear-scene"><div class="bear-me">${BEAR_SVG}</div>
        <div class="bear-plate" style="grid-template-columns: repeat(${Math.min(5, n)}, var(--bear-c))">${Array.from({ length: n }, () => `<span class="bear-c">${BEAR_COOKIE}</span>`).join("")}</div></div>
      <div class="bear-sum" hidden></div></div>`);
    t.bearEl = wrap.querySelector(".bear-me");
    t.cookies = [...wrap.querySelectorAll(".bear-c")];
    t.sumEl = wrap.querySelector(".bear-sum");
    $("stage").replaceChildren(wrap);
    $("ground").replaceChildren();
    setInstruction(`There were <b>${n}</b> cookies`, `There were ${n} cookies. Watch the bear!`);

    // The bear eats from the end of the plate, one cookie at a time.
    const step = reduced ? 0 : Math.max(150, Math.min(340, Math.round(3000 / k)));
    const eatOne = (i) => {
      if (task !== t) return;
      const c = t.cookies[n - 1 - i];
      const done = () => { c.classList.add("gone"); c.innerHTML = BEAR_CRUMBS; };
      t.bearEl.classList.remove("chomp"); void t.bearEl.offsetWidth; t.bearEl.classList.add("chomp");
      click();
      if (reduced) done();
      else c.firstElementChild.animate(
        [{ transform: "none", opacity: 1 }, { transform: "scale(.2) rotate(90deg)", opacity: 0 }],
        { duration: Math.min(220, step), easing: "ease-in" }
      ).onfinish = done;
      if (i + 1 < k) later(() => eatOne(i + 1), step);
      else later(() => { t.bearEl.classList.remove("chomp"); bear.ask(); }, step + 250);
    };
    later(() => eatOne(0), reduced ? 600 : 1800);
  },

  ask() {
    const t = task;
    t.cookies.slice(t.left).forEach((c) => { c.classList.add("gone"); c.innerHTML = BEAR_CRUMBS; });
    t.sumEl.hidden = false;
    if (t.kind === "ate") {
      t.sumEl.innerHTML = `${t.n} − <b>?</b> = ${t.left}`;
      setInstruction(`Now there are <b>${t.left}</b>. How many did the bear <b>eat</b>?`,
        `There were ${t.n} cookies. ${bear.nowLine(t.left)} How many did the bear eat?`);
      choices(t.k, distractors(t.k, 1, t.n - 1, [-1, 1, -2, 2], [t.left].filter((v) => v !== t.k && Math.random() < 0.5)),
        "Count the empty spaces on the plate.", `Yes! ${t.n} − ${t.k} = ${t.left}`, `Yes! The bear ate ${t.k}.`);
    } else {
      t.sumEl.innerHTML = `${t.n} − ${t.k} = <b>?</b>`;
      setInstruction(`The bear ate <b>${t.k}</b>. How many are <b>left</b>?`,
        `There were ${t.n} cookies. The bear ate ${t.k}. How many are left?`);
      choices(t.left, distractors(t.left, 1, t.n, [-1, 1, -2, 2]),
        "Count the cookies still on the plate.", `Yes! ${t.n} − ${t.k} = ${t.left}`, `Yes! ${bear.leftLine(t.left)}`);
    }
    t.ready = true;
  },

  nowLine: (m) => (m === 1 ? "Now there is 1." : `Now there are ${m}.`),
  leftLine: (m) => (m === 1 ? "1 cookie is left." : `${m} cookies are left.`),

  voiceLines() {
    const lines = [
      "Watch the bear!", "How many are left?", "How many did the bear eat?",
      "Count the empty spaces on the plate.", "Count the cookies still on the plate.",
    ];
    for (let n = 2; n <= BEAR_MAX_N; n++) lines.push(`There were ${n} cookies.`);
    for (let m = 1; m < BEAR_MAX_N; m++) {
      lines.push(`The bear ate ${m}.`, `Yes! The bear ate ${m}.`, bear.nowLine(m), `Yes! ${bear.leftLine(m)}`);
    }
    return lines;
  },

  test: {
    async answer() {
      const t = task;
      for (let i = 0; i < 200 && !(task === t && t.ready); i++) await new Promise((r) => setTimeout(r, 50));
      [...document.querySelectorAll("#ground .choice")].find((b) => +b.textContent === t.answer).click();
    },
  },
};
addGame(bear);
