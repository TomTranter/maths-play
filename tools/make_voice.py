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
import subprocess
import sys
from pathlib import Path

import os

import lameenc
import numpy as np
import onnxruntime
from piper import PiperVoice, SynthesisConfig

from voice_index import write_index

# Be kind to the computer: Piper's engine otherwise grabs every CPU core (and ignores taskset).
# Set VOICE_THREADS to change it.
_SessionOptions = onnxruntime.SessionOptions


def _limited_session_options():
    opts = _SessionOptions()
    opts.intra_op_num_threads = int(os.environ.get("VOICE_THREADS", "4"))
    opts.inter_op_num_threads = 1
    return opts


onnxruntime.SessionOptions = _limited_session_options

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
    # level labels for the third batch of games
    s += ["Straight ahead.", "Left and right turns.", "Round the rocks.", "Longer, shorter.", "Measure with cubes.",
          "Use a ruler.", "Copy the spots.", "Doubles and halves.", "Odd or even.", "Tally chart.", "Pictogram.",
          "Compare.", "Colour patterns.", "Shape patterns.", "Number patterns.", "Full, half full, empty.",
          "Fill it up.", "Which holds more?"]
    # robot route (robot.js)
    s += ["Help the robot get to the star.", "Tap forward, then press Go.", "Use forward and turns, then press Go.",
          "Get to the star.", "Go round the rocks with quarter turns.", "Add some steps first.",
          "Oops! The robot hit a rock.", "Oops! The robot hit a wall.", "Try again.", "Not there yet.",
          "The robot found the star."]
    # measure it (measure.js)
    for word in ("longer", "shorter"):
        s.append(f"Which snake is {word}?")
        s += [f"The {c} snake is {word}." for c in ("red", "blue", "green", "yellow", "purple")]
    for word in ("longest", "shortest"):
        s.append(f"Which snake is the {word}?")
        s += [f"The {c} snake is the {word}." for c in ("red", "blue", "green", "yellow", "purple")]
    s += ["Look at where each snake ends.", "Count the cubes.", "Count the cubes again.", "Use the ruler.",
          "It doesn't start at 0.", "Count the centimetres from where it starts.", "Look where it starts and where it ends."]
    for obj in ("pencil", "worm", "crayon", "train"):
        s.append(f"How long is the {obj}?")
        s += [f"The {obj} is {n} cubes long." for n in range(3, 11)]
        s += [f"The {obj} is {n} centimetres long." for n in range(2, 13)]
    # ladybird doubles (doubles.js)
    s += ["Give the other wing the same spots.", "Tap the wing to add a spot.", "Count the spots on each wing.",
          "Too many spots!", "Tap a spot to take it off.", "Count the spots on one wing.", "Count all the spots.",
          "How many on each wing?", "Is it odd or even?", "Tap a sock to hang it up.",
          "One sock is left over.", "Every sock has a partner.", "Look at the last sock.", "Does it have a partner?"]
    for n in range(1, 11):
        s += [f"What is double {n}?", f"Double {n} is {2 * n}.", f"Both wings have {n}.",
              f"This ladybird has {2 * n} spots.", f"Half of {2 * n} is {n}."]
    for n in range(3, 17):
        s += [f"Pair up the {n} socks.", f"Is {n} odd or even?", f"{n} is {'odd' if n % 2 else 'even'}."]
    # farm count (farm.js)
    s += ["Tap each animal to count it.", "Now look at the chart.", "Look at the chart again.",
          "Which animal is there most of?", "Which animal is there fewest of?", "Which row is the longest?",
          "Which row is the shortest?", "Count how many more are in the longer row.", "Add up all the rows.",
          "How many animals altogether?"]
    plurals = ("cows", "sheep", "pigs", "hens")
    for pl in plurals:
        s += [f"How many {pl} are there?", f"There are the most {pl}.", f"There are the fewest {pl}."]
        s += [f"There are {n} {pl}." for n in range(2, 9)]
        for pl2 in plurals:
            if pl2 != pl:
                s.append(f"How many more {pl} than {pl2}?")
                s += [f"There are {d} more {pl} than {pl2}." for d in range(1, 7)]
    s += [f"There are {n} animals altogether." for n in range(6, 31)]
    # pattern train (pattern.js)
    s += ["Look at the pattern.", "The pattern goes on.", "Say the pattern out loud.", "Look at how much it changes each time."]
    for step in ("ones", "2s", "5s", "10s"):
        s += [f"It goes up in {step}.", f"It goes down in {step}."]
    # full or empty (capacity.js)
    states = ("full", "nearly full", "half full", "nearly empty", "empty")
    for st in states:
        s += [f"Which glass is {st}?", f"That glass is {st}.", f"Make the glass {st}.", f"The glass is {st}."]
    s += ["Tap pour or tip out.", "Look at how much water is in each glass.", "Too much! Tip some out.",
          "Pour some more.", "Which holds less?", "Count the cups.", "Count the cups each one holds."]
    for c in ("jug", "bottle", "bucket", "vase"):
        s += [f"The {c} holds more.", f"The {c} holds less."]
    # fourth batch: level labels
    s += ["Numbers to 20.", "Numbers to 100.", "Sums.", "Bonds to 10.", "Bonds to 20.", "Missing numbers.",
          "Count the array.", "Times tables.", "Make an array.", "Days in order.", "Before, after, tomorrow.",
          "Months and seasons."]
    # hungry crocodile (croc.js)
    s += ["Which way does the crocodile face?", "It always eats the bigger number.",
          "The crocodile always eats the bigger number.", "The crocodile eats the bigger number.",
          "They are the same, so we use equals.", "Look again.", "Are they the same?"]
    # cherry bonds (cherry.js)
    s += ["What is the whole?", "Put the parts together.", "What is the missing part?", "Add the two parts together.",
          "Count on from the part you know.", "What is the missing number?", "Use the cherry to help.",
          "Find the whole and the two parts.", "The number sentence is true."]
    for w in range(3, 21):
        lo, hi = (0, w) if w <= 10 else (1, w - 1)
        s += [f"{a} and {w - a} make {w}." for a in range(lo, hi + 1)]
    # flower arrays (arrays.js)
    for c in (2, 5, 10):
        s += [f"Count in {c}s, one row at a time."]
        for r in range(2, 7):
            s += [f"There are {r} rows of {c}.", f"What is {r} times {c}?", f"{r} times {c} is {r * c}."]
    s += ["How many flowers altogether?", "Change the rows and how many in each row.", "Not enough flowers yet.",
          "Too many flowers!", "That's right, but try making more than one row."]
    for n in (6, 8, 10, 12, 15, 16, 18, 20):
        s.append(f"Make an array with {n} flowers.")
    s += [f"{r} rows of {c} is {r * c}." for r in range(1, 11) for c in range(1, 11)]
    # calendar caterpillar (calendar.js)
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    seasons = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"]
    s += ["Which day is missing from the caterpillar?", "Which day is missing?", "Tomorrow is the next day.",
          "Yesterday was the day before."]
    for i, d in enumerate(days):
        nxt, prv = days[(i + 1) % 7], days[(i + 6) % 7]
        s += [f"That's {d}.", f"What day comes after {d}?", f"What day comes before {d}?",
              f"{nxt} comes after {d}.", f"{prv} comes before {d}.", f"If today is {d}, what day is tomorrow?",
              f"If today is {d}, what day is yesterday?", f"Tomorrow is {d}.", f"Yesterday was {d}."]
    for i, m in enumerate(months):
        s += [f"That's {m}.", f"What month comes after {m}?", f"{months[(i + 1) % 12]} comes after {m}.",
              f"Which season is {m} in?", f"{m} is in {seasons[i]}."]
    s += [f"That's {x}." for x in ("spring", "summer", "autumn", "winter")]
    # fifth batch: level labels
    s += ["Land it: 0 to 20.", "Land it: 0 to 100.", "Read the line.", "Add two prices.", "Change from 10p and 20p.",
          "Pounds and change.", "Marks in 10s.", "Marks in 5s.", "Marks in 2s.", "Mirror the wing.",
          "Bigger, more colours.", "Spot the symmetry."]
    # rocket number line (rocket.js)
    s += ["Tap the number line.", "You landed right on it.", "Too far! Go back a bit.", "Not far enough! Go a bit further.",
          "What number is the rocket on?", "Each small mark is 5.", "Find the nearest ten, then count on in fives."]
    s += [f"Land the rocket on {n}." for n in range(1, 100)]
    s += [f"Very close to {n}." for n in range(1, 100)]
    s += [f"The rocket is on {n}." for n in range(5, 100, 5)]
    # cafe change (cafe.js)
    cafe_items = ("cake", "juice", "biscuit", "sandwich", "ice lolly", "banana")
    s += ["How much altogether?", "Start with the bigger price and count on.", "How much change?"]
    for item in cafe_items:
        s += [f"The {item} is {p}p." for p in range(1, 11)]
        s += [f"The {item} costs {p}p." for p in range(1, 20)]
        s += [f"The {item} costs {p} {'pound' if p == 1 else 'pounds'}." for p in range(1, 10)]
    s += [f"{a}p and {b}p is {a + b}p." for a in range(1, 11) for b in range(1, 11)]
    for paid, pounds in ((10, False), (20, False), (5, True), (10, True)):
        m = (lambda v: f"{v} {'pound' if v == 1 else 'pounds'}") if pounds else (lambda v: f"{v}p")
        s.append(f"You pay with {m(paid)}.")
        for price in range(1, paid):
            s += [f"Count up from {m(price)} to {m(paid)}.", f"{m(price)} and {m(paid - price)} make {m(paid)}."]
    # read the scale (scales.js)
    s += ["What temperature is it?", "How much water is in the jug?"]
    for step in (10, 5, 2):
        s += [f"Each mark is {step}.", f"Find the nearest ten, then count on in {step}s."]
    for v in sorted({*range(0, 101, 2), *range(0, 101, 5)}):
        s += [f"It's {v} degrees.", f"There are {v} millilitres."]
    # butterfly symmetry (symmetry.js)
    s += ["Make the other wing match, like a mirror.", "Tap a square to change its colour.", "Tap the squares to colour them.",
          "Both wings match.", "Some squares shouldn't be coloured.", "Look at the mirror line.", "Check each row.",
          "Which pattern is symmetrical?", "Both sides must match.", "That pattern is symmetrical.",
          "Look at both sides of the mirror line.", "Do they match?"]
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


