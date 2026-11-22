---
name: make-it-yours
description: Use when a parent or teacher wants their own copy of Number Garden, to set it up on their tablet, rename it, change colours or difficulty, hide or remove games, or asks "how do I get started" with this repo.
---

# Make Number Garden your own

Goal: the parent ends up with their own copy, live on the web, on their child's tablet, customised to taste.
Do the technical parts for them; ask only about choices that are theirs (name, which games, colours).

## 1. Get a copy and put it online

```bash
gh repo fork TomTranter/maths-play --clone --remote      # or "Use this template" on GitHub
cd maths-play
git remote -v            # origin must be THEIR fork (upstream is the original); publish pushes to origin
gh api -X POST repos/<their-user>/maths-play/pages -f "source[branch]=main" -f "source[path]=/"
```
If they already cloned the original instead of forking, fork it now and point `origin` at the fork
(`gh repo fork --remote`), or pushes will go to (and be refused by) the original.

Their app will be at `https://<their-user>.github.io/maths-play/` within a minute or two. Free accounts need the
repository public; nothing about the child is stored online.

On the tablet: open the address, then **Share → Add to Home Screen** (iPad) or **Install app** (Android), and
open it on wifi and leave it open, screen on, for about 5 minutes so the voice (55 MB) saves for offline play.

## 2. Customise (common requests)

| They want | Change |
| --- | --- |
| A different app name | `<title>` and `apple-mobile-web-app-title` in `index.html`; `name`/`short_name` in `manifest.webmanifest`; the `<h1>` in `showHome()` in `js/core.js`; the `Number Garden ${APP_VERSION}` line in `openLevelPicker()` in `js/main.js` |
| Different colours | CSS variables at the top of `css/app.css` (`--sky-top`, `--sky-low` for the sky, `--grass`/`--grass-dark`, `--sun`, …), plus `theme_color`/`background_color` in `manifest.webmanifest` and `<meta name="theme-color">` in `index.html` (the tablet's status bar and splash screen) |
| Fewer games | Delete `js/games/<id>.js`, then `python3 tools/register_games.py` |
| Games in a different order | Reorder the `<script src="js/games/…">` lines in `index.html` (keep `shapes` before `pattern`, `coins` before `cafe`) |
| Easier or harder | Edit the `levels` list in that game's file (e.g. `max: 10` → `max: 5`) |
| A new game | Use the `add-game` skill |
| More rounds before levelling up | `ROUNDS_PER_LEVEL` in `js/core.js` |

The repository is public, so nothing personal goes into the code or the voice. If a parent asks for their child's
name in the app (e.g. "call it Maya's Maths"), explain that it would be public on GitHub and suggest a name
without it ("Maths Garden", "Our Maths"); only use the child's name if they confirm after hearing that.

## 3. The voice (only needed when spoken lines change)

Cori's voice is pre-recorded into `audio/cori/`, so existing games need nothing. To record new or changed lines:

```bash
uv --version || curl -LsSf https://astral.sh/uv/install.sh | sh        # Python runner
mkdir -p ~/.cache/piper-voices && cd ~/.cache/piper-voices
base=https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high
curl -LO "$base/en_GB-cori-high.onnx" -LO "$base/en_GB-cori-high.onnx.json"
cd - && nice -n 10 uv run tools/make_voice.py
```
Only new lines are recorded; existing clips are kept.

## 4. Publish

Use the `publish` skill (self-test, bump `APP_VERSION`, commit, push, check the live version).

## Common mistakes

- **Editing a game and forgetting the voice**: changed sentences fall back to the robotic device voice. Run
  `uv run tools/make_voice.py`, then open `?selftest` to check every sentence has a recording.
- **Deleting a game file without re-registering**: the page tries to load a missing file. Run `tools/register_games.py`.
