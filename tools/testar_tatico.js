// node tools/testar_tatico.js — testes das regras do Campo do Ego
const T = require('../js/tatico-regras.js'); let ok = 0, falhas = 0;
function t(n, c) { if (c) ok++; else { falhas++; console.log('FALHOU:', n); } }
const ps = n => Array.from({ length: 5 }, (_, i) => ({ id: n + i, nome: n + i, armas: i === 0 ? ['Metavision', 'velocidade'] : ['drible'] }));
const attr = () => ({ chu: 80, vel: 80, fis: 75, dri: 80, ego: 80, def: 70 });
const a = T.novo(ps('a'), ps('b'), 'x', attr), b = T.novo(ps('a'), ps('b'), 'x', attr);
t('mesma semente, mesmo início', JSON.stringify(a) === JSON.stringify(b));
t('habilidades pelas Armas', a.J[0][0].hab.join() === 'meta,vel');
t('10 peças em casas distintas', new Set(a.J.flat().map(j => j.x + ',' + j.y)).size === 10);
let s = T.novo(ps('a'), ps('b'), 'jogo', attr), n = 0;
while (!s.fim && n < 100) { const ac = T.acoes(s); t('sempre há ação', ac.length > 0); T.aplicar(s, T.ia(s)); n++;
  t('peças dentro do campo', s.J.flat().every(j => j.x >= 0 && j.x < T.W && j.y >= 0 && j.y < T.H));
  t('sem sobreposição', new Set(s.J.flat().map(j => j.x + ',' + j.y)).size === 10); }
t('termina em 24 turnos', s.fim && s.t === 24);
t('chances entre 0 e 1', T.acoes(T.novo(ps('a'), ps('b'), 'q', attr)).every(x => x.p > 0 && x.p <= 1));
let gols = 0; for (let i = 0; i < 200; i++) { let q = T.novo(ps('a'), ps('b'), 's' + i, attr); while (!q.fim) T.aplicar(q, T.ia(q)); gols += q.placar[0] + q.placar[1]; }
const media = gols / 200; t('média de gols plausível (0.5–8): ' + media.toFixed(2), media > 0.5 && media < 8);
console.log('tático:', ok, 'ok,', falhas, 'falhas · média de gols IA×IA', media.toFixed(2)); process.exit(falhas ? 1 : 0);
