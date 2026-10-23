#!/usr/bin/env python3
"""Arquivos "só acrescenta no fim" (estáveis entre regenerações):
- js/desafio-calendario.js  window.BL_DESAFIO = {inicio, ids}: calendário do "Quem é o egoísta?" (permutação do pool, novos entram no fim)
- js/ordem.js               window.BL_ORDEM = [ids]: ordem fixa usada nos códigos do Álbum
- js/versao.js              window.BL_VERSAO: versão dos dados + motor (links com semente levam &v=)
Uso: python3 tools/gerar_calendario.py (na pasta do site)"""
import json, random, pathlib, hashlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent)
D = json.loads((root / 'data/personagens.json').read_text(encoding='utf-8'))
def fase(p, n):
    f = next((f for f in p['fases'] if f['fase'] == n), None)
    return f['times'][0] if f and f['times'] else None
pool = sorted([p['id'] for p in D if p['jogador'] and p['posicoes'] and (p['rankingFinal'] or fase(p, 'Neo Egoist League') or fase(p, '1ª Seleção'))])
def fnv(s):
    h = 2166136261
    for c in s.encode('utf-16-le')[::2] if False else s:
        h ^= ord(c); h = (h * 16777619) & 0xffffffff
    return h
cf = root / 'tools/calendario.json'
cal = json.loads(cf.read_text()) if cf.exists() else {'inicio': '2026-10-23', 'ids': []}
if not cal['ids']:
    # dias 1 e 2 iguais aos do sorteio antigo (já jogados/vistos): Erik Gesner, Ikki Niko
    for d in ('2026-10-23', '2026-10-24'):
        i = pool[fnv('bl-' + d) % len(pool)]
        if i not in cal['ids']: cal['ids'].append(i)
novos = [i for i in pool if i not in cal['ids']]
random.Random(len(cal['ids'])).shuffle(novos)
cal['ids'] += novos
# P2-6: o calendário nunca acaba — garante 1 ano à frente acrescentando novos ciclos embaralhados do pool (só no fim)
import datetime
hoje_n = (datetime.date.today() - datetime.date.fromisoformat(cal['inicio'])).days + 1
while len(cal['ids']) < hoje_n + 365:
    ciclo = pool[:]; random.Random('ciclo-%d' % len(cal['ids'])).shuffle(ciclo)
    if ciclo[0] == cal['ids'][-1]: ciclo.append(ciclo.pop(0))
    cal['ids'] += ciclo
if len(cal['ids']) - hoje_n < 30: print('AVISO: menos de 30 dias no calendário do desafio', file=sys.stderr)
cf.write_text(json.dumps(cal, ensure_ascii=False))
(root / 'js/desafio-calendario.js').write_text('/* gerado por tools/gerar_calendario.py — só acrescenta no fim */\nwindow.BL_DESAFIO=' + json.dumps(cal, ensure_ascii=False) + ';\n', encoding='utf-8')
of = root / 'tools/ordem.json'
ordem = json.loads(of.read_text()) if of.exists() else []
ordem += [p['id'] for p in sorted(D, key=lambda p: p['id']) if p['id'] not in ordem]
of.write_text(json.dumps(ordem))
(root / 'js/ordem.js').write_text('/* gerado — só acrescenta no fim */\nwindow.BL_ORDEM=' + json.dumps(ordem) + ';\n', encoding='utf-8')
h = hashlib.md5((root / 'data/personagens.json').read_bytes() + (root / 'js/x1-motor.js').read_bytes()).hexdigest()[:6]
(root / 'js/versao.js').write_text(f"/* gerado — muda quando dados ou motor mudam */\nwindow.BL_VERSAO='{h}';\n", encoding='utf-8')
print(f'calendário: {len(cal["ids"])} dias · ordem: {len(ordem)} · versão {h} · dia1 {cal["ids"][0]} dia2 {cal["ids"][1]}')
