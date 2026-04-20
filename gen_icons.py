from PIL import Image, ImageDraw
import os

os.makedirs('icons', exist_ok=True)

def make_icon(size):
    img = Image.new('RGB', (size, size), '#1D9E75')
    d = ImageDraw.Draw(img)
    m = size // 8
    cx, cy = size // 2, size // 2
    r = size // 3
    d.ellipse([cx-r, cy-r, cx+r, cy+r], outline='white', width=max(2, size//32))
    stem = size // 5
    d.line([cx, cy+r, cx, cy+r+stem], fill='white', width=max(2, size//32))
    d.line([cx-size//8, cy+r+stem//2, cx+size//8, cy+r+stem//2], fill='white', width=max(2, size//32))
    img.save(f'icons/icon-{size}.png')
    print(f'icons/icon-{size}.png créé')

make_icon(192)
make_icon(512)
