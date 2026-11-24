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
import shutil
from collections import defaultdict

import numpy as np
from make_voice import MODEL, OUT, ROOT, all_clips, spoken_length, to_mp3, trim_gentle
from piper import PiperVoice, SynthesisConfig

SHEET = ROOT / "samples" / "words"

# Words Tom marked as odd, with other ways of saying them (espeak phonemes; Piper reads [[...]] as sounds).
# TIDY means: keep the word, but clean up the line's sounds (see tidy()).
TIDY = "tidy"
DECIDED = {"many": "mˈɛnɪ"}  # picked on the sheet; shown no more
FIXES = {
    "the": [TIDY], "away": ["əwˈeɪ"], "in": [TIDY], "across": ["əkɹˈɒs"], "a": ["ə"],
    "ones": ["wˈʌnz", "wˈɒnz"], "tens": [], "apple": [TIDY], "past": ["pˈɑːst"], "altogether": [TIDY],
    "biscuit": ["bˈɪskət", "bˈɪs kɪt"], "go": ["ɡˈəʊ"], "full": [], "rule": [], "row": [], "sunday": ["sˈʌndi"],
    "ladybird": ["lˈeɪdibɜːd"], "five": [], "hexagon": ["hˈɛksəɡən"], "pentagon": ["pˈɛntəɡən"],
    "rectangle": ["ɹˈɛktˌaŋɡəl"], "triangle": [TIDY], "august": ["ˈɔːɡʌst"], "four": [], "place": [],
    "triangles": [TIDY], "use": ["jˈuːz"], "hexagons": ["hˈɛksəɡənz"], "pentagons": ["pˈɛntəɡənz"],
    "basket": ["bˈɑːskɪt", "bˈas kɪt", "bˈɑːs kɪt"], "get": ["ɡˈɛt"], "off": [], "pour": [], "bedtime": ["bˈɛd tˌaɪm"], "eat": ["ʔˈiːt"],
    "oops": ["ˈʊps", "wˈʊps"], "pictogram": ["pˈɪktəʊɡɹˌam", "pˈɪk tə ɡɹˌam"], "prices": [], "shapes": ["ʃˈeɪps"], "yes": [],
}
# How espeak says a word inside a line, where that differs from the word on its own.
WAS = {"a": "ɐ"}
# Lines that show the problem best, where the shortest ones wouldn't.
SHOW = {
    "the": ["in the purse", "the apple costs", "the podium"],
    "in": ["in the purse", "put in", "count in"],
}
STEADY = {"noise_scale": 0.4, "noise_w_scale": 0.5}
TAKES = 5


def render(voice, text, settings, takes=1, speed=1.0):
    renders = []
    for _ in range(takes):
        ch = list(voice.synthesize(text, syn_config=SynthesisConfig(length_scale=speed, **settings)))
        renders.append((np.frombuffer(b"".join(c.audio_int16_bytes for c in ch), dtype="<i2"), ch[0].sample_rate))
    mid = float(np.median([spoken_length(p, r) for p, r in renders]))
    pcm, rate = min(renders, key=lambda pr: abs(spoken_length(*pr) - mid))
    return to_mp3(trim_gentle(pcm, rate), rate)


def sounds(voice, text):
    return " ".join("".join(s) for s in voice.phonemize(text))


def tidy(line):
    """espeak adds a glide (ʲ) between vowels ("the‿apple", "tri‿angle") and runs "in the" into one word."""
    line = re.sub(r"ðɪʲ", "ði ", line)
    line = re.sub(r"ɪnð([əi])", r"ɪn ð\1", line)
    return re.sub(r"\s+", " ", line.replace("ʲ", "")).strip()


def respell(voice, text, word, ph):
    """The whole line as sounds, with the word's swapped (or the line tidied). (A [[...]] block mid-text
    makes Piper read the punctuation after it aloud, e.g. "exclamation".)"""
    line = sounds(voice, text)
    if ph == TIDY:
        return f"[[{tidy(line)}]]"
    was = WAS.get(word) or "".join(voice.phonemize(word)[0]).lstrip("ˈˌ")
    loose = "[ˈˌ]?".join(re.escape(c) for c in was.replace("ˈ", "").replace("ˌ", ""))
    new, n = re.subn(rf"(?<![^\s])[ˈˌ]?{loose}(?=[\s?!.,]|$)", ph, line)
    if not n:
        raise SystemExit(f"can't find {word!r} (/{was}/) in /{line}/")
    return f"[[{new}]]"


