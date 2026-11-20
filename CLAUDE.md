# Number Garden — working notes

Maths games for a 6-year-old (UK Year 1–2 curriculum). See README.md for the game list and layout.

- **No build step, no dependencies, no network.** Plain classic `<script>`s (not ES modules) so it also runs from `file://`. Top-level `let`/`const` in `js/core.js` are shared with the game files.
- **Every game file must be listed in `index.html` and in `ASSETS` in `sw.js`.** The service worker is network-first (cache only when offline); bump `CACHE` in `sw.js` when the asset list changes.
- **Kid-facing rules:** every instruction is spoken (`setInstruction(html, spoken)`); wrong answers never cost stars; keep tap targets ≥ ~44px; UK wording ("take away", "p" for pence, "half past").
- **Speech:** `say()` returns a promise; use `afterSpeech()` before moving on so lines aren't cut off.
- **Recorded voice (Cori):** every sentence the games say is recorded whole in `audio/cori/` (~2,300 clips); stitching fragments together sounded choppy, so fragments are only a safety net. Any new or changed spoken line must be added to `sentences()` (numbered templates) or `PHRASES` in `tools/make_voice.py`, mirroring the game template exactly; re-run `uv run tools/make_voice.py` and commit `audio/cori/`. Check in the browser that each sentence of the line has a whole clip: `clipMap[clipKey(sentence)]`.
- **Verify** by serving (`python3 -m http.server`) and playing each changed game in a browser at phone (400×800) and tablet (1024×768) sizes.
