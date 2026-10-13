"""Generate the PWA / favicon icons (run once; the PNGs and .ico are committed). Needs Pillow.

Design: ember square, a bold white "SW" over a smaller "Half" (both set to the same width) in Outfit, and a sun-coloured finish-line bar.
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

    # two lines, both scaled to exactly the same width so the edges line up
    width = int(s * 0.70 * scale)

    def fit(text):
        probe = ImageFont.truetype(FONT, 400)
        l, t, r, bt = d.textbbox((0, 0), text, font=probe)
        size = int(400 * width / (r - l))
        font = ImageFont.truetype(FONT, size)
        l, t, r, bt = d.textbbox((0, 0), text, font=font)
        # nudge size until the ink width matches exactly
        while r - l > width:
            size -= 1
            font = ImageFont.truetype(FONT, size)
            l, t, r, bt = d.textbbox((0, 0), text, font=font)
        return font, (l, t, r, bt)

    f1, b1 = fit("SW")
    f2, b2 = fit("Half")
    h1, h2 = b1[3] - b1[1], b2[3] - b2[1]
    line_gap = int(s * 0.045 * scale)
    bar_h = int(s * 0.05 * scale)
    bar_gap = int(s * 0.06 * scale)
    block_h = h1 + line_gap + h2 + bar_gap + bar_h
    top = (s - block_h) // 2
    x0 = (s - width) // 2
    d.text((x0 - b1[0], top - b1[1]), "SW", font=f1, fill=PAPER)
    y2 = top + h1 + line_gap
    d.text((x0 - b2[0], y2 - b2[1]), "Half", font=f2, fill=PAPER)

    # finish-line bar
    bar_w = int(width * 0.45)
    by0 = y2 + h2 + bar_gap
    d.rounded_rectangle(((s - bar_w) // 2, by0, (s + bar_w) // 2, by0 + bar_h), radius=bar_h // 2, fill=SUN)
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
