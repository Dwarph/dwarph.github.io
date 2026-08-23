#!/usr/bin/env python3
"""Regenerate images/ogimage.png — the preview card shown when the site is linked.

The card is rendered from scripts/og-image-template.html, which reuses the site
header's own layout and type tokens. Name, role, profile picture and background
are read from data/homepageData.json, so swapping the profile picture and
re-running this is enough to keep the preview in step with the homepage.

Rendered with headless Chrome at 2x and downsampled, so the type stays crisp.
Needs network access the first time in a while: the template pulls Outfit from
Google Fonts.

Usage:
    python3 scripts/generate-og-image.py [--out images/ogimage.png] [--jpeg]

    --jpeg  write a .jpg alongside/instead (much smaller; remember to update the
            og:image meta tags in the HTML files if you switch format)
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

WIDTH, HEIGHT = 1280, 720
SCALE = 2

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
        "  CHROME=/path/to/chrome python3 scripts/generate-og-image.py"
    )


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join("images", "ogimage.png"))
    ap.add_argument("--jpeg", action="store_true", help="write JPEG instead of PNG")
    ap.add_argument("--quality", type=int, default=88, help="JPEG quality (default 88)")
    args = ap.parse_args()

    data_path = os.path.join(root, "data", "homepageData.json")
    with open(data_path) as fh:
        header = json.load(fh)["header"]

    for key in ("profileImage", "backgroundImage"):
        asset = os.path.join(root, header[key])
        if not os.path.exists(asset):
            sys.exit("Missing asset referenced by homepageData.json: " + header[key])

    template_path = os.path.join(root, "scripts", "og-image-template.html")
    with open(template_path) as fh:
        html = fh.read()

    def esc(text):
        return (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

    for token, value in (
        ("__BACKGROUND__", header["backgroundImage"]),
        ("__PROFILE__", header["profileImage"]),
        ("__NAME__", esc(header["name"])),
        ("__ROLE__", esc(header["role"])),
    ):
        html = html.replace(token, value)

    # Rendered from the repo root so the asset paths in homepageData.json resolve as-is.
    render_html = os.path.join(root, ".og-render.html")
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
                # give the webfont time to land before the shot is taken
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
    if args.jpeg:
        out_path = os.path.splitext(out_path)[0] + ".jpg"

    try:
        from PIL import Image
    except ImportError:
        if args.jpeg or SCALE != 1:
            sys.exit("Pillow is needed to downsample/convert: pip3 install Pillow")
        shutil.move(shot, out_path)
        print("Wrote", out_path)
        return

    img = Image.open(shot).convert("RGB")
    if img.size != (WIDTH, HEIGHT):
        img = img.resize((WIDTH, HEIGHT), Image.LANCZOS)

    if args.jpeg:
        img.save(out_path, quality=args.quality, optimize=True, progressive=True, subsampling=0)
    else:
        img.save(out_path, optimize=True)

    print("Wrote %s (%dx%d, %.0f KB)" % (
        os.path.relpath(out_path, root), img.width, img.height,
        os.path.getsize(out_path) / 1024.0,
    ))


if __name__ == "__main__":
    main()
