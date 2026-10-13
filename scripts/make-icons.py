"""Generate the PWA icons (run once; the PNGs are committed). Needs Pillow."""
from PIL import Image, ImageDraw

EMBER = (201, 66, 12)
PAPER = (255, 248, 241)
SUN = (245, 165, 36)


def draw(size, inset):
    s = size * 4  # supersample
    img = Image.new("RGB", (s, s), EMBER)
    d = ImageDraw.Draw(img)
    pad = int(s * inset)
    box = (pad, pad, s - pad, s - pad)
    w = int((s - 2 * pad) * 0.11)
    # a running track: stadium outline
    d.rounded_rectangle(box, radius=(s - 2 * pad) // 2, outline=PAPER, width=w)
    # finish marker
    r = int((s - 2 * pad) * 0.10)
    cx, cy = s // 2, pad + w // 2
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=SUN)
    return img.resize((size, size), Image.LANCZOS)


for name, size, inset in [
    ("icon-192.png", 192, 0.17),
    ("icon-512.png", 512, 0.17),
    ("icon-maskable-512.png", 512, 0.27),  # extra safe zone for maskable
    ("apple-touch-icon.png", 180, 0.17),
]:
    draw(size, inset).save(f"public/icons/{name}")
print("icons written")