def trim_gentle(pcm: np.ndarray, rate: int) -> np.ndarray:
    """Like trim(), but keeps quiet word endings ("v", "s", "th") and fades the edges to avoid clicks."""
    quiet = np.flatnonzero(np.abs(pcm) > 120)
    if not len(quiet):
        return pcm
    out = pcm[max(0, quiet[0] - int(0.03 * rate)): min(len(pcm), quiet[-1] + int(0.12 * rate))].astype(np.float32)
    fi, fo = int(0.01 * rate), int(0.04 * rate)
    out[:fi] *= np.linspace(0, 1, fi)
    out[-fo:] *= np.linspace(1, 0, fo)
    return out


def spoken_length(pcm: np.ndarray, rate: int) -> float:
    loud = np.flatnonzero(np.abs(pcm) > 400)
    return (loud[-1] - loud[0]) / rate if len(loud) else 0.0


# Numbers Tom heard as odd in the first recording; they get extra takes to choose from.
MARKED = {"4", "12", "17", "25", "28", "38", "48", "54", "64", "65", "70", "88", "95", "98"}
NUMBER_KEY = re.compile(r"^\d+[ps]?$")


# Words Tom heard as odd (samples/words.html, made by tools/word_samples.py) and the version he picked:
# word -> (how to say it, steadier, slower). "How to say it" is espeak phonemes for the word, TIDY (clean up
# the whole line's sounds, see tidy()) or None (same sounds). Every line using the word is recorded this way.
TIDY = "tidy"
STEADY = {"noise_scale": 0.4, "noise_w_scale": 0.5}  # less random wobble than Piper's default
SLOWER = 1.12
SAY = {
    "many": ("mˈɛnɪ", False, False), "the": (TIDY, False, False), "away": ("əwˈeɪ", False, False),
    "in": (TIDY, False, False), "across": ("əkɹˈɒs", True, False), "a": ("ə", False, False),
    "ones": ("wˈʌnz", False, False), "tens": (None, True, True), "apple": (TIDY, False, False),
    "past": ("pˈɑːst", False, False), "altogether": (TIDY, False, False), "biscuit": ("bˈɪskət", False, False),
    "go": (None, True, False), "full": (None, True, False), "rule": (None, True, True), "row": (None, True, False),
    "sunday": (None, True, False), "ladybird": ("lˈeɪdibɜːd", False, False), "five": (None, True, True),
    "hexagon": ("hˈɛksəɡən", False, False), "pentagon": ("pˈɛntəɡən", False, False),
    "rectangle": ("ɹˈɛktˌaŋɡəl", False, False), "triangle": (TIDY, True, False), "august": (None, True, True),
    "four": (None, True, False), "place": (None, True, False), "triangles": (TIDY, False, False),
    "use": ("jˈuːz", False, False), "hexagons": ("hˈɛksəɡənz", False, False),
    "pentagons": ("pˈɛntəɡənz", False, False), "basket": ("bˈas kɪt", False, False), "get": ("ɡˈɛt", False, False),
    "off": (None, True, True), "pour": (None, True, False), "bedtime": (None, True, True), "eat": (None, True, False),
    "pictogram": (None, True, True), "prices": (None, True, False), "shapes": (None, True, False),
}
WAS = {"a": "ɐ"}  # how espeak says a word inside a line, where that differs from the word on its own


