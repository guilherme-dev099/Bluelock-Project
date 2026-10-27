# Gera sitemap.xml com todas as páginas públicas (exceto 404). Uso: python3 tools/gerar_sitemap.py (na raiz do site)
import glob, os, datetime
BASE = 'https://guilherme-dev099.github.io/Bluelock-Project/'
hoje = datetime.date.today().isoformat()
fs = sorted(f for f in glob.glob('*.html') if f != '404.html')
fs.sort(key=lambda f: (f != 'index.html', f))
pri = {'index.html': '1.0', 'duelo.html': '0.9', 'jogos.html': '0.9', 'historia.html': '0.8'}
linhas = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for f in fs:
    u = BASE + ('' if f == 'index.html' else f)
    linhas.append(f'<url><loc>{u}</loc><lastmod>{hoje}</lastmod><priority>{pri.get(f, "0.6")}</priority></url>')
linhas.append('</urlset>')
open('sitemap.xml', 'w').write('\n'.join(linhas) + '\n')
print('sitemap:', len(fs), 'urls')
