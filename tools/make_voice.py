# /// script
# requires-python = ">=3.11"
# dependencies = ["piper-tts==1.8.0", "lameenc==1.9.0", "numpy"]
# ///
"""Record the game's spoken lines as short clips in the Poppy voice.

Usage:  uv run tools/make_voice.py
Needs ~/.cache/piper-voices/en_GB-semaine-medium.onnx(.json) from huggingface.co/rhasspy/piper-voices.
Writes audio/poppy/*.mp3 and audio/poppy/manifest.json ({clip key: file}).

At runtime js/core.js splits a sentence into clip keys: runs of words are matched longest-first
against the phrase keys below; numbers are "#34", pence "#34p", step counts "#5s". Anything without
a clip falls back to the device voice, so add phrases here when the games learn new lines.

Voice: "Poppy" from the SEMAINE database (DFKI), CC BY-NC-SA 4.0 — non-commercial use, credit required.
"""
import json
import re
import shutil
from pathlib import Path

import lameenc
import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "poppy"
MODEL = Path.home() / ".cache" / "piper-voices" / "en_GB-semaine-medium.onnx"
SPEAKER = "poppy"
# Piper length_scale (>1 is slower). Numbers and short fragments are joined into sentences,
# so they're a little quicker than whole sentences or the result drags.
SPEED_SENTENCE = 1.05
SPEED_FRAGMENT = 0.95


def speed_for(key: str) -> float:
    return SPEED_FRAGMENT if key.startswith("#") or len(key.split()) <= 3 else SPEED_SENTENCE

PHRASES = [
    # shared
    "Yes!", "Oops!", "Perfect!", "Well done!", "Level up!", "Brilliant!", "Hello!", "Not quite.",
    "You need more.", "Too many!", "Take some away.", "That's", "and", "make", "is", "more", "less",
    "up to", "add to", "add", "take away", "count in", "count on", "Thank you!",
    # balloon pop
    "Pop the smallest number first!", "Pop the biggest number first!",
    "Is there a smaller number?", "Is there a bigger number?",
    # sticks & blocks
    "What number is this?", "Count the tens, then the ones.", "Count the sticks first.", "Each stick is ten.",
    "tens and", "ten and", "ones make", "one make", "ones is", "one is",
    "Ten ones make one ten!", "Ten blocks!", "Swap them for a stick.",
    # ten frame
    "Put in", "counters", "How many counters?", "Count again.", "A full row is five.",
    "How many more to make ten?", "Count the empty spaces.", "make ten",
    # bead rack
    "Slide", "beads across to the left", "How many beads on the left?", "Each full row is ten.",
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
]
STEPS = {"2s": "twos", "5s": "fives", "10s": "tens"}


def key_for(text: str) -> str:
    """Must match the word-run keys produced by toClips() in js/core.js."""
    return " ".join(re.findall(r"[a-z']+", text.lower().replace("’", "'")))


def slug(key: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", key.replace("#", "n").replace("'", "")).strip("-")


def trim(pcm: np.ndarray, rate: int) -> np.ndarray:
    """Cut leading/trailing silence so clips join without long gaps."""
    loud = np.flatnonzero(np.abs(pcm) > 400)
    if not len(loud):
        return pcm
    start = max(0, loud[0] - int(0.02 * rate))
    end = min(len(pcm), loud[-1] + int(0.05 * rate))
    return pcm[start:end]


def to_mp3(pcm: np.ndarray, rate: int) -> bytes:
    enc = lameenc.Encoder()
    enc.set_bit_rate(48)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm.astype("<i2").tobytes()) + enc.flush()


def main() -> None:
    voice = PiperVoice.load(MODEL)
    speaker = voice.config.speaker_id_map[SPEAKER]

    clips: dict[str, str] = {}  # key -> text to render
    for p in PHRASES:
        clips.setdefault(key_for(p), p)
    for n in range(0, 101):
        clips[f"#{n}"] = str(n)
    for n in range(1, 101):
        clips[f"#{n}p"] = f"{n}p"
    for k, words in STEPS.items():
        clips[f"#{k}"] = words

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    manifest: dict[str, str] = {}
    total = 0
    for key, text in clips.items():
        cfg = SynthesisConfig(speaker_id=speaker, length_scale=speed_for(key))
        chunks = list(voice.synthesize(text, syn_config=cfg))
        rate = chunks[0].sample_rate
        pcm = trim(np.frombuffer(b"".join(c.audio_int16_bytes for c in chunks), dtype="<i2"), rate)
        data = to_mp3(pcm, rate)
        name = slug(key) + ".mp3"
        (OUT / name).write_bytes(data)
        manifest[key] = name
        total += len(data)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=0, sort_keys=True))
    print(f"{len(manifest)} clips, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
