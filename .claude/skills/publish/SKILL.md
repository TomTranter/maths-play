---
name: publish
description: Use when asked to publish, deploy, release, ship, push or update the live Number Garden app (GitHub Pages), or when changes are finished and should reach the tablet.
---

# Publish Number Garden

The app is plain files served by **GitHub Pages** from the `main` branch. Publishing = check, commit, push,
wait for the Pages build, confirm the new version is live. Installed copies update themselves the next time
they open online.

## Steps

1. **Everything registered and recorded:**
   ```bash
   python3 tools/register_games.py
   nice -n 10 uv run tools/make_voice.py     # only if any spoken line changed; skip if Piper isn't set up
   ```
2. **Bump the version** shown in the app: `APP_VERSION` in `js/core.js` (e.g. "3.1" → "3.2").
3. **Self-test passes:** serve with `python3 -m http.server 8000`, open `http://localhost:8000/?selftest`.
   Every game must say `ok` and every sentence must have a recording. Fix anything that doesn't.
4. **Commit only what belongs to this change, then push** (ask the person first if they haven't already asked
   you to publish):
   ```bash
   git status --short                      # read it: is everything listed part of this change?
   git add js/ css/ audio/ index.html sw.js docs/ README.md   # stage what this change touched (adjust)
   git status --short                      # nothing unexpected staged, nothing needed left behind
   git commit -m "<what changed>" && git push origin main
   ```
   If `git status` shows files you didn't change and don't recognise, stop and ask instead of committing them.
5. **Wait for the Pages build** and confirm the live version. `<owner>/<repo>` is the repository `origin` points
   at (`git remote get-url origin`); for a parent's copy that is their fork, not `TomTranter/maths-play`.
   ```bash
   gh api repos/<owner>/<repo>/pages/builds/latest --jq '.status + " " + .commit[0:7]'   # until "built <your commit>"
   curl -s https://<owner>.github.io/<repo>/js/core.js | grep -o 'APP_VERSION = "[0-9.]*"'
   ```
6. **Tell the parent** to fully close the app on the tablet and reopen it on wifi; the version is shown at the
   bottom of a game's level list.

## First time only: turn on GitHub Pages

```bash
gh api -X POST repos/<owner>/<repo>/pages -f "source[branch]=main" -f "source[path]=/"
```
On a free GitHub account the repository must be public. The app stores nothing about the child online:
stars and levels stay in the browser on that device.

## Common mistakes

- **Pushing without bumping `APP_VERSION`**: nobody can tell whether the tablet has the update.
- **Publishing with missing recordings**: those lines use the tablet's own voice, which sounds robotic.
- **Large voice changes**: the first open after publishing downloads the new clips in the background; tell the
  parent to keep the tablet on wifi for a minute.