def variants(word):
    """(id, description, how to say the word, settings, takes, speed)"""
    out = [("Steadier voice, best of 5 takes", None, STEADY, TAKES, 1.0),
           ("Slower and steadier", None, STEADY, TAKES, 1.12)]
    for ph in FIXES.get(word, []):
        out.append(("Sounds tidied" if ph == TIDY else f"Said as /{ph}/", ph, {}, 1, 1.0))
        out.append(("Sounds tidied, steadier" if ph == TIDY else f"Said as /{ph}/, steadier", ph, STEADY, TAKES, 1.0))
    return [(chr(ord("b") + i), *v) for i, v in enumerate(out)]


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
    if SHEET.exists():
        shutil.rmtree(SHEET)  # only this script's candidate clips live here
    for w in FIXES:
        shown = [[clips[k][0], manifest[k]] for k in SHOW[w]] if w in SHOW else examples(w)
        lines = [text for text, _ in shown]
        vs = variants(w)
        (SHEET / w).mkdir(parents=True)
        for vid, _, ph, settings, takes, speed in vs:
            for i, text in enumerate(lines):
                said = respell(voice, text, w, ph) if ph else text
                (SHEET / w / f"{vid}{i}.mp3").write_bytes(render(voice, said, settings, takes, speed))
        fixes.append({"w": w, "lines": lines, "now": [f for _, f in shown],
                      "vs": [{"id": v[0], "label": v[0].upper(), "desc": v[1]} for v in vs]})
        print("rendered", w, flush=True)

    data = json.dumps({"rows": rows, "fixes": fixes, "decided": list(DECIDED)}, ensure_ascii=False, separators=(",", ":"))
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
.play b { background: #ffe9a8; border-radius: 4px; padding: 0 2px; }
.odd { border: 3px solid #f3c1d3; background: #fff; border-radius: 12px; font-weight: 800; min-height: 44px; padding: 0 12px; }
.card.marked { box-shadow: inset 0 0 0 3px #d6336c; }
.card.marked .odd { background: #d6336c; border-color: #d6336c; color: #fff; }
.card.done .w { color: #2a9d4b; }
.vname small, .fix .play { overflow-wrap: anywhere; }
@media (max-width: 560px) {
  .fix table, .fix tbody, .fix tr { display: block; }
  .fix tr { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 0; border-top: 2px solid #e3f2fb; }
  .fix th, .fix td:empty, .fix tr:first-child { display: none; }
  .fix td { padding: 0; flex: 1 1 auto; min-width: 0; }
  .fix td.vname { flex: 1 1 60%; order: 0; }
  .fix td:last-child { flex: 0 0 auto; order: 1; }
  .fix td:not(.vname):not(:last-child) { order: 2; }
  .fix .play { width: 100%; }
}
@media (max-width: 560px) { .row { grid-template-columns: minmax(0, 1fr) auto; } .ex { grid-column: 1 / -1; } }
details summary { cursor: pointer; margin: 18px 0 6px; }
.bar { position: fixed; left: 0; right: 0; bottom: 0; background: #1d3557; color: #fff; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); }
.bar div { max-width: 760px; margin: 0 auto; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.bar output { flex: 1 1 260px; font-weight: 600; user-select: all; -webkit-user-select: all; }
.bar button { border: 0; border-radius: 10px; background: #ffd23f; font-weight: 800; padding: 8px 14px; min-height: 44px; color: #1d3557; }
</style></head><body><main>
<h1>Cori's words</h1>
<p class="lead">For each word you marked as odd, play the versions and tap <b>Pick</b> on the best one,
or <b>None</b> if they all sound wrong. <b>A</b> is how it sounds now. When you're done, tap <b>Copy</b> and paste the line to Claude.
Your picks are saved on this device.</p>
<div id="fixes"></div>
<details><summary><h2 style="display:inline">Every word</h2></summary>
<div class="tools"><input id="find" type="search" placeholder="Find a word"><label><input id="todo" type="checkbox"> Only words I haven't heard</label></div>
<div id="rows"></div>
</details>
</main>
<div class="bar"><div><output id="out"></output><button id="copy">Copy</button></div></div>
<script>
const DATA = {data};
const FIXED = new Set(DATA.fixes.map((f) => f.w));
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
  card.innerHTML = `<h2>“${esc(f.w)}”</h2>
    <table><tr><th></th>${head}<th></th></tr>
    <tr><td class="vname"><b>A</b><small>Now</small></td>${line("a", f.now.map((x) => "../audio/cori/" + x))}<td><button class="pick" data-v="A">Pick</button></td></tr>
    ${f.vs.map((v) => `<tr><td class="vname"><b>${v.label}</b><small>${esc(v.desc)}</small></td>${line(v.id, f.lines.map((_, i) => `words/${f.w}/${v.id}${i}.mp3`))}<td><button class="pick" data-v="${v.label}">Pick</button></td></tr>`).join("")}
    <tr><td></td><td colspan="${f.lines.length}"></td><td><button class="pick" data-v="none">None</button></td></tr></table>`;
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
  const picks = Object.entries(store.pick).filter(([w, v]) => v && FIXED.has(w)).map(([w, v]) => `${w}: ${v}`);
  const newOdd = odd.filter((w) => !FIXED.has(w) && !DATA.decided.includes(w));
  document.getElementById("out").textContent = `Picked ${picks.length} of ${FIXED.size}: ${picks.join(", ") || "none yet"}.` +
    (newOdd.length ? ` Also odd: ${newOdd.join(", ")}` : "");
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
