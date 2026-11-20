// Balloon Pop — ordering numbers (smallest first / biggest first). NC Y1: compare and order numbers.
"use strict";

function balloonSVG(n, c, id) {
  const digits = String(n).length, fs = digits === 1 ? 58 : digits === 2 ? 48 : 36;
  return `<svg viewBox="0 0 100 160" aria-hidden="true">
    <defs><radialGradient id="g${id}" cx="35%" cy="28%" r="80%">
      <stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".22" stop-color="${c.base}"/><stop offset="1" stop-color="${c.dark}"/>
    </radialGradient></defs>
    <path d="M50 112 C 40 126, 60 138, 48 158" fill="none" stroke="#56627a" stroke-width="1.8"/>
    <path d="M50 4 C 80 4 95 30 95 53 C 95 81 71 102 50 106 C 29 102 5 81 5 53 C 5 30 20 4 50 4 Z" fill="url(#g${id})"/>
    <path d="M43 113 L50 104 L57 113 Z" fill="${c.dark}"/>
    <ellipse cx="30" cy="30" rx="7" ry="13" fill="#fff" opacity=".45" transform="rotate(25 30 30)"/>
    <text x="50" y="${56 + fs * 0.36}" text-anchor="middle" font-size="${fs}" class="num" stroke="${c.dark}">${n}</text>
  </svg>`;
}

const balloons = {
  id: "balloons", name: "Balloon Pop", strand: "Ordering numbers",
  levels: [10, 20, 50, 100].map((m) => ({ label: "Up to " + m, max: m })),
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">
    ${[[28, 38, "#ff4d6d", 2], [60, 30, "#3aa6e8", 5], [92, 40, "#2ec27e", 8]].map(([x, y, c, n]) =>
      `<path d="M${x} ${y + 22} q-4 10 2 20" stroke="#56627a" fill="none" stroke-width="1.5"/><ellipse cx="${x}" cy="${y}" rx="16" ry="20" fill="${c}"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-size="22" class="num" stroke="${c}" style="stroke-width:3">${n}</text>`).join("")}
  </svg>`,
  word: () => (S.mode === "up" ? "smallest" : "biggest"),
  extraControls(c) {
    const b = h(`<button class="round-btn" aria-label="Change order">${S.mode === "up" ? "1→3" : "3→1"}</button>`);
    b.onclick = () => {
      S.mode = S.mode === "up" ? "down" : "up"; save(); renderControls(); balloons.next(true);
    };
    c.append(b);
  },
  next(first) {
    const max = level(balloons).max;
    const set = new Set();
    while (set.size < 3) set.add(rand(1, max));
    const nums = shuffle([...set]);
    const order = [...nums].sort((a, b) => (S.mode === "up" ? a - b : b - a));
    const cols = shuffle([...COLORS]).slice(0, 3);
    newTask({ nums, order, cols, step: 0, els: [] });
    busy = true;
    const w = balloons.word();
    setInstruction(`Pop the <b>${w}</b> number first!`, `Pop the ${w} number first!`, !!first);

    const sign = S.mode === "up" ? "&lt;" : "&gt;";
    $("ground").innerHTML = `<div class="tray"><div class="box"></div><span class="sign">${sign}</span><div class="box"></div><span class="sign">${sign}</span><div class="box"></div></div>`;
    const sky = h('<div class="sky-row"></div>');
    $("stage").replaceChildren(sky);
    nums.forEach((n, i) => {
      const wrap = document.createElement("div");
      wrap.className = "float";
      const dy = rand(-45, 35);
      wrap.style.transform = `translateY(${dy}px)`;
      const b = document.createElement("button");
      b.className = "balloon";
      b.setAttribute("aria-label", "Balloon " + n);
      b.style.animationDelay = `${-Math.random() * 3}s`;
      b.innerHTML = balloonSVG(n, cols[i], `${gen}x${i}`);
      b.addEventListener("click", () => balloons.tap(i));
      wrap.appendChild(b); sky.appendChild(wrap);
      task.els.push(b);
      if (!reduced) {
        wrap.animate([{ transform: `translateY(${dy + innerHeight * 0.7}px)` }, { transform: `translateY(${dy}px)` }],
          { duration: 900, delay: i * 140, easing: "cubic-bezier(.2,.9,.3,1.05)", fill: "backwards" });
      }
    });
    later(() => (busy = false), reduced ? 0 : 1000);
  },
  tap(i) {
    if (busy || !task) return;
    const b = task.els[i];
    if (b.classList.contains("popped")) return;
    const n = task.nums[i];
    if (n !== task.order[task.step]) {
      b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      miss(S.mode === "up" ? "Oops! Is there a smaller number?" : "Oops! Is there a bigger number?");
      if (task.mistakes >= 2) task.els[task.nums.indexOf(task.order[task.step])].classList.add("hint");
      return;
    }
    const r = b.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height * 0.33;
    b.classList.add("popped"); b.classList.remove("hint");
    popSound(); chime(task.step);
    burst(x, y, task.cols[i].base);
    floatText("plus", "+1", x, y - 30);
    bumpScore(1);
    task.lastSay = say(String(n), 150);

    const slot = task.step;
    const box = document.querySelectorAll(".box")[slot];
    const sign = slot > 0 ? document.querySelectorAll(".sign")[slot - 1] : null;
    const fill = () => {
      if (!box?.isConnected) return; // the round moved on while the number was flying
      box.textContent = n; box.classList.add("filled");
      sign?.classList.add("on");
    };
    if (reduced) fill();
    else {
      const fl = document.createElement("div");
      fl.className = "flyer"; fl.textContent = n; document.body.appendChild(fl);
      const br = box.getBoundingClientRect(), w = fl.offsetWidth, hh = fl.offsetHeight;
      fl.animate(
        [{ transform: `translate(${x - w / 2}px, ${y - hh / 2}px) scale(1.4)` },
         { transform: `translate(${br.left + br.width / 2 - w / 2}px, ${br.top + br.height / 2 - hh / 2}px) scale(1)` }],
        { duration: 550, easing: "cubic-bezier(.5,0,.3,1)" }
      ).onfinish = () => { fl.remove(); fill(); };
    }
    task.step++;
    if (task.step === 3) {
      busy = true;
      const perfect = task.mistakes === 0;
      afterSpeech(task.lastSay, reduced ? 100 : 600, () => {
        fanfare(); confetti();
        if (perfect) bumpScore(2);
        const up = advance();
        banner(up ? "Level up!" : perfect ? "Perfect! +2" : "Well done!");
        afterSpeech(say(up ? `Level up! ${level(balloons).label}` : perfect ? "Perfect!" : "Well done!", 200), 2000, () => balloons.next());
      });
    }
  },
};
GAMES.balloons = balloons;
