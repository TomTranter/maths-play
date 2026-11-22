// Self-test: open the app with ?selftest (all games that have a test hook) or ?selftest=<id> (one game).
// For every level it starts a round, calls game.test.answer() (which plays the right answer through the
// real buttons), and checks a star was awarded. It also lists any spoken sentence that has no Cori
// recording, and any sentence a game says that its voiceLines() doesn't declare.
// Results appear in a panel on screen and in window.__selftest.
"use strict";

if (/[?&]selftest/.test(location.search)) addEventListener("load", () => setTimeout(runSelfTest, 400));

// test.answer() clicks elements directly, which works even when a child couldn't see them, so also look.
function screenProblems() {
  const stage = $("stage"), board = stage.firstElementChild, out = [];
  if (!board) return ["nothing on the stage"];
  const slack = 3, sb = stage.getBoundingClientRect();
  const name = (e) => `<${e.tagName.toLowerCase()} class="${e.getAttribute("class") || ""}">`;
  for (const e of document.querySelectorAll("#stage button:not([disabled]), #ground button:not([disabled])")) {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    if (cs.display === "none" || cs.visibility === "hidden" || e.closest("[hidden]") || e.getAnimations().length) continue;
    if (!r.width || !r.height) { out.push(`${name(e)} has no size`); continue; }
    const box = stage.contains(e) ? sb : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    if (r.left < box.left - slack || r.top < box.top - slack || r.right > box.right + slack || r.bottom > box.bottom + slack) out.push(`${name(e)} is off the screen at ${innerWidth}×${innerHeight}`);
    if (e.matches(".sym-card, .share-card, .choice") && !e.textContent.trim() && !e.querySelector("svg, .sq")) out.push(`${name(e)} is blank`);
  }
  for (const e of document.querySelectorAll("#ground > :not(button), #ground .box")) {
    const g = e.getBoundingClientRect();
    if (g.width && !e.getAnimations().length && (g.left < -slack || g.right > innerWidth + slack || g.bottom > innerHeight + slack)) out.push(`${name(e)} is off the grass at ${innerWidth}×${innerHeight}`);
  }
  const r = board.getBoundingClientRect();
  if (!board.getAnimations({ subtree: true }).length && (r.left < sb.left - slack || r.top < sb.top - slack || r.right > sb.right + slack || r.bottom > sb.bottom + slack)) out.push(`the board doesn't fit at ${innerWidth}×${innerHeight}`);
  return [...new Set(out)];
}

async function runSelfTest() {
  const only = new URLSearchParams(location.search).get("selftest") || "";
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 60 && !clipMap; i++) await pause(50);

  // Speak nothing and move on instantly, so a full run takes seconds, not minutes.
  const heard = new Set();
  say = (text) => { if (text) heard.add(text); return Promise.resolve(); };
  afterSpeech = (speech, _ms, fn) => { const g = gen; speech.then(() => { if (g === gen) fn(); }); };

  const sentences = (line) => (line.match(/[^.!?]+[.!?]*/g) || []).map((s) => s.trim()).filter((s) => clipKey(s));
  // Lines the core says for every game (praise, level-up) count as declared.
  const declared = new Set([...PRAISE, "Perfect!", "Level up!"].map(clipKey));
  for (const g of Object.values(GAMES)) {
    try { (g.voiceLines?.() || []).forEach((l) => sentences(l).forEach((s) => declared.add(clipKey(s)))); } catch {}
    (g.levels || []).forEach((L) => declared.add(clipKey(L.label)));
  }

  const results = [];
  for (const g of Object.values(GAMES)) {
    if (only && only !== g.id) continue;
    if (typeof g.test?.answer !== "function") { if (only) results.push({ id: g.id, status: "no test hook" }); continue; }
    location.hash = g.id;
    await pause(150);
    const fails = [], before = new Set(heard);
    for (let lv = 0; lv < g.levels.length; lv++) {
      for (let r = 0; r < 3; r++) {
        prog(g.id).level = lv; prog(g.id).rounds = 0; renderControls();
        gen++; g.next(true); busy = false;
        await pause(80);
        const t = task, s0 = S.score;
        for (const p of screenProblems()) fails.push(`level ${lv + 1}: ${p}`);
        try { await g.test.answer(); }
        catch (e) { fails.push(`level ${lv + 1}: test.answer() threw "${e.message}"`); continue; }
        for (let i = 0; i < 240 && S.score === s0; i++) await pause(50); // up to 12s: a long robot route takes a while
        if (S.score === s0) fails.push(`level ${lv + 1}: the right answer didn't award a star`);
        for (let i = 0; i < 80 && task === t; i++) await pause(50);
        if (task === t) fails.push(`level ${lv + 1}: didn't move on to a new round`);
      }
    }
    const said = [...heard].filter((l) => !before.has(l));
    const undeclared = g.voiceLines ? [...new Set(said.flatMap(sentences).filter((s) => !declared.has(clipKey(s))))] : [];
    fails.push(...markupErrors); markupErrors.clear();
    results.push({ id: g.id, status: fails.length ? "FAIL" : "ok", fails: [...new Set(fails)], undeclared });
  }
  location.hash = "";

  const noVoice = [...new Set([...heard].flatMap(sentences).filter((s) => clipMap && !clipMap[clipKey(s)]))];
  window.__selftest = { results, noVoice };
  console.log("selftest", JSON.stringify(window.__selftest, null, 2));

  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const panel = document.createElement("div");
  panel.className = "selftest";
  panel.innerHTML = `<h2>Self-test</h2>` +
    (results.length ? results.map((r) => `<p><b class="${r.status === "ok" ? "ok" : "bad"}">${esc(r.status)}</b> ${esc(r.id)}` +
      (r.fails?.length ? `<br>${r.fails.map(esc).join("<br>")}` : "") +
      (r.undeclared?.length ? `<br><i>Not in voiceLines():</i> ${r.undeclared.map(esc).join(" · ")}` : "") + "</p>").join("")
      : "<p>No game has a test hook yet (game.test.answer).</p>") +
    `<p><b class="${noVoice.length ? "bad" : "ok"}">${noVoice.length ? noVoice.length + " sentences have no recording" : "Every sentence has a recording"}</b>` +
    (noVoice.length ? `<br>${noVoice.slice(0, 40).map(esc).join(" · ")}<br>Run <code>uv run tools/make_voice.py</code>.` : "") + "</p>" +
    `<button onclick="this.parentElement.remove()">Close</button>`;
  document.body.append(panel);
}
