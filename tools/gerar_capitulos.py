# Modo Mangá · elo após /workspace/ideias/build.py. Idempotente.
# Fontes: /workspace/manga/capitulos/*.json, manga.css, leitor.js  → ler.html, cap-NN.html, js/leitor.js, style.css
import os, re, glob, html, json, shutil, subprocess
SRC = '/workspace/manga'
os.chdir('/workspace/bluelock-site')
SITE = 'https://guilherme-dev099.github.io/Bluelock-Project/'
E = lambda t: html.escape(str(t), quote=True)
P = {p['id']: p for p in json.load(open('data/personagens.json'))}
caps = [json.load(open(f)) for f in sorted(glob.glob(SRC + '/capitulos/cap-*.json'))]
os.makedirs('tools/capitulos', exist_ok=True)
for f in glob.glob(SRC + '/capitulos/*.json'): shutil.copy(f, 'tools/capitulos/')
shutil.copy(SRC + '/build.py', 'tools/gerar_capitulos.py')
shutil.copy(SRC + '/leitor.js', 'js/leitor.js')

base = open('jogos.html').read()
def pagina(fn, titulo, desc, corpo, extra_js=True):
    s = re.sub(r'<title>.*?</title>', f'<title>{E(titulo)} | Blue Lock</title>', base, count=1)
    s = re.sub(r'(<meta (?:name="description"|property="og:description") content=")[^"]*', lambda m: m.group(1) + E(desc), s)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + E(titulo) + ' | Blue Lock', s)
    s = re.sub(r'(<meta property="og:image:alt" content=")[^"]*|(<meta name="twitter:image:alt" content=")[^"]*', lambda m: (m.group(1) or m.group(2)) + E(titulo) + ' — fã-site Blue Lock', s)
    s = s.replace(SITE + 'jogos.html', SITE + fn)
    s = re.sub(r'<script type="application/ld\+json">.*?</script>', '', s, count=1, flags=re.S)
    s = s.replace(' aria-current="page"', '').replace(' aria-current="true"', '')
    s = re.sub(r'<main id="conteudo" tabindex="-1">.*</main>', lambda m: '<main id="conteudo" tabindex="-1">' + corpo + '</main>', s, count=1, flags=re.S)
    if extra_js: s = s.replace('</body>', '<script src="js/leitor.js" defer></script></body>')
    open(fn, 'w').write(s)

def nome(i): return P[i]['nome']
def curto(i): n = P[i]['nome'].split(); return n[-1] if i not in ('ego',) else 'Ego'
def quadro(q, k):
    cls = ['mg-q', f'q{k}'] + (['tom-' + q['tom']] if q.get('tom') else []) + (['com-linhas'] if q.get('linhas') else []) + ([] if q.get('p') else ['sem-arte'])
    out = [f'<figure class="{" ".join(cls)}">']
    ps = q.get('p', [])
    if ps:
        out.append(f'<div class="mg-arte n{len(ps)}" aria-hidden="true">' + ''.join(f'<img src="{E(P[i]["img"])}" alt="" loading="lazy" decoding="async" width="480" height="552">' for i in ps) + '</div>')
    if q.get('sfx'): out.append(f'<span class="mg-sfx" aria-hidden="true">{E(q["sfx"])}</span>')
    cap = []
    if q.get('narr'): cap.append(f'<p class="mg-narr">{E(q["narr"])}</p>')
    for f in q.get('fala', []):
        pens = len(f) > 2 and f[2]
        cap.append(f'<p class="balao{" pensa" if pens else ""}"><span class="mg-quem">{E(f[0])}{" (pensando)" if pens else ""}: </span>{E(f[1])}</p>')
    if not cap and ps: cap.append(f'<p class="mg-narr mg-so">{E(" e ".join(nome(i) for i in ps))}.</p>')
    out.append('<figcaption>' + ''.join(cap) + '</figcaption>')
    lk = q.get('link')
    if lk: out.append(f'<a class="mg-link" href="{E(lk[0])}">{E(lk[1])} →</a>')
    elif ps: out.append(f'<a class="mg-link" href="{E(P[ps[0]]["url"])}">Ficha: {E(nome(ps[0]))} →</a>')
    out.append('</figure>')
    return ''.join(out)

