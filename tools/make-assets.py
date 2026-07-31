#!/usr/bin/env python3
"""Generates the app icon and splash art for GAA Career.

Draws everything procedurally so the artwork is reproducible and versioned as
code rather than as opaque binaries. Run after changing the brand colours:

    python3 tools/make-assets.py

Outputs:
  assets/                 masters for `npx @capacitor/assets generate`
  www/icons/              PWA icons referenced by the web manifest
"""

import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
PWA_ICONS = os.path.join(ROOT, "www", "icons")

PITCH_TOP = (27, 94, 58)      # #1B5E3A
PITCH_BOTTOM = (12, 46, 28)   # deeper green
GOLD = (242, 201, 76)         # #F2C94C
WHITE = (245, 248, 250)
INK = (14, 17, 22)            # #0E1116


def vertical_gradient(size, top, bottom):
    img = Image.new("RGB", (1, size), top)
    px = img.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        px[0, y] = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return img.resize((size, size), Image.BICUBIC)


def pitch_background(size):
    """Green gradient with the mown-stripe texture used in-game."""
    img = vertical_gradient(size, PITCH_TOP, PITCH_BOTTOM).convert("RGBA")
    stripes = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(stripes)
    band = size // 7
    for i in range(-size, size * 2, band * 2):
        d.polygon(
            [(i, 0), (i + band, 0), (i + band - size // 3, size), (i - size // 3, size)],
            fill=(255, 255, 255, 12),
        )
    return Image.alpha_composite(img, stripes)


def draw_posts(img, scale, cx, cy):
    """GAA goalposts — two uprights through a crossbar — with a ball over the bar."""
    d = ImageDraw.Draw(img)
    w = round(46 * scale)                 # post thickness
    half = round(210 * scale)             # half the gap between uprights
    top = cy - round(370 * scale)
    bottom = cy + round(330 * scale)
    bar_y = cy - round(40 * scale)

    for x in (cx - half, cx + half):
        d.rounded_rectangle(
            [x - w // 2, top, x + w // 2, bottom],
            radius=w // 2, fill=WHITE,
        )
    d.rounded_rectangle(
        [cx - half - w // 2, bar_y - w // 2, cx + half + w // 2, bar_y + w // 2],
        radius=w // 2, fill=WHITE,
    )

    r = round(78 * scale)                 # the ball, sailing over the bar
    ball_y = top + round(78 * scale)
    d.ellipse([cx - r, ball_y - r, cx + r, ball_y + r], fill=GOLD)


def make_icon(size, transparent_bg=False, inset=1.0):
    img = (Image.new("RGBA", (size, size), (0, 0, 0, 0))
           if transparent_bg else pitch_background(size))
    draw_posts(img, (size / 1024) * inset, size // 2, size // 2)
    return img


def make_splash(size, dark=True):
    img = Image.new("RGBA", (size, size), INK if dark else (247, 249, 251, 255))
    # Keep the mark inside the centre, since splash art is cropped hard.
    draw_posts(img, (size / 1024) * 0.55, size // 2, size // 2)
    return img


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    print("  " + os.path.relpath(path, ROOT))


def main():
    print("App icon masters (for @capacitor/assets):")
    save(make_icon(1024), os.path.join(ASSETS, "icon.png"))
    # Android adaptive icons: the foreground must sit inside the centre safe
    # zone, because the launcher masks and can zoom the outer edges away.
    save(make_icon(1024, transparent_bg=True, inset=0.62),
         os.path.join(ASSETS, "icon-foreground.png"))
    save(pitch_background(1024), os.path.join(ASSETS, "icon-background.png"))

    print("Splash masters:")
    save(make_splash(2732, dark=True), os.path.join(ASSETS, "splash.png"))
    save(make_splash(2732, dark=True), os.path.join(ASSETS, "splash-dark.png"))

    print("PWA icons:")
    for s in (192, 512):
        save(make_icon(s), os.path.join(PWA_ICONS, f"icon-{s}.png"))
    # Maskable icons are cropped to a circle by Android, so inset the mark.
    for s in (192, 512):
        save(make_icon(s, inset=0.6), os.path.join(PWA_ICONS, f"maskable-{s}.png"))
    save(make_icon(180), os.path.join(PWA_ICONS, "apple-touch-icon.png"))
    save(make_icon(32), os.path.join(PWA_ICONS, "favicon-32.png"))

    print("\nStore listing icon: assets/icon.png (1024x1024) works for both stores.")


if __name__ == "__main__":
    main()
