# Number Garden — working notes

Maths games for 5–7 year olds (UK Year 1–2 curriculum). Plain HTML/CSS/JS served by GitHub Pages; see README.md.

## Skills (in `.claude/skills/`)

- **add-game**: making a new game. The contract is `docs/ADDING_A_GAME.md`; `js/games/croc.js` is the reference example.
- **publish**: self-test, bump `APP_VERSION`, commit, push, confirm the Pages build.
- **make-it-yours**: a parent setting up and customising their own copy.

## How it fits together

- **No build step, no dependencies, no network.** Classic `<script>`s (not modules) so it also runs from `file://`.
  Top-level names in `js/core.js` and every `js/games/*.js` share one global scope: prefix game-level names with the game id.
- **One file per game**, registered with `addGame(game)`. A game can carry its own `css`, must list every spoken
  sentence in `voiceLines()`, and should have `test.answer()` that plays the right answer through the real controls.
  (The older games register with `GAMES.<id> = <id>` and keep their lines in `tools/make_voice.py`; both work.)
- **Registration**: `python3 tools/register_games.py` adds game files to `index.html` and `sw.js` and bumps the cache.
- **Voice**: Cori only (pre-recorded clips in `audio/cori/`, made by `tools/make_voice.py` with Piper). Lines without
  a clip fall back to the device voice, which sounds robotic. Recording is CPU-heavy (the script caps itself at 4 threads; set VOICE_THREADS to change): run it as
  `nice -n 10 uv run tools/make_voice.py`, and never alongside other heavy jobs.
- **Offline**: `sw.js` caches the app; `js/offline.js` saves the voice in `number-garden-voice`, checked against
  `audio/cori/hashes.json` (written by both tools above). Clip names don't change when re-recorded, so never skip that file.
- **Self-test**: `python3 -m http.server 8000`, then `http://localhost:8000/?selftest` (or `?selftest=<id>`): plays
  every level via `test.answer()`, reports rounds that can't be won and sentences without a recording.

## Kid-facing rules

Every instruction is spoken; wrong answers never cost stars (`miss(hint)`); win lines start with "Yes!" (swapped for
varied praise); every round must be possible with what's on screen; tap targets ≥ ~44px; fits at 375×667 and 568×320 (boards sized in cqw/cqh; css/layout.css, js/fit.js as backstop);
UK wording ("take away", "p" for pence, "colour").

## Verify

Self-test passes, then play the changed game by hand at 375×667, 568×320 and 1024×768 (and look at every level: the test taps the answer directly). Use one browser at a time.
