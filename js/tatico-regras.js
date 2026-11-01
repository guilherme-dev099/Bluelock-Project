/* Campo do Ego — regras puras do jogo tático por turnos (sem DOM). window.BL_TAT / module.exports.
   Estado → ações possíveis → novo estado. RNG semeado (mulberry32) guardado no estado: mesma semente + mesmas escolhas = mesma partida.
   Habilidades derivadas das Armas das fichas são interpretação do site, não regras da obra. */
(function (raiz) {
  'use strict';
  var W = 12, H = 8, GOL = [3, 4];
  function rng(st) { var a = (st.r = (st.r + 0x6D2B79F5) >>> 0); var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var HAB = [ /* [chave, regex nas Armas, rótulo] */
    ['meta', /metavis|vis[aã]o espacial|spatial|vis[aã]o de jogo|leitura/i, 'Visão de jogo: passes +10% e mais longos'],
    ['vel', /velocidade|speed|acelera|corrida|sprint/i, 'Velocidade: anda 2 casas'],
    ['chute', /direct shot|chute|finaliza|shot|voleio|tiro/i, 'Chute: finaliza de mais longe'],
    ['drible', /drible|dribl|finta|gingado/i, 'Drible: +12% para driblar'],
    ['fisico', /f[ií]sic|for[cç]a|corpo|muralha|defesa/i, 'Físico: resiste a desarmes']
  ];
  function habilidades(p) { var a = (p.armas || []).join(' | '), out = []; HAB.forEach(function (h) { if (h[1].test(a)) out.push(h[0]); }); return out; }
  function rotHab(k) { for (var i = 0; i < HAB.length; i++) if (HAB[i][0] === k) return HAB[i][2]; return k; }
  var FORM = [[4, 1], [4, 6], [3, 3], [2, 5], [5, 4]]; /* casas iniciais do time 0 (ataca para a direita) */
  function inicial(lado, k) { var f = FORM[k]; return lado ? [W - 1 - f[0], H - 1 - f[1]] : [f[0], f[1]]; }
  function novo(A, B, semente, attr) {
    var st = { r: hash(semente || 'campo'), t: 0, max: 24, placar: [0, 0], flow: [0, 0], flowOn: [false, false], posse: 0, bola: 4, fim: false, log: [], postura: 'marcar', ult: null };
    st.J = [A, B].map(function (time, lado) { return time.map(function (p, k) { var c = inicial(lado, k), s = attr(p); return { id: p.id, nome: p.nome, curto: p.curto || p.nome, x: c[0], y: c[1], s: { chu: s.chu, vel: s.vel, fis: s.fis, dri: s.dri, def: s.def, lei: Math.round((s.ego + s.def) / 2) }, hab: habilidades(p), batido: 0 }; }); });
    st.posse = rng(st) < 0.5 ? 0 : 1; st.bola = 4; recomecar(st, st.posse);
    st.log.push('Começa a partida. Bola com ' + nomeTime(st.posse) + '.');
    return st;
  }
  function nomeTime(l) { return l ? 'o rival' : 'o seu time'; }
  function recomecar(st, lado) { st.J.forEach(function (t, l) { t.forEach(function (j, k) { var c = inicial(l, k); j.x = c[0]; j.y = c[1]; j.batido = 0; }); }); st.posse = lado; st.bola = 4; var j = st.J[lado][4]; j.x = lado ? 6 : 5; j.y = lado ? 3 : 4; }
  function dir(l) { return l ? -1 : 1; }
  function golX(l) { return l ? -1 : W; }
  function ocupada(st, x, y) { for (var l = 0; l < 2; l++) for (var k = 0; k < 5; k++) { var j = st.J[l][k]; if (j.x === x && j.y === y) return [l, k]; } return null; }
  function dist(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
  function distGol(j, l) { var gx = golX(l), gy = j.y < GOL[0] ? GOL[0] : j.y > GOL[1] ? GOL[1] : j.y; return Math.max(Math.abs(gx - j.x), Math.abs(gy - j.y)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function bonusFlow(st, l) { return st.flowOn[l] ? 0.15 : 0; }
  function noCaminho(st, l, a, b) { /* defensores perto do segmento a→b */
    var n = 0; st.J[1 - l].forEach(function (d) {
      var dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1, t = clamp(((d.x - a.x) * dx + (d.y - a.y) * dy) / L, 0, 1);
      var px = a.x + t * dx, py = a.y + t * dy; if (Math.hypot(d.x - px, d.y - py) < 0.9 && t > 0.05 && t < 0.95) n++;
    }); return n;
  }
  function chancePasse(st, l, i, k) {
    var a = st.J[l][i], b = st.J[l][k], d = Math.hypot(a.x - b.x, a.y - b.y), meta = a.hab.indexOf('meta') >= 0;
    if (d > (meta ? 8 : 6)) return 0;
    return clamp(0.92 - 0.045 * d - 0.2 * noCaminho(st, l, a, b) + (a.s.lei - 75) / 300 + (meta ? 0.1 : 0) + bonusFlow(st, l), 0.1, 0.95);
  }
  function chanceChute(st, l, i) {
    var a = st.J[l][i], dg = distGol(a, l), alc = a.hab.indexOf('chute') >= 0 ? 5 : 3;
    if (dg > alc) return 0;
    var bloq = st.J[1 - l].filter(function (d) { return dist(d, a) <= 1; }).length;
    return clamp(0.6 - 0.11 * (dg - 1) + (a.s.chu - 75) / 140 - 0.1 * bloq - (l === 1 && st.postura === 'recuar' ? 0.1 : 0) + bonusFlow(st, l), 0.04, 0.85);
  }
  function rivalAFrente(st, l, i) { var a = st.J[l][i], d = dir(l); return st.J[1 - l].map(function (x, k) { return [x, k]; }).filter(function (o) { var x = o[0]; return !x.batido && (x.x - a.x) * d >= 0 && dist(x, a) === 1; }); }
  function chanceDrible(st, l, i, k) { var a = st.J[l][i], d = st.J[1 - l][k]; return clamp(0.5 + (a.s.dri - d.s.def) / 140 + (a.hab.indexOf('drible') >= 0 ? 0.12 : 0) + bonusFlow(st, l), 0.12, 0.88); }
  function alcance(j) { return j.hab.indexOf('vel') >= 0 || j.s.vel >= 88 ? 2 : 1; }
  function casasMover(st, l, i) {
    var a = st.J[l][i], r = alcance(a), out = [];
    for (var x = a.x - r; x <= a.x + r; x++) for (var y = a.y - r; y <= a.y + r; y++) { if (x < 0 || y < 0 || x >= W || y >= H || (x === a.x && y === a.y) || ocupada(st, x, y)) continue; out.push([x, y]); }
    return out;
  }
  function acoes(st) {
    if (st.fim) return [];
    var l = st.posse, i = st.bola, out = [];
    var ch = chanceChute(st, l, i); if (ch) out.push({ t: 'chutar', p: ch });
    rivalAFrente(st, l, i).forEach(function (o) { out.push({ t: 'driblar', k: o[1], p: chanceDrible(st, l, i, o[1]) }); });
    st.J[l].forEach(function (j, k) { if (k === i) return; var p = chancePasse(st, l, i, k); if (p) out.push({ t: 'passar', k: k, p: p }); });
    casasMover(st, l, i).forEach(function (c) { out.push({ t: 'mover', x: c[0], y: c[1], p: 1 }); });
    return out;
  }
  function flow(st, l, n) { if (st.flowOn[l]) return; st.flow[l] = Math.min(100, st.flow[l] + n); if (st.flow[l] >= 100) { st.flowOn[l] = true; st.log.push('⚡ ' + (l ? 'O rival' : 'Seu time') + ' entra no Flow: +15% na próxima ação.'); } }
  function gastarFlow(st, l) { if (st.flowOn[l]) { st.flowOn[l] = false; st.flow[l] = 0; } }
  function perder(st, l, k, txt) { st.posse = 1 - l; st.bola = k; st.log.push(txt); }
  function aplicar(st, a) {
    if (st.fim) return st;
    var l = st.posse, i = st.bola, j = st.J[l][i], R = rng(st), msg; st.ult = { t: a.t, l: l };
    var usouFlow = st.flowOn[l];
    if (a.t === 'mover') { j.x = a.x; j.y = a.y; msg = j.curto + ' conduz a bola.'; st.log.push(msg); flow(st, l, 5); }
    else if (a.t === 'passar') {
      var p = chancePasse(st, l, i, a.k), alvo = st.J[l][a.k];
      if (R < p) { st.bola = a.k; st.log.push(j.curto + ' passa para ' + alvo.curto + ' (' + Math.round(p * 100) + '%).'); }
      else { var k2 = maisPerto(st, 1 - l, alvo); perder(st, l, k2, 'Passe de ' + j.curto + ' interceptado por ' + st.J[1 - l][k2].curto + '.'); }
    } else if (a.t === 'driblar') {
      var p2 = chanceDrible(st, l, i, a.k), d = st.J[1 - l][a.k];
      if (R < p2) {
        var nx = clamp(j.x + 2 * dir(l), 0, W - 1), ny = j.y; if (ocupada(st, nx, ny)) nx = clamp(j.x + dir(l), 0, W - 1); if (ocupada(st, nx, ny)) nx = j.x;
        j.x = nx; d.batido = 2; st.log.push(j.curto + ' dribla ' + d.curto + '! (' + Math.round(p2 * 100) + '%)'); flow(st, l, 30);
      } else perder(st, l, a.k, d.curto + ' desarma ' + j.curto + '.');
    } else if (a.t === 'chutar') {
      var p3 = chanceChute(st, l, i);
      if (R < p3) { st.placar[l]++; st.log.push('⚽ GOL de ' + j.curto + '! (' + Math.round(p3 * 100) + '%) ' + st.placar[0] + ' × ' + st.placar[1]); flow(st, l, 20); recomecar(st, 1 - l); }
      else { st.log.push(j.curto + ' chuta e o goleiro defende (' + Math.round(p3 * 100) + '%).'); flow(st, l, 10); var k3 = maisPerto(st, 1 - l, { x: l ? 0 : W - 1, y: 3.5 }); perder(st, l, k3, 'Bola com ' + st.J[1 - l][k3].curto + '.'); }
    }
    if (usouFlow) gastarFlow(st, l);
    if (st.posse === l && a.t !== 'chutar') movimento(st);
    st.J.forEach(function (t) { t.forEach(function (x) { if (x.batido) x.batido--; }); });
    st.t++; if (st.t >= st.max) { st.fim = true; st.log.push('Fim de jogo: ' + st.placar[0] + ' × ' + st.placar[1] + '.'); }
    return st;
  }
  function maisPerto(st, l, alvo) { var m = 0, md = 1e9; st.J[l].forEach(function (j, k) { var d = Math.hypot(j.x - alvo.x, j.y - alvo.y); if (d < md) { md = d; m = k; } }); return m; }
  function passo(st, j, tx, ty) { var nx = j.x + Math.sign(tx - j.x), ny = j.y + Math.sign(ty - j.y); if (!ocupada(st, nx, ny)) { j.x = nx; j.y = ny; return; } if (!ocupada(st, nx, j.y)) j.x = nx; else if (!ocupada(st, j.x, ny)) j.y = ny; }
  function movimento(st) {
    var l = st.posse, c = st.J[l][st.bola], df = 1 - l, pres = df === 0 ? st.postura : 'marcar';
    /* ataque: companheiros sobem uma casa e abrem espaço */
    st.J[l].forEach(function (j, k) { if (k === st.bola) return; var tx = clamp(c.x + dir(l) * (k % 2 ? 2 : 1), 0, W - 1), ty = clamp(FORM[k][1] + (k === 2 ? 0 : 0), 0, H - 1); if (l) ty = H - 1 - ty; passo(st, j, tx, ty); });
    /* defesa: o mais perto pressiona, os outros marcam ou recuam */
    var kp = maisPerto(st, df, c), livres = st.J[l].filter(function (x, k) { return k !== st.bola; });
    st.J[df].forEach(function (d, k) {
      if (d.batido) return;
      if (k === kp) { passo(st, d, c.x, c.y); if (pres === 'pressionar' && dist(d, c) > 1) passo(st, d, c.x, c.y); return; }
      if (pres === 'recuar') { passo(st, d, df ? W - 2 : 1, clamp(d.y, 2, 5)); return; }
      var m = livres[k % livres.length]; passo(st, d, m.x - dir(l), m.y);
    });
    /* desarme do pressionador */
    var d = st.J[df][kp];
    if (!d.batido && dist(d, c) === 1) {
      var p = clamp(0.16 + (d.s.def - c.s.dri) / 250 - (c.hab.indexOf('fisico') >= 0 ? 0.08 : 0) + (pres === 'pressionar' ? 0.1 : 0), 0.05, 0.45);
      if (rng(st) < p) perder(st, l, kp, d.curto + ' rouba a bola de ' + c.curto + ' na pressão.');
    }
  }
  /* IA 1-ply: valor esperado de cada ação */
  function valorPos(st, l, j) { return 1 / (1 + distGol(j, l)); }
  function ia(st) {
    var l = st.posse, c = st.J[l][st.bola], melhor = null, mv = -1;
    acoes(st).forEach(function (a) {
      var v;
      if (a.t === 'chutar') v = a.p * 1.1;
      else if (a.t === 'passar') v = a.p * valorPos(st, l, st.J[l][a.k]) * 0.9;
      else if (a.t === 'driblar') v = a.p * valorPos(st, l, { x: c.x + 2 * dir(l), y: c.y }) * 0.95;
      else v = valorPos(st, l, { x: a.x, y: a.y }) * (0.85 - 0.1 * st.J[1 - l].filter(function (d) { return Math.max(Math.abs(d.x - a.x), Math.abs(d.y - a.y)) <= 1; }).length);
      v += rng(st) * 0.02;
      if (v > mv) { mv = v; melhor = a; }
    });
    return melhor;
  }
  var API = { W: W, H: H, GOL: GOL, novo: novo, acoes: acoes, aplicar: aplicar, ia: ia, habilidades: habilidades, rotHab: rotHab, ocupada: ocupada, casasMover: casasMover };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else raiz.BL_TAT = API;
})(this);
