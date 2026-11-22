"""Register every game file in js/games/ with the app.

Usage:  python3 tools/register_games.py

- adds a <script> tag in index.html for any js/games/<id>.js that isn't listed (existing order is kept,
  because some games reuse drawing helpers from earlier files),
- rewrites the game list in sw.js so new games are cached for offline use,
- bumps the offline cache name in sw.js so installed copies pick up the new files,
- refreshes audio/cori/hashes.json so installed copies fetch new or re-recorded clips.

Safe to run any time; it only changes things when there is something to change.
"""
import re
from pathlib import Path

from voice_index import write_index

ROOT = Path(__file__).resolve().parent.parent
index = ROOT / "index.html"
sw = ROOT / "sw.js"

html = index.read_text()
listed = re.findall(r'<script src="js/games/([\w-]+)\.js"></script>', html)
on_disk = sorted(p.stem for p in (ROOT / "js" / "games").glob("*.js"))
missing = [g for g in on_disk if g not in listed]
gone = [g for g in listed if g not in on_disk]
games = [g for g in listed if g in on_disk] + missing

block = "".join(f'  <script src="js/games/{g}.js"></script>\n' for g in games)
html2 = re.sub(r'(?:  <script src="js/games/[\w-]+\.js"></script>\n)+', block, html, count=1)

text = sw.read_text()
sw_block = "".join(f'  "js/games/{g}.js",\n' for g in games)
text2 = re.sub(r'(?:  "js/games/[\w-]+\.js",\n)+', sw_block, text, count=1)

if html2 != html or text2 != text:
    text2 = re.sub(r'const CACHE = "number-garden-v(\d+)"', lambda m: f'const CACHE = "number-garden-v{int(m.group(1)) + 1}"', text2)
    index.write_text(html2)
    sw.write_text(text2)
    print(f"registered {len(games)} games" + (f"; added {', '.join(missing)}" if missing else "") + (f"; removed {', '.join(gone)}" if gone else ""))
else:
    print(f"{len(games)} games already registered; nothing to do")
if write_index():
    print("voice list updated")