N = len(caps)
for ci, c in enumerate(caps):
    for q in [q for pg in c['paginas'] for q in pg['quadros']]:
        for i in q.get('p', []): assert i in P, (c['slug'], i)
    ids = []
    for pg in c['paginas']:
        for q in pg['quadros']:
            for i in q.get('p', []):
                if i not in ids: ids.append(i)
    tot = len(c['paginas']) + 1
    pags = []
    for pi, pg in enumerate(c['paginas']):
        pags.append(f'<section class="mg-pag" data-layout="{pg["layout"]}" aria-label="Página {pi+1} de {tot}"><div class="mg-grade">'
                    + ''.join(quadro(q, k + 1) for k, q in enumerate(pg['quadros'])) + f'</div><p class="mg-folio" aria-hidden="true">{pi+1}</p></section>')
    cards = ''.join(f'<li><a class="mg-card" href="{E(P[i]["url"])}"><img src="{E(P[i]["thumb"])}" alt="" width="112" height="112" loading="lazy"><span>{E(nome(i))}</span></a></li>' for i in ids)
    jog = ''.join(f'<li><a class="btn" href="{E(h)}">{E(t)}</a></li>' for h, t in c['jogar'])
    prox = caps[ci + 1] if ci + 1 < N else None
    ant = caps[ci - 1] if ci else None
    fim = (f'<section class="mg-pag mg-fim" aria-label="Página {tot} de {tot}: fim do capítulo"><h2 class="mg-fim-t">Fim do capítulo {c["n"]}</h2>'
           f'<h3>Personagens deste arco</h3><ul class="mg-cards">{cards}</ul><h3>Jogue este arco</h3><ul class="mg-jogar">{jog}</ul>'
           + (f'<p><a class="btn mg-prox" href="{prox["slug"]}.html" data-cap="{prox["slug"]}">Capítulo {prox["n"]}: {E(prox["titulo"])} →</a></p>' if prox else '<p class="mg-nota">Fim do volume, por enquanto. Os próximos capítulos chegam em breve.</p>')
           + '</section>')
    gate = ('<div class="mg-gate" hidden><p><b>Este capítulo tem spoilers da NEL</b> (depois da 3ª Seleção). Você ativou "Ocultar fases com spoiler".</p>'
            '<button type="button" class="btn mg-gate-btn">Mostrar mesmo assim</button> <a class="btn" href="ler.html">Voltar ao índice</a></div>') if c['spoiler'] else ''
    corpo = (f'<article class="mg-cap{" mg-spo" if c["spoiler"] else ""}" data-cap="{c["slug"]}" lang="pt-BR">'
             f'<nav class="trilha" aria-label="Trilha"><a href="historia.html">História</a> › <a href="ler.html">Modo Mangá</a> › Capítulo {c["n"]}</nav>'
             f'<header class="mg-cab"><p class="capitulo"><span>Vol. Ego</span><span><b>{c["n"]:02d}</b>/{N:02d}</span><span>{E(c["arco"])}</span></p>'
             f'<h1 class="duelo-h">{E(c["titulo"])}</h1><p class="duelo-sub">{E(c["resumo"])}</p>'
             '<p class="mg-aviso">Roteiro original do fã-site, resumido e com falas parafraseadas. Não é tradução do mangá. Artes: só as fotos de ficha do site, em estilo storyboard.</p></header>'
             + gate +
             '<div class="mg-ctrl" hidden><button type="button" class="btn mg-ant" aria-label="Página anterior">←</button>'
             '<p class="mg-pos" aria-live="polite"></p><button type="button" class="btn mg-seg" aria-label="Próxima página">→</button>'
             '<button type="button" class="mg-rtl" aria-pressed="false" title="Sentido japonês: da direita para a esquerda">⇆ Sentido japonês</button>'
             '<button type="button" class="mg-modo" aria-pressed="false">Ler rolando</button></div>'
             f'<div class="mg-livro">{"".join(pags)}{fim}</div>'
             '<nav class="mg-capnav" aria-label="Capítulos">'
             + (f'<a href="{ant["slug"]}.html">← Cap. {ant["n"]}: {E(ant["titulo"])}</a>' if ant else '<a href="ler.html">← Índice</a>')
             + '<a href="ler.html">Índice</a>'
             + (f'<a href="{prox["slug"]}.html">Cap. {prox["n"]}: {E(prox["titulo"])} →</a>' if prox else '<a href="historia.html">História →</a>')
             + '</nav><p class="mg-dica">Teclado: <kbd>←</kbd> <kbd>→</kbd> viram a página. No celular, deslize para os lados.</p></article>')
    pagina(c['slug'] + '.html', f'Modo Mangá · Cap. {c["n"]}: {c["titulo"]}', c['resumo'], corpo)

