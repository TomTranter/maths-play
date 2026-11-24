# /// script
# requires-python = ">=3.11"
# dependencies = ["piper-tts==1.8.0", "lameenc==1.9.0", "numpy"]
# ///
"""Listening sheet for every word Cori says (numbers have their own sheet), for spotting odd ones by ear.

Usage:  nice -n 10 uv run tools/word_samples.py   ->  samples/words.html (+ samples/words/<word>/*.mp3)

Each word gets up to three of the app's own recordings that use it. Words listed in FIXES also get
candidate re-recordings to choose between. Mark odd words on the page, then paste the list to Claude.
"""

import json
import re
from collections import defaultdict

import numpy as np
from make_voice import MODEL, OUT, ROOT, all_clips, spoken_length, to_mp3, trim_gentle
from piper import PiperVoice, SynthesisConfig

SHEET = ROOT / "samples" / "words"

# Words that sound wrong, with other ways of saying them (espeak phonemes; Piper reads [[...]] as sounds).
FIXES = {
    "many": ["mˈɛnɪ", "mˈɛniː"],
}
STEADY = {"noise_scale": 0.4, "noise_w_scale": 0.5}
TAKES = 5


def render(voice, text, settings, takes=1):
    renders = []
    for _ in range(takes):
        ch = list(voice.synthesize(text, syn_config=SynthesisConfig(length_scale=1.0, **settings)))
        renders.append((np.frombuffer(b"".join(c.audio_int16_bytes for c in ch), dtype="<i2"), ch[0].sample_rate))
    mid = float(np.median([spoken_length(p, r) for p, r in renders]))
    pcm, rate = min(renders, key=lambda pr: abs(spoken_length(*pr) - mid))
    return to_mp3(trim_gentle(pcm, rate), rate)


def respell(voice, text, word, sounds):
    """The whole line as sounds, with the word's swapped. (A [[...]] block mid-text makes Piper read the
    punctuation after it aloud, e.g. "exclamation".)"""
    line = " ".join("".join(s) for s in voice.phonemize(text))
    was = "".join(voice.phonemize(word)[0]).lstrip("ˈˌ")
    loose = "[ˈˌ]?".join(re.escape(c) for c in was.replace("ˈ", "").replace("ˌ", ""))
    new, n = re.subn(rf"(?<![^\s])[ˈˌ]?{loose}(?=[\s?!.,]|$)", sounds, line)
    if not n:
        raise SystemExit(f"can't find {word!r} (/{was}/) in /{line}/")
    return f"[[{new}]]"


def variants(word):
    """(id, label, description, how to say the word, settings, takes)"""
    out = [("b", "B", "Steadier voice", None, STEADY, 1)]
    for i, ph in enumerate(FIXES.get(word, [])):
        c = chr(ord("c") + 2 * i)
        out += [(c, c.upper(), f"Said as /{ph}/", ph, {}, 1),
                (chr(ord(c) + 1), chr(ord(c) + 1).upper(), f"Said as /{ph}/, steadier", ph, STEADY, 1)]
    out.append((chr(ord(out[-1][0]) + 1), chr(ord(out[-1][0]) + 1).upper(), f"Best of {TAKES} takes, steadier", None, STEADY, TAKES))
    return out


def main() -> None:
    manifest = json.loads((OUT / "manifest.json").read_text())
    clips = all_clips()
    uses = defaultdict(list)
    for k in manifest:
        for w in set(k.split()):
            if not re.match(r"^\d", w):
                uses[w].append(k)

    def examples(w):
        """Up to three short lines using the word, each with different words around it."""
        picked, seen = [], set()
        for k in sorted(uses[w], key=lambda k: (len(k.split()) < 2 and len(uses[w]) > 1, len(k), k)):
            ctx = tuple(x for x in k.split() if x != w and not re.match(r"^\d", x))[:3]
            if ctx in seen and len(uses[w]) > 3:
                continue
            seen.add(ctx)
            picked.append([clips[k][0] if k in clips else k, manifest[k]])
            if len(picked) == 3:
                break
        return picked

    rows = [{"w": w, "n": len(ks), "ex": examples(w)} for w, ks in sorted(uses.items(), key=lambda i: (-len(i[1]), i[0]))]

    voice = PiperVoice.load(MODEL)
    fixes = []
    for w in FIXES:
        lines = [text for text, _ in examples(w)]
        vs = variants(w)
        (SHEET / w).mkdir(parents=True, exist_ok=True)
        for vid, _, _, ph, settings, takes in vs:
            for i, text in enumerate(lines):
                said = respell(voice, text, w, ph) if ph else text
                (SHEET / w / f"{vid}{i}.mp3").write_bytes(render(voice, said, settings, takes))
        fixes.append({"w": w, "lines": lines, "now": [f for _, f in examples(w)],
                      "vs": [{"id": v[0], "label": v[1], "desc": v[2]} for v in vs]})
        print("rendered", w, flush=True)

    data = json.dumps({"rows": rows, "fixes": fixes}, ensure_ascii=False, separators=(",", ":"))
    (ROOT / "samples" / "words.html").write_text(PAGE.replace("{data}", data.replace("</", "<\\/")))
    print(f"samples/words.html: {len(rows)} words")


