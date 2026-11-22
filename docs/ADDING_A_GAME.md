# Adding a game

A game is **one file**: `js/games/<id>.js`. Everything it needs lives there: how it looks, what it says,
how it checks answers, and a test that plays it. [`js/games/croc.js`](../js/games/croc.js) is the reference
example, and [`tools/game-template.js`](../tools/game-template.js) is a starting point to copy.

If you use Claude Code, just ask: *"Add a game where …"*. The `add-game` skill walks Claude through
everything below.

## The shape of a game

```js
"use strict";

const mygame = {
  id: "mygame",                        // short, unique, lowercase; also the file name and the #link
  name: "My Game",                     // shown on the home tile
  strand: "Counting to 20",            // the small line under the name (the maths it practises)
  levels: [                            // 2–4 levels, easiest first; four right answers move up a level
    { label: "Up to 10", max: 10 },
    { label: "Up to 20", max: 20 },
  ],
  art: `<svg viewBox="0 0 120 90" aria-hidden="true">…</svg>`,   // home tile picture
  css: `.mygame-board { … }`,          // optional styles; prefix class names with the game id

  next(first) {                        // start one round; called again after every right answer.
                                       // `first` is true when the game has just been opened (or the level changed)
    const L = level(mygame);           // the current level object
    const t = newTask({ answer: 7 });  // always start with newTask(); store what you need on it
    $("stage").replaceChildren(h(`<div class="mygame-board">…</div>`));   // the picture area
    setInstruction("How many <b>apples</b>?", "How many apples?");      // shown + spoken
    choices(7, [6, 8], "Count them again.", "Yes! 7", "Yes! There are 7 apples.");
  },

  voiceLines() {                       // EVERY line the game can say, with every number filled in
    const lines = ["How many apples?", "Count them again."];
    for (let n = 1; n <= 20; n++) lines.push(`Yes! There are ${n} apples.`);
    return lines;
  },

  test: {                              // plays the right answer through the real buttons
    answer() {
      [...document.querySelectorAll("#ground .choice")].find((b) => +b.textContent === task.answer).click();
    },
  },
};
addGame(mygame);
```

## Helpers you can use (from `js/core.js`)

| Helper | What it does |
| --- | --- |
| `newTask({...})` | Start a round. Returns the task object (also available as `task`). |
| `level(game)` | The current level object, e.g. `{ label, max }`. |
| `setInstruction(html, spoken)` | Shows the instruction (use `<b>` for the key word) and says `spoken`. |
| `choices(answer, wrongs, hint, bannerText, spokenWin, {fmt, wide})` | Three big answer buttons on the grass. Handles right and wrong taps for you. |
| `checkRow(onCheck, onClear)` | A big green **Check** button (and optional **Clear**) for build-it games. |
| `win(el, bannerText, spokenWin)` | A right answer: stars, confetti, banner, voice, then the next round. |
| `miss(hint)` | A wrong answer: a boing and a spoken hint. Never takes stars away. |
| `say(text)` | Speak a line (Cori's recorded voice). |
| `rand(a, b)`, `pick(arr)`, `shuffle(arr)`, `plural(n, "apple", "apples")` | Small maths helpers (`rand` includes both ends). |
| `distractors(n, lo, hi, deltas, first = [])` | Two wrong answers near `n`: tries the values in `first`, then `n + delta` for each delta in random order, keeping ones inside `lo..hi` that aren't `n`. Give enough deltas that two always fit (e.g. `[-2, -1, 1, 2]`), or it can return fewer than two. |
| `h(html)`, `$(id)` | Make an element from HTML; get an element by id. |
| `click()`, `chime(i)`, `boing()`, `popSound()`, `tone(...)` | Sounds. |
| `shakeEl(el)`, `burst(x, y, colour)`, `confetti()`, `banner(text)` | Little effects. |
| `busy` | `true` while a round is finishing; ignore taps when it is. |

Layout: `#stage` is the sky area for the picture, `#ground` is the grass for buttons. Colours come from
CSS variables in [`css/app.css`](../css/app.css) (`--paper`, `--ink`, `--sun`, `--good`, `--pink`, …).

## Rules that keep it working for small children

- **Speak everything.** Every instruction, hint and win is spoken, so children who can't read yet can play.
- **Wrong answers never cost stars.** Give a gentle hint instead (`miss("Count them again.")`).
- **Big targets.** Buttons and tappable things at least about 44px.
- **Fits every screen.** Check 320×568 and 375×667 (phone upright), 568×320 and 844×390 (phone on its side,
  where the grass becomes a column on the right) and 1024×768. Size boards from the stage with `cqw`/`cqh`
  (100cqh is the height of the sky area), not `vw`/`vh`. Anything still too big is shrunk by `js/fit.js`,
  which keeps it visible but makes the targets smaller.
- **No buttons inside buttons.** The browser splits them and the card comes out blank. Use `<span>` inside.
- **`h()` takes one top-level element.** Anything after the first is lost (the self-test reports it).
- **UK words.** "Take away", "p" for pence, "half past", "colour", "maths".
- **Start win lines with "Yes!"**. The app swaps it for a random "Brilliant!", "Spot on!" and so on.
- **`voiceLines()` must list every sentence exactly as spoken**, with every possible number filled in.
  Sentences are recorded separately (split at `.` `!` `?`), so `"Yes! There are 7 apples."` needs
  `"There are 7 apples."` covered. Keep the number of different sentences sensible (hundreds, not thousands):
  split long lines into short sentences so the parts repeat.
- **Prefix CSS classes with the game id** so games don't clash.
- **`voiceLines()` runs outside the browser** (in `tools/collect_lines.mjs`), where only `rand`, `pick`, `shuffle`,
  `plural`, `level`, `prog` and your own file's names exist: no `h`, `$`, `distractors` or DOM. Build the list from
  plain loops over every possible value.
- **Don't add global names that might clash**: keep helpers inside the game object, or prefix them.

## After writing the file

```bash
node --check js/games/mygame.js        # catches typos
node tools/collect_lines.mjs mygame    # checks voiceLines() runs, shows a sample
python3 tools/register_games.py        # adds it to index.html and the offline list
nice -n 10 uv run tools/make_voice.py  # records Cori saying the new lines (needs the Piper voice, see README)
python3 -m http.server 8000            # then open http://localhost:8000/?selftest=mygame
```

The self-test plays every level using `test.answer()` and lists anything that doesn't award a star, anything
off the screen at the current window size, and any sentence without a recording. Run it once with the window
375×667 and once at 568×320, then play it yourself at both.
