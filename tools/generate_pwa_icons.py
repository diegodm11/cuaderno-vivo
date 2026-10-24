from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def make_icon(size: int, filename: str, maskable: bool = False) -> None:
    image = Image.new("RGB", (size, size), "#102a2d" if maskable else "#f4f7f6")
    draw = ImageDraw.Draw(image)
    margin = int(size * (0.20 if maskable else 0.10))
    radius = int(size * 0.18)
    draw.rounded_rectangle((margin, margin, size - margin, size - margin), radius=radius, fill="#18b8aa")
    font = ImageFont.truetype(FONT, int(size * 0.30))
    text = "CV"
    box = draw.textbbox((0, 0), text, font=font)
    x = (size - (box[2] - box[0])) / 2
    y = (size - (box[3] - box[1])) / 2 - box[1]
    draw.text((x, y), text, font=font, fill="white")
    image.save(OUT / filename, optimize=True)


make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(512, "maskable-512.png", maskable=True)
make_icon(180, "apple-touch-icon.png")
print(f"Iconos PWA creados en {OUT}")
