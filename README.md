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
| Fair Shares | Spotting shapes cut into equal halves/quarters; colouring a half or a quarter | Y1 recognise a half and a quarter |
| Party Bags | Sharing sweets into bags, filling bags equally, counting bags in 2s, 5s, 10s | Y1 grouping and sharing; Y2 2, 5, 10 times tables |
| Balance Scales | Heavier/lighter on a scale; making both sides equal (8 + 5 = 10 + ?) | Y1 compare mass; = sign and missing numbers |
| Shape Hunt | Finding every shape of a kind; sides, corners and "What am I?" riddles | Y1 name 2D shapes; Y2 sides and corners |
| Robot Route | Programming a robot with forward/turn arrows to reach a star, round rocks | Y1/Y2 position, direction, quarter and half turns |
| Measure It | Longer/shorter snakes; measuring with cubes; reading a cm ruler (not always from 0) | Y1 compare and measure length; Y2 cm with a ruler |
| Ladybird Doubles | Copying spots to the other wing; doubles and halves; pairing socks for odd/even | Y1/Y2 doubling and halving; odd and even |
| Farm Count | Counting animals into a tally chart or pictogram, then reading it | Y2 tally charts, pictograms, comparing totals |
| Pattern Train | What comes next: colour, shape and number patterns (up/down in 1s, 2s, 5s, 10s) | Y2 patterns and sequences; counting in steps |
| Full or Empty | Spotting full/half full/empty, pouring to a level, which container holds more | Y1 capacity and volume; Y2 compare capacity |
| Hungry Crocodile | Choosing <, > or = (the crocodile eats the bigger number), with numbers and sums | Y1 more/less/equal; Y2 <, > and = signs |
| Cherry Bonds | Part-whole cherry diagrams; missing parts and missing numbers (? + 3 = 7, 9 − ? = 4) | Y1 number bonds, missing number problems; Y2 inverse |
| Flower Arrays | Counting arrays in 2s/5s/10s, times tables, building an array for a number | Y2 2, 5 and 10 times tables; commutativity |
| Calendar Caterpillar | Days in order; before/after/tomorrow/yesterday; months and seasons | Y1 days of the week, months, dates language |
| Rocket Number Line | Tapping where a number goes on a 0–20 / 0–100 line; reading a marked point | Y1/Y2 number line, estimating |
| Café Change | Adding two prices; change from 10p/20p; change in pounds | Y2 money: totals and giving change |
| Read the Scale | Thermometers and measuring jugs marked in 10s, 5s and 2s | Y2 temperature (°C), capacity (ml), reading scales |
| Butterfly Symmetry | Colouring the other wing as a mirror image; spotting the symmetrical pattern | Y2 vertical line symmetry |

Each game's level button opens a level list. **Grown-ups** (home screen) can reset every game to level 1 or reset the stars.

Each game has levels. Four correct answers move up a level; tap the level button to change it by hand.
A right answer scores 2 stars (1 after a mistake). Progress and stars are kept in the browser (`localStorage`).

**Voice:** everything is spoken by **Cori**, a voice recorded into the app: every sentence the games can
say (~2,300 clips) is recorded whole, so it sounds natural, the same on every device, and works offline.
A sentence without a whole clip is pieced together from phrase/number clips; failing that, the line falls
back to the device's own voice. iPad Safari only gives web pages its basic voices (Enhanced/Premium
downloads are hidden), which is why the voice is recorded.
Grown-ups can switch to a device voice from the **Grown-ups** button on the home screen (or by holding the
speaker button for a second); a quick "tap the numbers written as words" check keeps children out.

Regenerate the clips with `uv run tools/make_voice.py` (needs the Piper model `en_GB-cori-high`
in `~/.cache/piper-voices/`). When a game gets a new spoken line, add it to `sentences()` or `PHRASES` there.

Cori voice: [Piper](https://github.com/rhasspy/piper) model `en_GB-cori-high`, trained on public-domain
[LibriVox](https://librivox.org) recordings.

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
audio/cori/             recorded voice clips + manifest.json (generated)
tools/make_voice.py     renders the voice clips with Piper
```

## Adding a game

Create `js/games/<id>.js` defining an object with `id`, `name`, `strand`, `levels` (each with a `label`),
`art` (an inline SVG for the home tile) and `next(first)`, which builds one task with `newTask()`,
fills `#stage` and `#ground`, and calls `win()` / `miss()`. Register it with `GAMES.<id> = game;`,
add a `<script>` tag to `index.html` and the path to `ASSETS` in `sw.js`.
