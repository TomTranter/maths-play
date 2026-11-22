---
name: add-game
description: Use when someone asks to add, make, invent or build a new game, activity or level for Number Garden (this maths app for 5–7 year olds), or to turn a maths idea ("a game about halves", "something with dice") into a playable game.
---

# Add a game to Number Garden

A game is **one file**, `js/games/<id>.js`, holding its look, logic, everything it says aloud and a self-test.
The full contract is [docs/ADDING_A_GAME.md](../../../docs/ADDING_A_GAME.md); the reference example is
[js/games/croc.js](../../../js/games/croc.js); copy [tools/game-template.js](../../../tools/game-template.js) to start.

## Steps

1. **Pin down the game** in one or two sentences: the maths (UK Year 1/2 curriculum point), what the child taps,
   and 3 levels from easy to harder. If the parent's idea is vague, choose sensible defaults and say what you chose.
2. **Read** `docs/ADDING_A_GAME.md` and `js/games/croc.js`, and skim one similar existing game in `js/games/`.
3. **Write** `js/games/<id>.js` from the template. Required parts: `id, name, strand, levels, art, next()`,
   `voiceLines()`, `test.answer()`, `addGame(...)`. Put styles in `css` with classes prefixed by the id, and
   prefix every top-level name with the id (all game files share one global scope).
4. **Check it loads and lists its lines:**
   ```bash
   node --check js/games/<id>.js && node tools/collect_lines.mjs <id>
   ```
5. **Register it:** `python3 tools/register_games.py` (adds it to `index.html` and the offline list in `sw.js`).
6. **Record the voice** for the new lines. This needs Piper and the Cori model; see the README's
   "The voice". It is CPU-heavy (capped at 4 threads by default; set `VOICE_THREADS` to change), so run it politely:
   ```bash
   nice -n 10 uv run tools/make_voice.py
   ```
7. **Self-test:** `python3 -m http.server 8000`, open `http://localhost:8000/?selftest=<id>`. Every level must
   show `ok`, with no missing recordings. Run it at 375×667 and again at 568×320 (phone on its side), then play it by hand at both and at 1024×768.
8. **Publish** with the `publish` skill when the parent is happy.

## Checklist before calling it done

| Check | Why |
| --- | --- |
| Every round is possible with what's on screen | Never ask for 25 counters when there are 20 spaces. `test.answer()` throws if it can't play a round, and the self-test reports it. |
| Every spoken sentence is in `voiceLines()` | Otherwise that line falls back to the device's robotic voice. The self-test lists any it hears that aren't declared. |
| Wrong answers only give a hint (`miss`) | Children must never lose stars. |
| Win lines start with `Yes!` | The app swaps it for varied praise. |
| Tap targets ≥ 44px; fits at 375×667 and 568×320; size boards in `cqw`/`cqh`; no button inside a button | Small fingers, small screens. |
| UK wording | "colour", "take away", "p" for pence, "half past". |

## Common mistakes

- **Too many distinct sentences.** Each one is a recording. Say "There are 7 apples." as its own sentence
  rather than baking several numbers into one long sentence; aim for a few hundred sentences at most.
- **Global name clashes.** A helper called `drawCard` in two game files breaks both. Prefix with the id.
- **Answers that depend on randomness the test can't see.** Store the answer (or the right button) on `task`
  so `test.answer()` can find it.
- **Forgetting to register.** A file in `js/games/` does nothing until `tools/register_games.py` has run.
