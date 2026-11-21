// Number Garden — boot: wire the chrome, restore progress, route, register the offline cache.
"use strict";

$("say").addEventListener("click", () => say(spokenInstruction));
$("homeBtn").addEventListener("click", () => { click(false); location.hash = ""; });
$("soundBtn").addEventListener("click", () => {
  S.sound = !S.sound; save(); renderControls();
  if (!S.sound) { stopClips(); try { speechSynthesis.cancel(); } catch {} } else chime(2);
});

function closeSheets() { document.querySelectorAll(".sheet").forEach((s) => s.remove()); }
function sheet(inner) {
  closeSheets();
  const el = h(`<div class="sheet" role="dialog" aria-modal="true"><div class="panel">${inner}</div></div>`);
  el.addEventListener("click", (e) => { if (e.target === el) el.remove(); });
  document.body.append(el);
  return el;
}

// Level list for one game: pick any level; it starts fresh from there.
function openLevelPicker(g) {
  const p = prog(g.id);
  const el = sheet(`<h2></h2><p class="note">Choose a level</p><div class="level-list"></div><button class="soft cancel">Close</button>
    <p class="note version">Number Garden ${APP_VERSION}</p>`);
  el.querySelector("h2").textContent = g.name;
  const list = el.querySelector(".level-list");
  g.levels.forEach((L, i) => {
    const b = h(`<button class="level-btn${i === p.level ? " on" : ""}"><span class="lvl-num">${i + 1}</span><span class="lvl-name"></span></button>`);
    b.querySelector(".lvl-name").textContent = L.label;
    b.onclick = () => {
      p.level = i; p.rounds = 0; save(); el.remove(); click();
      renderControls(); g.next(true);
    };
    list.append(b);
  });
  el.querySelector(".cancel").onclick = () => el.remove();
}
addEventListener("hashchange", show);

(function start() {
  const saved = loadState();
  S.score = +saved.score || 0;
  S.sound = saved.sound !== false;
  S.mode = saved.mode === "down" ? "down" : "up";
  S.prog = saved.prog && typeof saved.prog === "object" ? saved.prog : {};
  save();
  show();
})();

// Offline support. Only works over http(s); opening index.html as a file still plays, just not offline-cached.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
