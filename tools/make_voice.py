# /// script
# requires-python = ">=3.11"
# dependencies = ["piper-tts==1.8.0", "lameenc==1.9.0", "numpy"]
# ///
"""Record everything the games say, in the Cori voice.

Usage:  uv run tools/make_voice.py
Needs ~/.cache/piper-voices/en_GB-cori-high.onnx(.json) from huggingface.co/rhasspy/piper-voices.
Writes audio/cori/*.mp3 and audio/cori/manifest.json ({clip key: file}).

Two kinds of clip:
  * whole sentences — every sentence the games can produce, enumerated below to mirror the templates
    in js/games/*.js, so lines are spoken with natural rhythm;
  * fragments — phrases, numbers 0–100, pence and "twos/fives/tens", used only to piece together a
    sentence that has no whole clip (a safety net; the device voice is the last resort).

At runtime js/core.js splits a line into sentences on . ! ? and looks each up by key(); see toClips().
When a game gets a new or changed spoken line, add it to sentences() (or PHRASES) and re-run.

Voice: Piper "en_GB-cori-high", trained on public-domain LibriVox recordings.
(Poppy from en_GB-semaine-medium was tried first and sounded too excitable.)
"""
import hashlib
import itertools
import json
import re
import shutil
import sys
from pathlib import Path

import lameenc
import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "cori"
MODEL = Path.home() / ".cache" / "piper-voices" / "en_GB-cori-high.onnx"
SPEED_SENTENCE = 1.0  # Piper length_scale; >1 is slower
SPEED_FRAGMENT = 0.95
BITRATE = 40  # kbps, mono speech

PHRASES = [
    # shared
    "Yes!", "Oops!", "Perfect!", "Well done!", "Level up!", "Brilliant!", "Hello!", "Not quite.",
    "You need more.", "Too many!", "Take some away.", "That's", "and", "make", "is", "more", "less",
    "up to", "add to", "add", "take away", "count in", "count on", "Thank you!",
    # praise for a right answer (PRAISE in js/core.js)
    "Great job!", "That's right!", "Fantastic!", "Spot on!",
    # balloon pop
    "Pop the smallest number first!", "Pop the biggest number first!",
    "Is there a smaller number?", "Is there a bigger number?",
    # sticks & blocks
    "What number is this?", "Count the tens, then the ones.", "Count the sticks first.", "Each stick is ten.",
    "tens and", "ten and", "ones", "one", "tens", "ten",
    "Ten ones make one ten!", "Ten blocks!", "Swap them for a stick.",
    # ten frame
    "Put in", "counters", "counter", "How many counters?", "Count again.", "A full row is five.",
    "How many more to make ten?", "Count the empty spaces.", "make ten",
    # bead rack
    "Slide", "beads across to the left", "bead across to the left", "How many beads on the left?", "Each full row is ten.",
    # frog hops
    "Tap where the frog lands.", "Hop to the answer!", "Too many hops!", "Count them again.", "Count the hops.",
    # hundred square
    "What comes next?", "What is one more than", "What is one less than", "Find it on the square.",
    "One more than", "One less than", "Find", "Then look at the number after it.", "Then look at the number before it.",
    # coin shop
    "The apple costs", "The lolly costs", "The ball costs", "The toy car costs", "Put", "in the purse.",
    "How much money is in the purse?", "Count the biggest coin first, then count on.",
    "Not enough money yet.", "Too much!", "Take a coin back.",
    # clock
    "What time is it?", "Look at the short hand.", "Look at the long hand first.", "Look at the long hand.",
    "It's", "o'clock", "half past", "quarter past", "quarter to", "Make the clock say", "quarter past and to",
    # fair shares
    "Which one is cut in half?", "Which one is cut into quarters?", "Those parts are not equal.",
    "Halves are 2 equal parts.", "Quarters are 4 equal parts.", "2 equal parts make halves.", "4 equal parts make quarters.",
    "Colour half.", "Colour a quarter.", "That's half.", "That's a quarter.", "Colour some more.", "Tap one to take it off.",
    # party bags
    "Tap a sweet to share it.", "Tap a bag to add a sweet.", "How many sweets in each bag?",
    "Count the sweets in one bag.", "How many sweets altogether?",
    # balance scales
    "Which is heavier?", "Which is lighter?", "Tap it.", "Look at the scale.", "The heavier side goes down.",
    "The lighter side goes up.", "Make it balance!", "What goes in the empty space?", "Too heavy!",
    "Try a smaller number.", "Not heavy enough!", "Try a bigger number.",
    # shape hunt
    "Look again.", "Count the sides.",
]
STEPS = {"2s": "twos", "5s": "fives", "10s": "tens"}


