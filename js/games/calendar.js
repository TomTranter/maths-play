// Calendar Caterpillar — days of the week, months and seasons.
// NC Y1: sequence events in chronological order; recognise and use language relating to dates,
// including days of the week, weeks, months and years (today, yesterday, tomorrow).
"use strict";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SEASON_OF = (m) => ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"][m];
const SEASON_ART = {
  spring: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 38 V20" stroke="#3f8f33" stroke-width="3"/><path d="M20 30 q-8 -2 -10 -8 q8 0 10 8z" fill="#2ec27e"/>' + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="20" cy="9" rx="5" ry="7" fill="#f15bb5" transform="rotate(${a} 20 16)"/>`).join("") + '<circle cx="20" cy="16" r="4" fill="#ffd23f"/></svg>',
  summer: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="9" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/>' + Array.from({ length: 8 }, (_, i) => `<path d="M20 4 V9" stroke="#e0a800" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 45} 20 20)"/>`).join("") + "</svg>",
  autumn: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 C 30 12, 34 22, 20 34 C 6 22, 10 12, 20 4 Z" fill="#ff9f1c" stroke="#a85a00" stroke-width="2"/><path d="M20 8 V38" stroke="#a85a00" stroke-width="2"/></svg>',
  winter: '<svg viewBox="0 0 40 40" aria-hidden="true">' + [0, 60, 120].map((a) => `<path d="M20 4 V36 M14 8 L20 13 L26 8 M14 32 L20 27 L26 32" stroke="#3aa6e8" stroke-width="3" fill="none" stroke-linecap="round" transform="rotate(${a} 20 20)"/>`).join("") + "</svg>",
};

const calendar = {
  id: "calendar", name: "Calendar Caterpillar", strand: "Days, months & seasons",
  levels: [
    { label: "Days in order", kind: "missing" },
    { label: "Before, after, tomorrow", kind: "relative" },
    { label: "Months and seasons", kind: "months" },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${20 + i * 20}" cy="${52 - (i % 2) * 6}" r="12" fill="${i === 4 ? "#2ec27e" : "#8ee07a"}" stroke="#3f8f33" stroke-width="2.5"/>`).join("")}
    <circle cx="104" cy="44" r="5" fill="#fff"/><circle cx="105" cy="44" r="2.5" fill="#1d3557"/>
    <path d="M98 34 l-4 -10 M106 33 l3 -10" stroke="#3f8f33" stroke-width="2.5" stroke-linecap="round"/>
    ${["M", "T", "W", "T"].map((d, i) => `<text x="${20 + i * 20}" y="${57 - (i % 2) * 6}" text-anchor="middle" font-size="12" font-weight="800" fill="#1d3557" font-family="Baloo 2, sans-serif">${d}</text>`).join("")}
  </svg>`,
  // Text choices that read themselves out when a wrong one is tapped (helps children who can't read yet).
  wordChoices(answer, options, hint, winText, winSay, art) {
    const g = $("ground"); g.innerHTML = "";
    shuffle([answer, ...options]).forEach((o) => {
      const b = h(`<button class="choice wide${art ? " pic" : ""}">${art ? art(o) : ""}<span></span></button>`);
      b.querySelector("span").textContent = o[0].toUpperCase() + o.slice(1);
      b.onclick = () => {
        if (busy) return;
        if (o === answer) win(b, winText, winSay);
        else { b.disabled = true; shakeEl(b); miss(`That's ${o}. ${hint}`); }
      };
      g.append(b);
    });
  },
  caterpillar(names, hole, short = true) {
    const segs = names.map((d, i) => `<span class="seg${i === hole ? " hole" : ""}">${i === hole ? "?" : short ? d.slice(0, 3) : d}</span>`).join("");
    return `<div class="caterpillar">${segs}<span class="cat-head"><i></i><i></i></span></div>`;
  },
  next() {
    const L = level(calendar);
    newTask({ kind: L.kind });
    const others = (list, ans, near) => shuffle(list.filter((x) => x !== ans && near.includes(x))).slice(0, 2);
    if (L.kind === "missing") {
      const hole = rand(1, 6), ans = DAYS[hole], prev = DAYS[hole - 1];
      $("stage").replaceChildren(h(calendar.caterpillar(DAYS, hole)));
      setInstruction("Which <b>day</b> is missing?", "Which day is missing from the caterpillar?");
      calendar.wordChoices(ans, others(DAYS, ans, DAYS), "Which day is missing?", ans, `Yes! ${ans} comes after ${prev}.`);
    } else if (L.kind === "relative") {
      const i = rand(0, 6), day = DAYS[i];
      const kind = pick(["after", "before", "tomorrow", "yesterday"]);
      const j = kind === "after" || kind === "tomorrow" ? (i + 1) % 7 : (i + 6) % 7, ans = DAYS[j];
      $("stage").replaceChildren(h(calendar.caterpillar(DAYS, -1)));
      const near = [DAYS[(i + 1) % 7], DAYS[(i + 6) % 7], DAYS[(i + 2) % 7], day];
      const opts = others(DAYS, ans, near);
      if (kind === "after" || kind === "before") {
        setInstruction(`What day comes <b>${kind}</b> ${day}?`, `What day comes ${kind} ${day}?`);
        calendar.wordChoices(ans, opts, `What day comes ${kind} ${day}?`, ans, `Yes! ${ans} comes ${kind} ${day}.`);
      } else {
        setInstruction(`Today is <b>${day}</b>. What day is ${kind}?`, `If today is ${day}, what day is ${kind}?`);
        calendar.wordChoices(ans, opts, kind === "tomorrow" ? "Tomorrow is the next day." : "Yesterday was the day before.", ans, kind === "tomorrow" ? `Yes! Tomorrow is ${ans}.` : `Yes! Yesterday was ${ans}.`);
      }
    } else {
      const m = rand(0, 11), month = MONTHS[m];
      if (Math.random() < 0.5) {
        const ans = MONTHS[(m + 1) % 12];
        const show = Array.from({ length: 6 }, (_, k) => MONTHS[(m - 4 + k + 12) % 12]);
        $("stage").replaceChildren(h(calendar.caterpillar(show, 5)));
        setInstruction(`What month comes after <b>${month}</b>?`, `What month comes after ${month}?`);
        calendar.wordChoices(ans, others(MONTHS, ans, [MONTHS[(m + 2) % 12], MONTHS[(m + 11) % 12], MONTHS[(m + 3) % 12]]), `What month comes after ${month}?`, ans, `Yes! ${ans} comes after ${month}.`);
      } else {
        const ans = SEASON_OF(m);
        $("stage").replaceChildren(h(`<div class="season-card"><span>${month}</span></div>`));
        setInstruction(`Which <b>season</b> is ${month} in?`, `Which season is ${month} in?`);
        calendar.wordChoices(ans, shuffle(["spring", "summer", "autumn", "winter"].filter((s) => s !== ans)).slice(0, 2),
          `Which season is ${month} in?`, `${month}: ${ans}`, `Yes! ${month} is in ${ans}.`, (s) => SEASON_ART[s]);
      }
    }
  },
};
GAMES.calendar = calendar;
