# /// script
# requires-python = ">=3.11"
# dependencies = ["piper-tts==1.8.0", "lameenc==1.9.0", "numpy"]
# ///
"""Render every number 0–100 in several Piper settings, for choosing by ear.

Usage:  uv run tools/number_samples.py   ->  samples/numbers/<variant>/<n>.mp3 + samples/numbers.html
"""
from pathlib import Path

import lameenc
import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "samples" / "numbers"
MODEL = Path.home() / ".cache" / "piper-voices" / "en_GB-cori-high.onnx"

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def words(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n == 100:
        return "one hundred"
    t, o = divmod(n, 10)
    return TENS[t] + (f"-{ONES[o]}" if o else "")


# (id, label, description, as_words, length_scale, noise_scale, noise_w_scale)
VARIANTS = [
    ("a", "A", "What the app uses now (digits)", False, 0.95, None, None),
    ("b", "B", "Words with a full stop", True, 1.0, None, None),
    ("c", "C", "Words, steadier", True, 1.0, 0.4, 0.5),
    ("d", "D", "Words, steadiest", True, 1.0, 0.2, 0.3),
]


def render(voice, text, ls, ns, nw):
    ch = list(voice.synthesize(text, syn_config=SynthesisConfig(length_scale=ls, noise_scale=ns, noise_w_scale=nw)))
    rate = ch[0].sample_rate
    pcm = np.frombuffer(b"".join(c.audio_int16_bytes for c in ch), dtype="<i2")
    loud = np.flatnonzero(np.abs(pcm) > 400)
    pcm = pcm[max(0, loud[0] - int(0.02 * rate)): loud[-1] + int(0.06 * rate)]
    enc = lameenc.Encoder(); enc.set_bit_rate(40); enc.set_in_sample_rate(rate); enc.set_channels(1); enc.set_quality(2)
    return enc.encode(pcm.astype("<i2").tobytes()) + enc.flush()


def main():
    voice = PiperVoice.load(MODEL)
    for vid, _, _, as_words, ls, ns, nw in VARIANTS:
        (OUT / vid).mkdir(parents=True, exist_ok=True)
        for n in range(101):
            text = f"{words(n)}." if as_words else str(n)
            (OUT / vid / f"{n}.mp3").write_bytes(render(voice, text, ls, ns, nw))
        print("done", vid, flush=True)
    tabs = "".join(f'<button class="tab{" on" if i == 0 else ""}" data-v="{v[0]}"><b>{v[1]}</b><small>{v[2]}</small></button>' for i, v in enumerate(VARIANTS))
    (ROOT / "samples" / "numbers.html").write_text(PAGE.replace("{tabs}", tabs))


PAGE = """<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Numbers 0–100</title>
<style>
@font-face { font-family: "Baloo 2"; src: url("../fonts/baloo2-latin.woff2") format("woff2"); font-weight: 400 800; }
body { margin: 0; padding: 16px 16px 40px; background: linear-gradient(#5fb8ec, #d4f0ff) fixed; color: #1d3557; font-family: "Baloo 2", system-ui, sans-serif; }
h1 { margin: 0; color: #fff; text-shadow: 0 4px 0 #1d3557; font-size: 2.2rem; }
.lead { font-weight: 600; max-width: 62ch; margin: 4px 0 12px; }
.tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 12px; }
.tab { border: 3px solid #d4f0ff; background: #fff; border-radius: 16px; padding: 6px 10px; text-align: left; font: inherit; color: inherit; cursor: pointer; display: grid; }
.tab b { font-size: 1.4rem; line-height: 1; } .tab small { font-weight: 600; color: #4a6080; }
.tab.on { border-color: #2a9d4b; background: #e6f6ea; }
.grid { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; background: #1d3557; padding: 4px; border-radius: 12px; max-width: 640px; }
.n { border: 0; border-radius: 6px; background: #fff; font: inherit; font-weight: 800; font-size: clamp(0.9rem, 3.6vw, 1.3rem); padding: 8px 0; cursor: pointer; color: inherit; }
.n.zero { grid-column: 1 / -1; }
.n.playing { background: #ffd23f; }
.n.flag { box-shadow: inset 0 0 0 3px #d6336c; }
.tip { font-weight: 600; color: #4a6080; margin-top: 10px; }
</style></head><body>
<h1>Numbers 0–100</h1>
<p class="lead">Choose a version, then tap numbers to hear them. Long-press (or right-click) a number to mark one that sounds odd.
Tell Claude which version is best, and any marked numbers.</p>
<div class="tabs">{tabs}</div>
<div class="grid" id="grid"></div>
<p class="tip" id="flags"></p>
<script>
let v = "a", audio = null;
const grid = document.getElementById("grid"), flags = new Set();
grid.innerHTML = Array.from({ length: 101 }, (_, n) => `<button class="n${n === 0 ? " zero" : ""}" data-n="${n}">${n}</button>`).join("");
document.querySelectorAll(".tab").forEach((t) => t.onclick = () => {
  v = t.dataset.v; document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === t));
});
function play(b) {
  if (audio) audio.pause();
  document.querySelectorAll(".playing").forEach((x) => x.classList.remove("playing"));
  b.classList.add("playing");
  audio = new Audio(`numbers/${v}/${b.dataset.n}.mp3`);
  audio.onended = () => b.classList.remove("playing");
  audio.play();
}
function flag(b) {
  const k = `${v.toUpperCase()}: ${b.dataset.n}`;
  if (flags.has(k)) flags.delete(k); else flags.add(k);
  b.classList.toggle("flag");
  document.getElementById("flags").textContent = flags.size ? "Marked as odd: " + [...flags].join(", ") : "";
}
let timer = 0, longPressed = false;
grid.addEventListener("pointerdown", (e) => { const b = e.target.closest(".n"); if (!b) return; longPressed = false; timer = setTimeout(() => { longPressed = true; flag(b); }, 600); });
grid.addEventListener("pointerup", () => clearTimeout(timer));
grid.addEventListener("contextmenu", (e) => { const b = e.target.closest(".n"); if (b) { e.preventDefault(); clearTimeout(timer); if (!longPressed) flag(b); longPressed = true; } });
grid.addEventListener("click", (e) => { const b = e.target.closest(".n"); if (!b) return; if (longPressed) { longPressed = false; return; } play(b); });
</script></body></html>
"""

if __name__ == "__main__":
    main()