idx = ''.join(
    f'<li class="mg-item{" mg-spo" if c["spoiler"] else ""}" data-cap="{c["slug"]}"><a href="{c["slug"]}.html"><span class="mg-num">{c["n"]:02d}</span>'
    f'<span class="mg-it"><b>{E(c["titulo"])}</b><span>{E(c["arco"])}{" · contém spoiler" if c["spoiler"] else ""}</span><span class="mg-res">{E(c["resumo"])}</span></span>'
    '<span class="mg-lido" hidden>Lido ✓</span></a></li>' for c in caps)
nq = sum(len(pg['quadros']) for c in caps for pg in c['paginas'])
capa = ('<div class="hub mg-indice"><nav class="trilha" aria-label="Trilha"><a href="historia.html">História</a> › Modo Mangá</nav>'
        '<div class="mg-capa"><p class="mg-capa-vol" aria-hidden="true">VOL.</p><h1 class="mg-capa-t">Leia o <span>Blue Lock</span></h1><p class="mg-capa-ego" aria-hidden="true">EGO</p>'
        f'<p class="duelo-sub">A história do Blue Lock em {N} capítulos e {nq} quadros de storyboard, do convite até a NEL. Cada quadro leva à ficha, ao duelo ou ao jogo daquele momento.</p>'
        '<p><a class="btn mg-continuar" href="cap-01.html">Começar a ler</a></p><p class="mg-prog" aria-live="polite"></p></div>'
        f'<h2 class="hub-sec">Capítulos</h2><ol class="mg-lista">{idx}</ol>'
        '<p class="mg-aviso">Roteiro original e resumido do fã-site, com falas parafraseadas, não é tradução oficial. O capítulo da NEL respeita o botão "Ocultar fases com spoiler" da História.</p></div>')
pagina('ler.html', 'Modo Mangá: leia o Blue Lock', f'A história de Blue Lock em {N} capítulos de storyboard: quadros, balões e onomatopeias, com links para fichas e jogos.', capa)

# ---- ligações no site
LI = '<li><a href="ler.html"><span aria-hidden="true">📖</span> Modo Mangá</a></li>'
for f in sorted(glob.glob('*.html')):
    s = open(f).read(); o = s
    if 'href="ler.html"><span' not in s:
        s = re.sub(r'(<li><a href="historia.html"[^>]*><span aria-hidden="true">📜</span> História &amp; Times</a></li>|<li><a href="historia.html"[^>]*><span aria-hidden="true">📜</span> História & Times</a></li>)', lambda m: m.group(1) + LI, s, count=1)
    if 'href="ler.html">Modo Mangá</a>' not in s and '</footer>' in s:
        s = s.replace('</footer>', ' · <a href="ler.html">Modo Mangá</a></footer>', 1)
    if f == 'jogos.html' and 'hub-card" href="ler.html"' not in s:
        s = s.replace('<li><a class="hub-card" href="graus.html">', '<li><a class="hub-card" href="ler.html"><span class="hub-e" aria-hidden="true">📖</span><b>Modo Mangá</b><span>A história em quadros de storyboard, capítulo a capítulo.</span></a></li><li><a class="hub-card" href="graus.html">', 1)
    if f == 'historia.html' and 'mg-chamada' not in s:
        s = re.sub(r'(<h1[^>]*>.*?</h1>)', lambda m: m.group(1) + '<p class="mg-chamada"><a class="btn" href="ler.html">📖 Ler em modo mangá</a></p>', s, count=1, flags=re.S)
    if s != o: open(f, 'w').write(s)

css = open('style.css').read()
css = re.sub(r'\n?/\* manga:inicio \*/.*?/\* manga:fim \*/\n?', '', css, flags=re.S)
css += '\n/* manga:inicio */\n' + open(SRC + '/manga.css').read() + '\n/* manga:fim */\n'
open('style.css', 'w').write(css)
if os.path.exists('tools/gerar_sitemap.py'): subprocess.run(['python3', 'tools/gerar_sitemap.py'], check=True)
print('manga:', N, 'capítulos,', nq, 'quadros')
