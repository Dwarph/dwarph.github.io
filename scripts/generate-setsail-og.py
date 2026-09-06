#!/usr/bin/env python3
"""Regenerate setsail/assets/og.png - the card shown when Set Sail is linked.

Rendered from scripts/setsail-og-template.html, which reuses setsail.css's own
type and colour tokens over the landscape ocean painting. Same approach as
generate-og-image.py: headless Chrome at 2x, downsampled, so the type stays
crisp. Needs network the first time in a while - the template pulls Outfit and
Nunito Sans from Google Fonts.

The crop is left to `background-size: cover`, which at 1200x630 renders the
3200x2400 painting at 1200x900 and centres it - putting the boat at roughly
(907, 308), clear of the copy on the left.

Usage:
    python3 scripts/generate-setsail-og.py [--out setsail/assets/og.png]
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile

WIDTH, HEIGHT = 1200, 630
SCALE = 2
OCEAN = "setsail/assets/ocean.webp"

CHROME_CANDIDATES = [
    os.environ.get("CHROME", ""),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
]


def find_chrome():
    for path in CHROME_CANDIDATES:
        if path and os.path.exists(path):
            return path
    sys.exit(
        "Could not find Chrome. Install it, or point CHROME at the binary:\n"
        "  CHROME=/path/to/chrome python3 scripts/generate-setsail-og.py"
    )


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join("setsail", "assets", "og.png"))
    ap.add_argument("--jpeg", action="store_true", help="write JPEG instead (much smaller)")
    ap.add_argument("--quality", type=int, default=88, help="JPEG quality (default 88)")
    args = ap.parse_args()

    ocean = os.path.join(root, OCEAN)
    if not os.path.exists(ocean):
        sys.exit("Missing the painting: " + OCEAN)

    with open(os.path.join(root, "scripts", "setsail-og-template.html")) as fh:
        html = fh.read().replace("__OCEAN__", OCEAN)

    # Rendered from the repo root so the asset path above resolves as written.
    render_html = os.path.join(root, ".setsail-og-render.html")
    shot = os.path.join(tempfile.mkdtemp(), "shot.png")
    chrome = find_chrome()

    try:
        with open(render_html, "w") as fh:
            fh.write(html)
        subprocess.run(
            [
                chrome,
                "--headless",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=%d" % SCALE,
                "--window-size=%d,%d" % (WIDTH, HEIGHT),
                # give the webfonts time to land before the shot is taken
                "--virtual-time-budget=15000",
                "--screenshot=" + shot,
                "file://" + render_html,
            ],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as exc:
        sys.exit("Chrome failed:\n" + exc.stderr.decode("utf-8", "replace")[-2000:])
    finally:
        if os.path.exists(render_html):
            os.remove(render_html)

    out_path = os.path.join(root, args.out)
    from PIL import Image

    img = Image.open(shot).convert("RGB")
    if img.size != (WIDTH, HEIGHT):
        img = img.resize((WIDTH, HEIGHT), Image.LANCZOS)
    if args.jpeg:
        out_path = os.path.splitext(out_path)[0] + ".jpg"
        img.save(out_path, quality=args.quality, optimize=True, progressive=True)
    else:
        img.save(out_path, optimize=True)
    print("Wrote %s (%dx%d, %.0f KB)" % (
        os.path.relpath(out_path, root), WIDTH, HEIGHT,
        os.path.getsize(out_path) / 1024))


if __name__ == "__main__":
    main()
