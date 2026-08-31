#!/usr/bin/env python3
"""Pad EvaReel App Store screenshots to required iOS sizes with opaque black."""
import os
from pathlib import Path
from PIL import Image

INPUT_DIR = Path("C:/Users/Administrator/Downloads")
OUTPUT_DIR = Path("K:/tools/tools/IOS/IOS_IPA/EvaReel/screenshots_padded")

# Each tuple: (label, width, height)
TARGETS = [
    ("iphone65", 1284, 2778),
    ("ipad13", 2048, 2732),
]

# Ordered screenshots with descriptive names.
SHOTS = [
    ("微信图片_20260831090920_47_61.jpg", "01_player"),
    ("微信图片_20260831090921_48_61.jpg", "02_paywall"),
    ("微信图片_20260831090922_49_61.jpg", "03_profile"),
    ("微信图片_20260831090922_50_61.jpg", "04_discover"),
    ("微信图片_20260831090926_51_61.jpg", "05_home"),
]


def pad_to_size(src: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Scale src to fit entirely inside target, then center on opaque black canvas."""
    src_w, src_h = src.size
    scale = min(target_w / src_w, target_h / src_h)
    new_w = int(round(src_w * scale))
    new_h = int(round(src_h * scale))
    resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (target_w, target_h), (0, 0, 0))
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))
    return canvas


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, name in SHOTS:
        src_path = INPUT_DIR / filename
        if not src_path.exists():
            print(f"SKIP missing: {filename}")
            continue

        with Image.open(src_path) as img:
            # Convert to RGB in case of any palette/alpha quirks.
            rgb = img.convert("RGB")
            for label, w, h in TARGETS:
                out_path = OUTPUT_DIR / f"{name}_{label}_{w}x{h}.png"
                padded = pad_to_size(rgb, w, h)
                padded.save(out_path, "PNG", optimize=True)
                print(f"WROTE {out_path.name}: {padded.size}")


if __name__ == "__main__":
    main()