def sounds(voice, text: str) -> str:
    return " ".join("".join(s) for s in voice.phonemize(text))


def tidy(line: str) -> str:
    """espeak adds a glide (ʲ) between vowels ("the‿apple", "tri‿angle") and runs "in the" into one word."""
    line = re.sub(r"ðɪʲ", "ði ", line)
    line = re.sub(r"ɪnð([əi])", r"ɪn ð\1", line)
    return re.sub(r"\s+", " ", line.replace("ʲ", "")).strip()


def swap(voice, line: str, word: str, ph: str) -> tuple[str, int]:
    """Replace the word's sounds in a line of sounds; returns (line, how many replaced)."""
    was = WAS.get(word) or "".join(voice.phonemize(word)[0]).lstrip("ˈˌ")
    loose = "[ˈˌ]?".join(re.escape(c) for c in was.replace("ˈ", "").replace("ˌ", ""))
    return re.subn(rf"(?<![^\s])[ˈˌ]?{loose}ʲ?(?=[\s?!.,]|$)", ph, line)  # ʲ: a glide into the next word


def say_as(voice, text: str, words) -> str:
    """The whole line as sounds, with words respelled and/or tidied. (A [[...]] block mid-text makes Piper
    read the punctuation after it aloud, e.g. "exclamation", so it's all or nothing.)"""
    line = sounds(voice, text)
    for w, ph in words:
        if ph and ph != TIDY:
            line = swap(voice, line, w, ph)[0]
    if any(ph == TIDY for _, ph in words):
        line = tidy(line)
    return f"[[{line}]]"


