#!/usr/bin/env python3
"""Gera data/personagens.json e js/dados-embed.js a partir das fichas *.html (fonte única de verdade = HTML).
Uso: python3 tools/gerar_dados.py  (na pasta do site)"""
import re, json, sys, pathlib, html
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent)
out = []
strip = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s)).strip()
def rank(txt):
    m = re.findall(r"(\d+)º", txt or "")
    return (int(m[0]), int(m[-1])) if m else (None, None)
for f in sorted(root.glob("*.html")):
    if f.name in ("index.html", "historia.html", "duelo.html", "quiz.html", "egoista.html", "copa.html"): continue
    t = f.read_text(encoding="utf-8")
    dl = {strip(k): strip(v) for k, v in re.findall(r"<dt>(.*?)</dt><dd>(.*?)</dd>", t, re.S)}
    ini, fim = rank(dl.get("Ranking Blue Lock"))
    fases = []
    ol = re.search(r'<ol class="phases">(.*?)</ol>', t, re.S)
    for li in re.findall(r"<li>(.*?)</li>", ol[1] if ol else "", re.S):
        fase = strip(re.search(r"<b>(.*?)</b>", li)[1])
        num = re.search(r"<span>nº\s*([^<]+)</span>", li)
        meio = strip(re.sub(r"<b>.*?</b>|<span>.*?</span>", "", li)).strip("→ ").strip()
        papel = re.search(r"\((titular|reserva|goleiro titular|adversário|base[^)]*)\)", meio)
        times = []
        tec = re.match(r"Técnico d[oa] (.+)", meio)
        if tec: meio_t, papel = tec[1], ("técnico",) * 2   # Ego: técnico do time
        else: meio_t = meio
        for p in re.split(r"\s*(?:→|/|·)\s*", re.sub(r"\([^)]*\)", "", meio_t)):
            p = p.strip()
            if not p: continue
            if p in ("Red", "White"): p = "Time " + p          # "Time White / Red"
            times.append(p)
        for fase in (["1ª Seleção", "2ª Seleção", "3ª Seleção"] if fase == "1ª–3ª Seleção" else [fase]):
          fases.append({"fase": fase, "time": meio, "times": times,
                      "papel": papel[1] if papel else None,
                      "numero": num[1].strip() if num and num[1].strip() != "—" else None})
    img = re.search(r'<img src="([^"]+)"', t)[1]
    out.append({
        "id": f.stem, "nome": strip(re.search(r"<h1>(.*?)</h1>", t)[1]),
        "url": f.name, "img": img,
        "thumb": ("img/thumb/" + img.split("/")[-1]) if (root / "img" / "thumb" / img.split("/")[-1]).exists() else None,
        "resumo": strip(re.search(r'<p class="desc">(.*?)</p>', t, re.S)[1]),
        "posicao": dl.get("Posição"), "posicoes": [p.strip() for p in re.split(r"[;,/]", dl.get("Posição", "")) if p.strip()],
        "armas": [a.strip() for a in re.split(r",", dl.get("Arma", "")) if a.strip()],
        "rankingTexto": dl.get("Ranking Blue Lock"), "rankingInicio": ini, "rankingFinal": fim,
        "inicioOficial": "(início)" in (dl.get("Ranking Blue Lock") or ""),
        "fases": fases,
        "categoria": (re.search(r'<meta name="bl-categoria" content="([^"]+)"', t) or [None, None])[1],
        "jogador": bool(re.search(r'<meta name="bl-jogador" content="1"', t)),
        "fonte": (re.search(r'class="src">Fonte: <a href="([^"]+)"', t) or [None, None])[1],
        "ordem": None,
    })
ordem = re.findall(r'<a class="card" href="([^"]+)\.html"', (root / "index.html").read_text(encoding="utf-8"))
pos = {k: i for i, k in enumerate(ordem)}
out.sort(key=lambda p: pos.get(p["id"], 9999))
for p in out: p["ordem"] = pos.get(p["id"])
txt = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
(root / "data").mkdir(exist_ok=True)
(root / "data" / "personagens.json").write_text(txt, encoding="utf-8")
(root / "js" / "dados-embed.js").write_text("/* gerado por tools/gerar_dados.py — não editar */\nwindow.BL_DATA=" + txt + ";\n", encoding="utf-8")
print(f"{len(out)} personagens → data/personagens.json + js/dados-embed.js ({len(txt)} bytes)")