def plural(n: int, one: str, many: str) -> str:
    return f"{n} {one if n == 1 else many}"


def time_label(h: int, m: int) -> str:
    return {0: f"{h} o'clock", 30: f"half past {h}", 15: f"quarter past {h}"}.get(m, f"quarter to {h % 12 + 1}")


def sentences() -> list[str]:
    """Every numbered sentence the games can say (mirrors js/games/*.js)."""
    s: list[str] = []
    # level-up labels (core.js win(): "Level up! <label>.")
    s += [f"Up to {n}." for n in (10, 20, 50, 99, 100)] + [f"Up to {n}p." for n in (10, 20, 50)]
    s += ["Add to 10.", "Add to 20.", "Take away.", "Count in 10s.", "Count in 5s.", "Count in 2s.",
          "1 more, 1 less.", "O'clock.", "Half past.", "Quarter past and to."]
    # sticks & blocks: "Make N" and "N is T tens and O ones" (blocksLine in blocks.js)
    for n in range(1, 100):
        t, o = divmod(n, 10)
        s.append(f"Make {n}.")
        parts = [plural(t, "ten", "tens")] if t else []
        parts += [plural(o, "one", "ones")] if o else []
        s.append(f"{n} is {' and '.join(parts)}.")
    # ten frame
    for n in range(1, 21):
        s += [f"Put in {plural(n, 'counter', 'counters')}.", f"That's {n}."]
    s += [f"{n} and {10 - n} make ten." for n in range(1, 10)]
    # bead rack
    s += [f"Slide {plural(n, 'bead', 'beads')} across to the left." for n in range(1, 101)]
    s += [f"Ten and {k} make {10 + k}." for k in range(1, 10)]
    # frog hops
    combos = set()
    for b in range(1, 7):
        combos |= {("+", a, b) for a in range(0, 10 - b + 1)}
    for b in range(1, 10):
        combos |= {("+", a, b) for a in range(4, 20 - b + 1)}
    for a in range(6, 21):
        combos |= {("-", a, b) for b in range(1, min(9, a) + 1)}
    for op, a, b in sorted(combos):
        word, ans = ("add", a + b) if op == "+" else ("take away", a - b)
        s += [f"{a} {word} {b}.", f"{a} {word} {b} is {ans}."]
    # hundred square
    for step in (10, 5, 2):
        s.append(f"Count on {step} more.")
        for k0 in range(1, 100 // step - 5 + 1):
            seq = [(k0 + j) * step for j in range(6)]
            s.append(", ".join(map(str, seq[:3])) + ".")
            s.append(", ".join(map(str, seq)) + ".")
    for r in range(1, 101):
        s.append(f"Find {r}.")
        if r <= 99:
            s += [f"What is one more than {r}?", f"One more than {r} is {r + 1}."]
        if r >= 2:
            s += [f"What is one less than {r}?", f"One less than {r} is {r - 1}."]
    # coin shop
    for price in range(3, 51):
        s += [f"The {item} costs {price}p." for item in ("apple", "lolly", "ball", "toy car")]
        s += [f"Put {price}p in the purse.", f"That's {price}p."]
    for coins_, top in (([1, 2, 5], 10), ([1, 2, 5, 10], 20), ([1, 2, 5, 10, 20], 50)):
        for size in (2, 3, 4):
            for combo in itertools.combinations_with_replacement(sorted(coins_, reverse=True), size):
                total = sum(combo)
                if 3 <= total <= top:
                    names = [f"{c}p" for c in combo]
                    s.append(f"{', '.join(names[:-1])} and {names[-1]} make {total}p.")
    # clock
    for h in range(1, 13):
        for m in (0, 15, 30, 45):
            label = time_label(h, m)
            s += [f"It's {label}.", f"Make the clock say {label}."]
    # level-up labels for the newer games
    s += ["Halves.", "Quarters.", "Halves & quarters.", "Share.", "Fill the bags.", "Count in 2s, 5s, 10s.",
          "Heavier, lighter.", "Balance to 10.", "Balance to 20.", "Find the shape.", "More shapes.", "Sides & corners."]
    # party bags (bags.js)
    for b in (2, 3):
        for k in range(2, 6):
            s += [f"Share {b * k} sweets into {b} bags.", f"{b * k} shared into {b} bags is {k} each."]
    for k in range(2, 6):
        s += [f"Put {k} sweets in each bag.", f"Check every bag has {k}."]
    groups = {(b, k) for b in range(2, 5) for k in range(2, 6)} | {(b, k) for b in range(2, 6) for k in (2, 5, 10)}
    s += [f"{b} bags of {k} is {b * k}." for b, k in sorted(groups)]
    # balance scales (balance.js)
    for obj in ("feather", "apple", "book", "pumpkin", "watermelon"):
        s += [f"The {obj} is heavier.", f"The {obj} is lighter."]
    s += [f"Both sides make {n}." for n in range(2, 21)]
    # shape hunt (shapes.js)
    shapes_ = {"circle": "circles", "triangle": "triangles", "square": "squares", "rectangle": "rectangles",
               "pentagon": "pentagons", "hexagon": "hexagons"}
    for one, many in shapes_.items():
        s += [f"Tap all the {many}.", f"That's a {one}.", f"Find a {one}.", f"It's a {one}."]
        s += [f"That's all {n} {many}." for n in range(2, 5)]
    for one, sides in (("triangle", 3), ("square", 4), ("rectangle", 4), ("pentagon", 5), ("hexagon", 6)):
        for what in ("sides", "corners"):
            s += [f"How many {what} does a {one} have?", f"A {one} has {sides} {what}."]
    s += ["I am round and I have no corners.", "What am I?", "I have 3 sides and 3 corners.",
          "I have 4 sides that are all the same length.", "I have 4 sides.", "2 are long and 2 are short.",
          "I have 5 sides and 5 corners.", "I have 6 sides and 6 corners."]
    return s


def key(text: str) -> str:
    """Clip key; must match clipKey() in js/core.js."""
    return " ".join(re.findall(r"\d+[ps]?|[a-z']+", text.lower().replace("’", "'").replace("&", " and ")))


def filename(k: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", k.replace("'", "")).strip("-")[:48]
    return f"{slug}-{hashlib.sha1(k.encode()).hexdigest()[:6]}.mp3"


def trim(pcm: np.ndarray, rate: int) -> np.ndarray:
    """Cut leading/trailing silence so clips join without long gaps."""
    loud = np.flatnonzero(np.abs(pcm) > 400)
    if not len(loud):
        return pcm
    return pcm[max(0, loud[0] - int(0.02 * rate)): min(len(pcm), loud[-1] + int(0.06 * rate))]


def to_mp3(pcm: np.ndarray, rate: int) -> bytes:
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm.astype("<i2").tobytes()) + enc.flush()


def main() -> None:
    clips: dict[str, tuple[str, float]] = {}  # key -> (text to render, speed)
    for p in PHRASES:
        clips.setdefault(key(p), (p, SPEED_FRAGMENT))
    for n in range(0, 101):
        clips[str(n)] = (str(n), SPEED_FRAGMENT)
    for n in range(1, 101):
        clips[f"{n}p"] = (f"{n}p", SPEED_FRAGMENT)
    for k, words in STEPS.items():
        clips[k] = (words, SPEED_FRAGMENT)
    for text in sentences():
        clips[key(text)] = (text, SPEED_SENTENCE)  # whole sentences win over same-key fragments

    if "--count" in sys.argv:
        print(len(clips), "clips")
        return
    voice = PiperVoice.load(MODEL)
    if "--fresh" in sys.argv and OUT.exists():
        shutil.rmtree(OUT)  # re-record everything (e.g. after changing voice or speed)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    total = 0
    for i, (k, (text, speed)) in enumerate(clips.items()):
        name = filename(k)
        if (OUT / name).exists():  # resumable: keep clips already recorded
            manifest[k] = name
            total += (OUT / name).stat().st_size
            continue
        spoken = re.sub(r"\b(2|5|10)s\b", lambda m: STEPS[m.group(0)], text)  # "Count in 5s" -> "fives"
        chunks = list(voice.synthesize(spoken, syn_config=SynthesisConfig(length_scale=speed)))
        rate = chunks[0].sample_rate
        pcm = trim(np.frombuffer(b"".join(c.audio_int16_bytes for c in chunks), dtype="<i2"), rate)
        data = to_mp3(pcm, rate)
        (OUT / name).write_bytes(data)
        manifest[k] = name
        total += len(data)
        if i % 200 == 0:
            print(f"{i}/{len(clips)}", flush=True)
    keep = set(manifest.values()) | {"manifest.json"}
    for f in OUT.iterdir():  # drop clips for lines that no longer exist
        if f.name not in keep:
            f.unlink()
    (OUT / "manifest.json").write_text(json.dumps(manifest, separators=(",", ":"), sort_keys=True))
    print(f"{len(manifest)} clips, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
