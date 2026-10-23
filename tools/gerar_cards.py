#!/usr/bin/env python3
"""Imagens de card 240px de largura (WebP q72) para o grid da home: img/*.webp → img/card/*.webp
O srcset do index usa 240w (card) e 480w (original) para telas 2×. Uso: python3 tools/gerar_cards.py"""
from PIL import Image
import pathlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent)
out = root / 'img' / 'card'; out.mkdir(exist_ok=True)
n = 0
for f in sorted((root / 'img').glob('*.webp')):
    d = out / f.name
    if d.exists() and d.stat().st_mtime >= f.stat().st_mtime: continue
    im = Image.open(f).convert('RGB'); w, h = im.size
    im.resize((240, round(h * 240 / w)), Image.LANCZOS).save(d, 'WEBP', quality=72, method=6)
    n += 1
print(f'{n} imagens de card novas em img/card/')
