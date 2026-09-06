#!/usr/bin/env python3
"""Regenerate setsail/assets/email-logo.png — the Set Sail mark for the beta
confirmation email.

Gmail strips inline SVG, so the mark that the landing page draws as an inline
<svg> has to be a hosted raster in the email. This renders that same SVG —
read straight out of setsail/index.html, so the two can't drift — to a
transparent PNG at 2x the 56px display size.

Rendered with headless Chrome, same approach as scripts/generate-og-image.py,
since neither rsvg-convert nor cairosvg is a dependency of this repo.

Usage:
    python3 scripts/generate-setsail-email-logo.py
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "setsail" / "index.html"
OUT = ROOT / "setsail" / "assets" / "email-logo.png"
DISPLAY_PX = 56
SCALE = 2

CHROME_CANDIDATES = [
    os.environ.get("CHROME", ""),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
]


def find_chrome():
    for path in CHROME_CANDIDATES:
        if path and Path(path).exists():
            return path
    sys.exit(
        "Could not find Chrome. Install it, or point CHROME at the binary:\n"
        "  CHROME=/path/to/chrome python3 scripts/generate-setsail-email-logo.py"
    )


def extract_mark(html: str) -> str:
    match = re.search(r'<svg class="ss-mark".*?</svg>', html, re.DOTALL)
    if not match:
        sys.exit(f"Could not find the .ss-mark <svg> in {SOURCE}")
    svg = match.group(0)
    # The page sizes it at 56px; render at 2x for retina inboxes instead.
    size = DISPLAY_PX * SCALE
    svg = re.sub(r'width="\d+"', f'width="{size}"', svg, count=1)
    svg = re.sub(r'height="\d+"', f'height="{size}"', svg, count=1)
    return svg


def main():
    svg = extract_mark(SOURCE.read_text(encoding="utf-8"))
    size = DISPLAY_PX * SCALE
    page = (
        "<!doctype html><meta charset='utf-8'>"
        "<style>html,body{margin:0;padding:0;background:transparent}</style>"
        f"{svg}"
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        html_path = Path(tmp) / "logo.html"
        html_path.write_text(page, encoding="utf-8")
        try:
            subprocess.run(
                [
                    find_chrome(),
                    "--headless",
                    "--disable-gpu",
                    "--no-sandbox",
                    "--hide-scrollbars",
                    "--default-background-color=00000000",
                    f"--window-size={size},{size}",
                    "--screenshot=" + str(OUT),
                    html_path.as_uri(),
                ],
                check=True,
                capture_output=True,
            )
        except subprocess.CalledProcessError as exc:
            sys.exit("Chrome failed:\n" + exc.stderr.decode("utf-8", "replace")[-2000:])

    print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes, {size}x{size})")


if __name__ == "__main__":
    main()
