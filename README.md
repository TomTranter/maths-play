# Number Garden

Maths games for 5–7 year olds, built around the **Year 1 and Year 2 national curriculum (England)**.
Big buttons, every instruction read aloud, stars for right answers, nothing lost for wrong ones.

It is a self-contained web app: plain HTML, CSS and JavaScript, no build step, no external requests
(the font is bundled). Installed to a tablet's home screen it works offline.

## Games

| Game | What it practises | Curriculum link |
| --- | --- | --- |
| Balloon Pop | Ordering 3 numbers, smallest or biggest first; `<` and `>` | Y1 compare and order numbers |
| Sticks & Blocks | Making and reading 2-digit numbers with tens sticks and ones cubes; swapping 10 ones for a ten | Y1/Y2 place value |
| Ten Frame | Counting, making numbers, "how many more to make 10?" (single and double frames) | Y1 number bonds within 10 and 20 |
| Bead Rack | Rekenrek (number rack) with 20 and 100 beads in fives | Y1 count to 100, groups of 5 and 10 |
| Frog Hops | Adding and taking away by hopping along a number line | Y1 add and subtract within 20 |
| Hundred Square | Counting in 10s, 5s and 2s; one more and one less | Y1 count in multiples of 2, 5, 10; one more/less |
| Coin Shop | Paying with UK coins; counting a purse of coins | Y1 recognise coins; Y2 combine amounts |
| Clock | Reading and setting o'clock, half past, quarter past/to | Y1 hour and half past; Y2 quarter past/to |

Each game has levels. Four correct answers move up a level; tap the level button to change it by hand.
A right answer scores 2 stars (1 after a mistake). Progress and stars are kept in the browser (`localStorage`).

**Voice:** everything is spoken by **Poppy**, a voice recorded into the app as ~290 short clips (phrases,
numbers 0–100, pence), so it sounds the same on every device and works offline. Sentences are assembled
from clips at runtime; any line without clips falls back to the device's own voice. iPad Safari only gives
web pages its basic voices (Enhanced/Premium downloads are hidden), which is why the voice is recorded.
Grown-ups can switch to a device voice from the **Grown-ups** button on the home screen (or by holding the
speaker button for a second); a quick "tap the numbers written as words" check keeps children out.

Regenerate the clips with `uv run tools/make_voice.py` (needs the Piper model `en_GB-semaine-medium`
in `~/.cache/piper-voices/`). When a game gets a new spoken line, add its phrases to `PHRASES` there.

Poppy voice: [SEMAINE database](https://github.com/marytts/dfki-semaine-data) (DFKI), CC BY-NC-SA 4.0,
via [Piper](https://github.com/rhasspy/piper). Non-commercial use only.

## Run it

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

Opening `index.html` directly from disk also works, but without offline caching.

To put it on a tablet, it needs to be served over **https** (for example GitHub Pages or Netlify);
then use the browser's *Add to Home Screen*. After the first visit it runs offline.

## Layout

```
index.html              page shell, loads the scripts in order
css/app.css             all styles (design tokens at the top)
js/core.js              shared engine: sound, speech, effects, scoring, levels, routing
js/games/*.js           one file per game; each registers itself in GAMES
js/main.js              boot + service worker registration
sw.js                   offline cache (network-first; bump CACHE when the file list changes)
manifest.webmanifest    install metadata
fonts/                  Baloo 2 (SIL Open Font License, see fonts/OFL.txt)
icons/                  app icons
audio/poppy/            recorded voice clips + manifest.json (generated)
tools/make_voice.py     renders the voice clips with Piper
```

## Adding a game

Create `js/games/<id>.js` defining an object with `id`, `name`, `strand`, `levels` (each with a `label`),
`art` (an inline SVG for the home tile) and `next(first)`, which builds one task with `newTask()`,
fills `#stage` and `#ground`, and calls `win()` / `miss()`. Register it with `GAMES.<id> = game;`,
add a `<script>` tag to `index.html` and the path to `ASSETS` in `sw.js`.
