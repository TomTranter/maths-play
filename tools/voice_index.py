"""List a short content hash for every recorded clip in audio/cori/hashes.json.

Clip file names come from the words, not the sound, so this is how installed copies notice a re-recording.
make_voice.py and register_games.py both refresh it.
"""

import hashlib
import json
from pathlib import Path

VOICE = Path(__file__).resolve().parent.parent / "audio" / "cori"


def write_index() -> bool:
    """Rewrite hashes.json; True if it changed."""
    files = sorted(set(json.loads((VOICE / "manifest.json").read_text()).values()))
    hashes = {f: hashlib.sha1((VOICE / f).read_bytes()).hexdigest()[:10] for f in files if (VOICE / f).exists()}
    text = json.dumps(hashes, separators=(",", ":"))
    out = VOICE / "hashes.json"
    if out.exists() and out.read_text() == text:
        return False
    out.write_text(text)
    return True