def recipe(voice, text: str, k: str, speed: float):
    """(what to give Piper, settings, takes, speed) for a sentence, following SAY."""
    picked = [(w, SAY[w]) for w in dict.fromkeys(k.split()) if w in SAY]
    if not picked:
        return text, {}, 1, speed
    steady = any(st for _, (_, st, _) in picked)
    said = say_as(voice, text, [(w, ph) for w, (ph, _, _) in picked if ph])
    if said == f"[[{sounds(voice, text)}]]":
        said = text  # nothing to change: plain text keeps Piper's own handling
    return said, STEADY if steady else {}, 5 if steady else 1, SLOWER if any(sl for _, (_, _, sl) in picked) else speed


def best_take(voice, text: str, speed: float, takes: int, settings=None):
    """Cori sometimes drags out or clips a word at random. Render several takes and keep the one
    with the most typical spoken length."""
    renders = []
    for _ in range(takes):
        ch = list(voice.synthesize(text, syn_config=SynthesisConfig(length_scale=speed, **(settings or {}))))
        renders.append((np.frombuffer(b"".join(c.audio_int16_bytes for c in ch), dtype="<i2"), ch[0].sample_rate))
    lengths = [spoken_length(p, r) for p, r in renders]
    mid = float(np.median(lengths))
    return renders[int(np.argmin([abs(x - mid) for x in lengths]))]


