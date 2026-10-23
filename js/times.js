/* Times de 11 a partir das fichas: vagas por posição, química (vínculos reais), escalação automática e "série de 5 x1 setoriais".
   Compartilhado pela Prancheta do Ego e pela Liga NEL simulada. Depende de js/vinculos.js e js/x1-motor.js. */
(function () {
  'use strict';
  var BL = window.BL; if (!BL) return;
  var VAGA = { GOL: /^goleiro|^keeper/, ZAG: /^(zagueiro|defensor|center back|centre back)/, LAT: /^(lateral|ala\b|right side back|left side back|side back|wing back)/, VOL: /^volante/, MEI: /^meia/, PON: /^ponta|^winger/, ATA: /^(atacante|centroavante|striker|forward)/ };
  var NOME = { GOL: 'goleiro', ZAG: 'zagueiro', LAT: 'lateral', VOL: 'volante', MEI: 'meia', PON: 'ponta', ATA: 'atacante' };
  var FORM = {
    '433': { rot: '4-3-3', v: ['GOL', 'LAT', 'ZAG', 'ZAG', 'LAT', 'VOL', 'MEI', 'MEI', 'PON', 'ATA', 'PON'], xy: [[50, 91], [14, 70], [37, 75], [63, 75], [86, 70], [50, 57], [28, 44], [72, 44], [15, 21], [50, 13], [85, 21]] },
    '442': { rot: '4-4-2', v: ['GOL', 'LAT', 'ZAG', 'ZAG', 'LAT', 'MEI', 'VOL', 'VOL', 'MEI', 'ATA', 'ATA'], xy: [[50, 91], [14, 70], [37, 75], [63, 75], [86, 70], [13, 44], [37, 51], [63, 51], [87, 44], [35, 16], [65, 16]] },
    '352': { rot: '3-5-2', v: ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LAT', 'VOL', 'MEI', 'VOL', 'LAT', 'ATA', 'ATA'], xy: [[50, 91], [24, 75], [50, 77], [76, 75], [10, 48], [33, 56], [50, 40], [67, 56], [90, 48], [35, 16], [65, 16]] },
    '4231': { rot: '4-2-3-1', v: ['GOL', 'LAT', 'ZAG', 'ZAG', 'LAT', 'VOL', 'VOL', 'PON', 'MEI', 'PON', 'ATA'], xy: [[50, 91], [14, 70], [37, 75], [63, 75], [86, 70], [35, 57], [65, 57], [15, 33], [50, 37], [85, 33], [50, 13]] }
  };
  var limpa = function (s) { return BL.norm(s).replace(/^tambem\s+/, ''); };
  /* 0 = posição principal compatível · 1 = posição secundária · 2 = fora de posição */
  function nota(p, vaga) {
    var re = VAGA[vaga], ps = (p.posicoes || []).map(limpa);
    if (ps[0] && re.test(ps[0])) return 0;
    var solto = new RegExp(re.source.replace(/\^/g, ''));
    return ps.slice(1).some(function (x) { return solto.test(x); }) || (ps[0] && solto.test(ps[0])) ? 1 : 2;
  }
  function quimica(ids, adj) {
    var pares = [], total = 0; ids = ids.filter(Boolean);
    for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) {
      var l = adj[ids[i]] && adj[ids[i]][ids[j]]; if (!l) continue;
      var w = l.reduce(function (s, x) { return s + x.peso; }, 0); total += w; pares.push({ a: ids[i], b: ids[j], lacos: l, w: w });
    }
    return { total: total, pares: pares };
  }
  var ovr = function (p, op) { return window.BLX1 ? window.BLX1.atributos(p, op && op.puro).ovr : 50; };
  /* melhor jogador do time para a vaga (posição primeiro, depois Geral estimado), sem repetir os já usados */
  function melhor(time, vaga, usados, op) {
    var c = time.filter(function (p) { return p && (!usados || usados.indexOf(p.id) < 0); });
    if (!c.length) return null;
    return c.slice().sort(function (a, b) {
      var na = vaga === '*' ? 0 : nota(a, vaga), nb = vaga === '*' ? 0 : nota(b, vaga);
      return na - nb || ovr(b, op) - ovr(a, op) || (a.id < b.id ? -1 : 1);
    })[0];
  }
  /* escala 11 numa formação a partir de uma lista (vagas mais raras primeiro: GOL, ZAG, LAT…) */
  function escalar(lista, f, op) {
    var F = FORM[f], ordem = F.v.map(function (v, i) { return i; }), usados = [], out = new Array(11).fill(null);
    var rar = { GOL: 0, ZAG: 1, LAT: 2, VOL: 3, PON: 4, MEI: 5, ATA: 6 };
    ordem.sort(function (a, b) { return rar[F.v[a]] - rar[F.v[b]] || a - b; });
    ordem.forEach(function (i) { var p = melhor(lista, F.v[i], usados, op); if (p) { out[i] = p; usados.push(p.id); } });
    return out;
  }
  var DUELOS = [['ATA', 'ZAG'], ['PON', 'LAT'], ['MEI', 'VOL'], ['ATA', 'GOL'], ['*', '*']];
  var ROT_D = ['Ataque × Defesa', 'Ponta × Lateral', 'Meio × Volância', 'Atacante × Goleiro', 'Duelo dos craques'];
  /* série de 5 x1 setoriais: cada duelo usa um par diferente de jogadores */
  function serie(t1, t2, seed, op) {
    var u1 = [], u2 = [], M = window.BLX1;
    return DUELOS.map(function (d, i) {
      var a = melhor(t1, d[0], u1, op), b = melhor(t2, d[1], u2, op);
      if (!a) a = melhor(t1, '*', [], op); if (!b) b = melhor(t2, '*', [], op);
      u1.push(a.id); u2.push(b.id);
      var s = seed + ':pr:' + i, r = M.simular(a, b, s, { puro: op && op.puro });
      return { rot: ROT_D[i], a: a, b: b, s: s, g: [r.J[0].g, r.J[1].g], venc: r.venc, ouro: r.ouro, penalti: r.penalti };
    });
  }
  BL.TIMES = { VAGA: VAGA, NOME: NOME, FORM: FORM, nota: nota, quimica: quimica, melhor: melhor, escalar: escalar, serie: serie, ovr: ovr };
})();
