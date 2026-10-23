#!/usr/bin/env python3
"""Miniaturas 112×112 (2× para avatares de 56px), recorte quadrado do topo: img/*.webp → img/thumb/*.webp
Uso: python3 tools/gerar_thumbs.py  (na pasta do site)"""
from PIL import Image
import pathlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent)
out = root / 'img' / 'thumb'; out.mkdir(exist_ok=True)
n = 0
for f in sorted((root / 'img').glob('*.webp')):
    d = out / f.name
    if d.exists() and d.stat().st_mtime >= f.stat().st_mtime: continue
    im = Image.open(f).convert('RGB'); w, h = im.size; s = min(w, h)
    im.crop(((w - s) // 2, 0, (w - s) // 2 + s, s)).resize((112, 112), Image.LANCZOS).save(d, 'WEBP', quality=72, method=6)
    n += 1
print(f'{n} miniaturas novas em img/thumb/')