def to_mp3(pcm: np.ndarray, rate: int) -> bytes:
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(np.clip(pcm, -32768, 32767).astype("<i2").tobytes()) + enc.flush()


def all_clips() -> dict[str, tuple[str, float]]:
    """Every clip the app needs: key -> (text to render, speed)."""
    clips: dict[str, tuple[str, float]] = {}
    for p in PHRASES:
        clips.setdefault(key(p), (p, SPEED_FRAGMENT))
    for n in range(0, 101):
        clips[str(n)] = (str(n), SPEED_FRAGMENT)
    for n in range(1, 101):
        clips[f"{n}p"] = (f"{n}p", SPEED_FRAGMENT)
    for k, words in STEPS.items():
        clips[k] = (words, SPEED_FRAGMENT)
    # Games that declare voiceLines() (see docs/ADDING_A_GAME.md) are read straight from their JS files.
    collected = json.loads(subprocess.run(["node", str(ROOT / "tools" / "collect_lines.mjs")],
                                          check=True, capture_output=True, text=True).stdout)
    for text in sentences() + collected:
        # the app looks up each sentence of a line separately ("Too much! Tip some out." is two)
        for part in re.findall(r"[^.!?]+[.!?]*", text):
            if key(part):
                clips[key(part)] = (part.strip(), SPEED_SENTENCE)  # whole sentences win over same-key fragments
    return clips


def main() -> None:
    clips = all_clips()
    if "--count" in sys.argv:
        print(len(clips), "clips")
        return
    voice = PiperVoice.load(MODEL)
    if "--fresh" in sys.argv and OUT.exists():
        shutil.rmtree(OUT)  # re-record everything (e.g. after changing voice or speed)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    total = 0
    redo_numbers = "--redo-numbers" in sys.argv
    redo_said = "--redo-said" in sys.argv  # after changing SAY: re-record the lines that use those words
    for i, (k, (text, speed)) in enumerate(clips.items()):
        name = filename(k)
        is_number = bool(NUMBER_KEY.match(k)) or k in STEPS
        said = not is_number and any(w in SAY for w in k.split())
        if (OUT / name).exists() and not (redo_numbers and is_number) and not (redo_said and said):  # resumable
            manifest[k] = name
            total += (OUT / name).stat().st_size
            continue
        spoken = re.sub(r"\b(2|5|10)s\b", lambda m: STEPS[m.group(0)], text)  # "Count in 5s" -> "fives"
        if is_number:
            # bare numbers are heard most often and on their own, so take extra care with them
            raw, rate = best_take(voice, spoken, speed, 9 if k.rstrip("p") in MARKED else 5)
            pcm = trim_gentle(raw, rate)
        else:
            spoken, settings, takes, speed = recipe(voice, spoken, k, speed)
            raw, rate = best_take(voice, spoken, speed, takes, settings)
            pcm = trim_gentle(raw, rate)
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
    write_index()
    print(f"{len(manifest)} clips, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