PAGE = """<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cori's words</title>
<style>
@font-face { font-family: "Baloo 2"; src: url("../fonts/baloo2-latin.woff2") format("woff2"); font-weight: 400 800; }
* { box-sizing: border-box; }
body { margin: 0; padding: 16px 16px 120px; background: linear-gradient(#5fb8ec, #d4f0ff) fixed; color: #1d3557; font-family: "Baloo 2", system-ui, sans-serif; }
main { max-width: 760px; margin: 0 auto; }
h1 { margin: 0; color: #fff; text-shadow: 0 4px 0 #1d3557; font-size: 2.2rem; }
h2 { margin: 18px 0 6px; }
.lead { font-weight: 600; margin: 4px 0 12px; }
.card { background: #fff; border-radius: 16px; padding: 10px 12px; margin-bottom: 8px; }
.fix table { width: 100%; border-collapse: collapse; }
.fix td, .fix th { padding: 4px; text-align: left; vertical-align: middle; }
.fix th { font-size: 0.9rem; color: #4a6080; }
.vname b { font-size: 1.3rem; } .vname small { display: block; color: #4a6080; font-weight: 600; line-height: 1.1; }
button { font: inherit; color: inherit; cursor: pointer; }
.play { border: 0; border-radius: 10px; background: #e3f2fb; font-weight: 700; padding: 6px 10px; text-align: left; min-height: 44px; }
.play.on { background: #ffd23f; }
.play.heard { background: #eef6ee; }
.pick { border: 3px solid #d4f0ff; background: #fff; border-radius: 12px; font-weight: 800; min-width: 64px; min-height: 44px; }
.pick.on { border-color: #2a9d4b; background: #e6f6ea; }
.tools { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 8px 0; }
.tools input[type=search] { font: inherit; padding: 6px 10px; border-radius: 10px; border: 2px solid #1d3557; flex: 1 1 180px; min-height: 44px; }
.tools input[type=checkbox] { width: 22px; height: 22px; }
.tools label { font-weight: 700; min-height: 44px; display: flex; gap: 6px; align-items: center; }
.row { display: grid; grid-template-columns: 9.5rem minmax(0, 1fr) auto; gap: 8px; align-items: center; }
.row .w { font-size: 1.35rem; font-weight: 800; line-height: 1.1; overflow-wrap: anywhere; }
.row .w small { display: block; font-size: 0.8rem; font-weight: 600; color: #4a6080; }
.ex { display: flex; flex-wrap: wrap; gap: 6px; }
.ex .play b { background: #ffe9a8; border-radius: 4px; padding: 0 2px; }
.odd { border: 3px solid #f3c1d3; background: #fff; border-radius: 12px; font-weight: 800; min-height: 44px; padding: 0 12px; }
.card.marked { box-shadow: inset 0 0 0 3px #d6336c; }
.card.marked .odd { background: #d6336c; border-color: #d6336c; color: #fff; }
.card.done .w { color: #2a9d4b; }
@media (max-width: 560px) { .row { grid-template-columns: minmax(0, 1fr) auto; } .ex { grid-column: 1 / -1; } }
.bar { position: fixed; left: 0; right: 0; bottom: 0; background: #1d3557; color: #fff; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); }
.bar div { max-width: 760px; margin: 0 auto; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.bar output { flex: 1 1 260px; font-weight: 600; user-select: all; -webkit-user-select: all; }
.bar button { border: 0; border-radius: 10px; background: #ffd23f; font-weight: 800; padding: 8px 14px; min-height: 44px; color: #1d3557; }
</style></head><body><main>
<h1>Cori's words</h1>
<p class="lead">Tap a line to hear it; the word is highlighted. If the word sounds odd, tap <b>Odd</b>.
Most-used words come first, and words you've heard turn green. When you're done, tap <b>Copy</b> and paste the list to Claude.
Your marks are saved on this device.</p>
<div id="fixes"></div>
<h2>Every word</h2>
<div class="tools"><input id="find" type="search" placeholder="Find a word"><label><input id="todo" type="checkbox"> Only words I haven't heard</label></div>
<div id="rows"></div>
</main>
<div class="bar"><div><output id="out"></output><button id="copy">Copy</button></div></div>
<script>
const DATA = {data};
const store = (() => { try { return JSON.parse(localStorage.getItem("cori-words") || "{}"); } catch { return {}; } })();
store.odd ||= {}; store.heard ||= {}; store.pick ||= {};
const keep = () => { try { localStorage.setItem("cori-words", JSON.stringify(store)); } catch {} };
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const mark = (text, w) => esc(text).replace(new RegExp(`\\\\b(${w.replace(/'/g, "['’]")})\\\\b`, "gi"), "<b>$1</b>");
let audio = null;
function play(btn, src) {
  if (audio) audio.pause();
  document.querySelectorAll(".play.on").forEach((b) => b.classList.remove("on"));
  btn.classList.add("on");
  audio = new Audio(src);
  audio.onended = audio.onerror = () => btn.classList.remove("on");
  audio.play().catch(() => btn.classList.remove("on"));
}

const fixes = document.getElementById("fixes");
for (const f of DATA.fixes) {
  const card = document.createElement("div");
  card.className = "card fix";
  const head = f.lines.map((l, i) => `<th>Line ${i + 1}</th>`).join("");
  const line = (vid, files) => f.lines.map((l, i) => `<td><button class="play" data-src="${files[i]}">${mark(l, f.w)}</button></td>`).join("");
  card.innerHTML = `<h2>Fixing “${esc(f.w)}”</h2><p class="lead">Play each version, then pick the best one.</p>
    <table><tr><th></th>${head}<th></th></tr>
    <tr><td class="vname"><b>A</b><small>Now</small></td>${line("a", f.now.map((x) => "../audio/cori/" + x))}<td><button class="pick" data-v="A">Pick</button></td></tr>
    ${f.vs.map((v) => `<tr><td class="vname"><b>${v.label}</b><small>${esc(v.desc)}</small></td>${line(v.id, f.lines.map((_, i) => `words/${f.w}/${v.id}${i}.mp3`))}<td><button class="pick" data-v="${v.label}">Pick</button></td></tr>`).join("")}</table>`;
  card.querySelectorAll(".play").forEach((b) => b.onclick = () => play(b, b.dataset.src));
  card.querySelectorAll(".pick").forEach((b) => {
    b.classList.toggle("on", store.pick[f.w] === b.dataset.v);
    b.onclick = () => { store.pick[f.w] = store.pick[f.w] === b.dataset.v ? undefined : b.dataset.v; keep();
      card.querySelectorAll(".pick").forEach((x) => x.classList.toggle("on", store.pick[f.w] === x.dataset.v)); summary(); };
  });
  fixes.append(card);
}

const rows = document.getElementById("rows");
const cards = DATA.rows.map((r) => {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.w = r.w;
  card.innerHTML = `<div class="row"><div class="w">${esc(r.w)}<small>${r.n} line${r.n === 1 ? "" : "s"}</small></div>
    <div class="ex">${r.ex.map(([t, f]) => `<button class="play" data-src="../audio/cori/${f}">${mark(t, r.w)}</button>`).join("")}</div>
    <button class="odd">Odd</button></div>`;
  const paint = () => { card.classList.toggle("marked", !!store.odd[r.w]); card.classList.toggle("done", !!store.heard[r.w]); };
  card.querySelectorAll(".play").forEach((b) => b.onclick = () => { play(b, b.dataset.src); store.heard[r.w] = 1; keep(); paint(); summary(); });
  card.querySelector(".odd").onclick = () => { store.odd[r.w] = store.odd[r.w] ? undefined : 1; keep(); paint(); summary(); };
  paint();
  rows.append(card);
  return card;
});

function filter() {
  const q = document.getElementById("find").value.trim().toLowerCase(), todo = document.getElementById("todo").checked;
  for (const c of cards) c.hidden = (q && !c.dataset.w.includes(q)) || (todo && store.heard[c.dataset.w]);
}
document.getElementById("find").oninput = filter;
document.getElementById("todo").onchange = filter;

function summary() {
  const odd = Object.keys(store.odd).filter((w) => store.odd[w]);
  const picks = Object.entries(store.pick).filter(([, v]) => v).map(([w, v]) => `${w}: ${v}`);
  const heard = cards.filter((c) => store.heard[c.dataset.w]).length;
  document.getElementById("out").textContent = `Heard ${heard} of ${cards.length} words. ` +
    (picks.length ? `Picked: ${picks.join(", ")}. ` : "") + (odd.length ? `Marked as odd: ${odd.join(", ")}` : "Nothing marked yet.");
}
document.getElementById("copy").onclick = async () => {
  const text = document.getElementById("out").textContent;
  try { await navigator.clipboard.writeText(text); document.getElementById("copy").textContent = "Copied"; }
  catch { getSelection().selectAllChildren(document.getElementById("out")); }
  setTimeout(() => (document.getElementById("copy").textContent = "Copy"), 1500);
};
summary();
</script></body></html>
"""

if __name__ == "__main__":
    main()
