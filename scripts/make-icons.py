"""Generate the PWA / favicon icons (run once; the PNGs and .ico are committed). Needs Pillow.

Design: ember square, a bold white "21.1" (half marathon km) in Outfit, and a sun-coloured finish-line bar under it.
iOS and Android round the corners themselves, so the artwork is full-bleed.
"""
from PIL import Image, ImageDraw, ImageFont

EMBER = (201, 66, 12)
DEEP = (156, 47, 6)
PAPER = (255, 248, 241)
SUN = (245, 165, 36)
FONT = "node_modules/@fontsource/outfit/files/outfit-latin-700-normal.woff"
MASTER = 2048


def master(scale, lanes=True):
    """scale = how much of the canvas the artwork may use (smaller for maskable)."""
    s = MASTER
    img = Image.new("RGB", (s, s), EMBER)
    d = ImageDraw.Draw(img)

    # soft track lanes in the corner for depth
    if lanes:
        for r in (1500, 1180, 860):
            d.ellipse((s - r, s - r, s + r, s + r), outline=DEEP, width=34)

    # glyph
    text = "21.1"
    size = 400
    font = ImageFont.truetype(FONT, size)
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    # scale the font so the text spans ~74% of the artwork width
    size = int(size * (s * 0.74 * scale) / (r - l))
    font = ImageFont.truetype(FONT, size)
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    gw, gh = r - l, b - t
    bar_h = int(s * 0.07 * scale)
    gap = int(s * 0.07 * scale)
    block_h = gh + gap + bar_h
    x = (s - gw) // 2 - l
    y = (s - block_h) // 2 - t
    d.text((x, y), text, font=font, fill=PAPER)

    # finish-line bar
    bar_w = int(gw * 0.6)
    bx0 = (s - bar_w) // 2
    by0 = y + t + gh + gap
    d.rounded_rectangle((bx0, by0, bx0 + bar_w, by0 + bar_h), radius=bar_h // 2, fill=SUN)
    return img


full = master(1.0)
small = master(1.0, lanes=False)
safe = master(0.78)  # maskable: keep everything inside the central safe zone

outputs = {
    "public/icons/icon-512.png": (full, 512),
    "public/icons/icon-192.png": (full, 192),
    "public/icons/apple-touch-icon.png": (full, 180),
    "public/icons/icon-maskable-512.png": (safe, 512),
    "public/icons/favicon-32.png": (small, 32),
    "public/icons/favicon-48.png": (small, 48),
}
for path, (img, size) in outputs.items():
    img.resize((size, size), Image.LANCZOS).save(path)

small.resize((256, 256), Image.LANCZOS).save("public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("icons written")
