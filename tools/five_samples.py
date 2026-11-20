# /// script
# requires-python = ">=3.11"
# dependencies = ["piper-tts==1.8.0", "lameenc==1.9.0", "numpy"]
# ///
"""Render "5" (alone and in sentences) with different Piper settings, for choosing by ear.

Usage:  uv run tools/five_samples.py   ->  samples/five/*.mp3 + samples/five.html
"""
import html
import re
from pathlib import Path

import lameenc
import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "samples" / "five"
MODEL = Path.home() / ".cache" / "piper-voices" / "en_GB-cori-high.onnx"

# (id, label, how it differs, text for "5", length_scale, noise_scale, noise_w_scale)
VARIANTS = [
    ("a", "A: current", "What the app uses now", "5", 0.95, None, None),
    ("b", "B: word with full stop", "Written as \"five.\" so it ends like a sentence", "five.", 1.0, None, None),
    ("c", "C: steadier", "\"five.\" with less random variation", "five.", 1.0, 0.4, 0.5),
    ("d", "D: steadiest", "\"five.\" with very little variation", "five.", 1.0, 0.2, 0.3),
    ("e", "E: steady and slower", "Like C, a little slower", "five.", 1.15, 0.4, 0.5),
]
LINES = ["{five}", "Make {five}", "Count in fives. 5, 10, 15."]


def render(voice, text, ls, ns, nw):
    cfg = SynthesisConfig(length_scale=ls, noise_scale=ns, noise_w_scale=nw)
    ch = list(voice.synthesize(text, syn_config=cfg))
    rate = ch[0].sample_rate
    pcm = np.frombuffer(b"".join(c.audio_int16_bytes for c in ch), dtype="<i2")
    loud = np.flatnonzero(np.abs(pcm) > 400)
    pcm = pcm[max(0, loud[0] - int(0.02 * rate)): loud[-1] + int(0.06 * rate)]
    enc = lameenc.Encoder(); enc.set_bit_rate(40); enc.set_in_sample_rate(rate); enc.set_channels(1); enc.set_quality(2)
    return enc.encode(pcm.astype("<i2").tobytes()) + enc.flush()


def main():
    voice = PiperVoice.load(MODEL)
    OUT.mkdir(parents=True, exist_ok=True)
    cards = []
    for vid, label, desc, five, ls, ns, nw in VARIANTS:
        rows = []
        for i, line in enumerate(LINES):
            if i == 0:
                text = five
            elif i == 1:
                text = f"Make {five if five != '5' else '5'}"
            else:
                text = line
            (OUT / f"{vid}{i}.mp3").write_bytes(render(voice, text, ls, ns, nw))
            shown = ["5", "Make 5", "Count in fives. 5, 10, 15."][i]
            rows.append(f'<li><button data-f="five/{vid}{i}.mp3">{html.escape(shown)}</button></li>')
        cards.append(f'<section class="card"><h2>{html.escape(label)}</h2><p>{html.escape(desc)}</p><ol>{"".join(rows)}</ol></section>')
        print("done", vid)
    (ROOT / "samples" / "five.html").write_text(PAGE.replace("{cards}", "\n".join(cards)))


PAGE = """<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Which 5?</title>
<style>
@font-face { font-family: "Baloo 2"; src: url("../fonts/baloo2-latin.woff2") format("woff2"); font-weight: 400 800; }
body { margin: 0; padding: 20px 16px 40px; background: linear-gradient(#5fb8ec, #d4f0ff) fixed; color: #1d3557; font-family: "Baloo 2", system-ui, sans-serif; }
h1 { margin: 0; color: #fff; text-shadow: 0 4px 0 #1d3557; font-size: 2.4rem; }
.lead { font-weight: 600; max-width: 60ch; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 14px; }
.card { background: #fff; border-radius: 20px; padding: 12px 16px; box-shadow: 0 6px 0 rgba(29,53,87,.18); }
.card h2 { margin: 0; font-size: 1.4rem; } .card p { margin: 0 0 6px; color: #4a6080; font-weight: 600; }
ol { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; }
button { width: 100%; text-align: left; font: inherit; font-weight: 800; border: 0; border-radius: 12px; background: #eef7fd; padding: 8px 12px; cursor: pointer; color: inherit; }
button.playing { background: #2a9d4b; color: #fff; }
</style></head><body>
<h1>Which 5 sounds best?</h1>
<p class="lead">Tap each line to hear it. Tell Claude which letter sounds most natural, and every number will be re-recorded that way.</p>
<div class="grid">{cards}</div>
<script>
let a = null;
document.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (a) a.pause();
  document.querySelectorAll(".playing").forEach((x) => x.classList.remove("playing"));
  b.classList.add("playing");
  a = new Audio(b.dataset.f); a.onended = () => b.classList.remove("playing"); a.play();
});
</script></body></html>
"""

if __name__ == "__main__":
    main()
