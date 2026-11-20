# /// script
# requires-python = ">=3.11"
# dependencies = ["piper-tts==1.8.0", "lameenc==1.9.0"]
# ///
"""Render a few game lines in several British Piper voices so a grown-up can pick one.

Usage:  uv run tools/voice_samples.py
Voice models are read from ~/.cache/piper-voices (download from huggingface.co/rhasspy/piper-voices).
Writes samples/voices/<voice>/<n>.mp3 and samples/voices.html.
"""
import html
import json
from pathlib import Path

import lameenc
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
MODELS = Path.home() / ".cache" / "piper-voices"
OUT = ROOT / "samples" / "voices"

# Only voices whose training data allows redistribution (en_GB-alan is "All Rights Reserved", so excluded).
VOICES = [  # (id, label, description, model, speaker)
    ("cori", "Cori", "Female, southern English, highest quality model", "en_GB-cori-high", None),
    ("jenny", "Jenny (Dioco)", "Female, southern English", "en_GB-jenny_dioco-medium", None),
    ("poppy", "Poppy", "Female, cheerful and bright", "en_GB-semaine-medium", "poppy"),
    ("prudence", "Prudence", "Female, calm and steady", "en_GB-semaine-medium", "prudence"),
    ("alba", "Alba", "Female, Scottish", "en_GB-alba-medium", None),
]
CREDITS = (
    "Voices made with Piper (rhasspy/piper-voices). Cori: LibriVox recordings, public domain. "
    'Jenny voice: "Jenny (Dioco)", dioco-group/jenny-tts-dataset. '
    "Alba: CSTR, University of Edinburgh, CC BY 4.0. "
    "Poppy and Prudence: SEMAINE database (DFKI), CC BY-NC-SA 4.0, non-commercial use."
)
LINES = [
    "Pop the smallest number first!",
    "Yes! 3 tens and 4 ones make 34.",
    "Oops! Is there a smaller number?",
    "Make the clock say half past 7.",
    "Count in fives. 15, 20, 25. What comes next?",
]
SPEED = 1.1  # >1 is slower; a touch slower suits 5–7 year olds


def to_mp3(pcm: bytes, rate: int) -> bytes:
    enc = lameenc.Encoder()
    enc.set_bit_rate(48)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def main() -> None:
    loaded: dict[str, PiperVoice] = {}
    cards = []
    for vid, label, desc, model, speaker in VOICES:
        voice = loaded.get(model) or PiperVoice.load(MODELS / f"{model}.onnx")
        loaded[model] = voice
        speaker_id = voice.config.speaker_id_map.get(speaker) if speaker else None
        cfg = SynthesisConfig(speaker_id=speaker_id, length_scale=SPEED)
        (OUT / vid).mkdir(parents=True, exist_ok=True)
        for i, line in enumerate(LINES):
            chunks = list(voice.synthesize(line, syn_config=cfg))
            pcm = b"".join(c.audio_int16_bytes for c in chunks)
            (OUT / vid / f"{i}.mp3").write_bytes(to_mp3(pcm, chunks[0].sample_rate))
        cards.append((vid, label, desc))
        print("done", vid)
    (ROOT / "samples" / "voices.html").write_text(page(cards))


def page(cards: list[tuple[str, str, str]]) -> str:
    lines_js = json.dumps(LINES)
    card_html = "\n".join(
        f"""<section class="card"><h2>{html.escape(label)}</h2><p>{html.escape(desc)}</p>
      <button class="all" data-v="{vid}">Play all</button>
      <ol>{''.join(f'<li><button data-v="{vid}" data-i="{i}">{html.escape(l)}</button></li>' for i, l in enumerate(LINES))}</ol></section>"""
        for vid, label, desc in cards
    )
    return f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Number Garden voices</title>
<style>
@font-face {{ font-family: "Baloo 2"; src: url("../fonts/baloo2-latin.woff2") format("woff2"); font-weight: 400 800; }}
:root {{ --sky: #5fb8ec; --ink: #1d3557; --muted: #4a6080; --paper: #fff; --sun: #ffd23f; --sun-dark: #e0a800; --good: #2a9d4b; color-scheme: light; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: linear-gradient(#5fb8ec, #d4f0ff) fixed; color: var(--ink); font-family: "Baloo 2", system-ui, sans-serif;
  padding: 20px max(16px, env(safe-area-inset-right)) 40px max(16px, env(safe-area-inset-left)); }}
h1 {{ margin: 0 0 4px; color: var(--paper); text-shadow: 0 4px 0 var(--ink); font-size: clamp(2rem, 7vw, 3rem); }}
.lead {{ margin: 0 0 18px; font-weight: 600; max-width: 60ch; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }}
.card {{ background: var(--paper); border-radius: 22px; padding: 14px 18px; box-shadow: 0 6px 0 rgba(29,53,87,.18); }}
.card h2 {{ margin: 0; font-size: 1.7rem; }} .card p {{ margin: 0 0 8px; color: var(--muted); font-weight: 600; }}
ol {{ margin: 8px 0 0; padding-left: 1.2em; display: grid; gap: 6px; }}
button {{ font: inherit; color: inherit; cursor: pointer; border: 0; border-radius: 14px; }}
li button {{ width: 100%; text-align: left; background: #eef7fd; padding: 6px 12px; font-weight: 700; line-height: 1.25; }}
.all {{ background: var(--sun); box-shadow: 0 4px 0 var(--sun-dark); padding: 6px 18px; font-weight: 800; font-size: 1.1rem; }}
button.playing {{ background: var(--good); color: var(--paper); }}
.credits {{ margin: 22px 0 0; font-size: .85rem; font-weight: 600; color: var(--muted); max-width: 70ch; }}
</style></head><body>
<h1>Voices</h1>
<p class="lead">Tap a line to hear it. Pick the voice your child likes best; the whole game will then use it.</p>
<div class="grid">
{card_html}
</div>
<p class="credits">{html.escape(CREDITS)}</p>
<script>
const LINES = {lines_js};
let audio = null, queue = [];
function play(v, i, btn) {{
  return new Promise((done) => {{
    if (audio) audio.pause();
    document.querySelectorAll(".playing").forEach((b) => b.classList.remove("playing"));
    btn?.classList.add("playing");
    audio = new Audio(`voices/${{v}}/${{i}}.mp3`);
    audio.onended = audio.onerror = () => {{ btn?.classList.remove("playing"); done(); }};
    audio.play().catch(done);
  }});
}}
document.addEventListener("click", async (e) => {{
  const b = e.target.closest("button"); if (!b) return;
  const v = b.dataset.v;
  if (b.classList.contains("all")) {{
    const token = Symbol(); queue = token;
    for (let i = 0; i < LINES.length && queue === token; i++) await play(v, i, b.closest(".card").querySelector(`[data-i="${{i}}"]`));
  }} else {{ queue = null; play(v, +b.dataset.i, b); }}
}});
</script>
</body></html>
"""


if __name__ == "__main__":
    main()
