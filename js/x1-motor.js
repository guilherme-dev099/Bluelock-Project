/* Motor do Duelo x1 (script clássico, funciona em file://) — window.BLX1 = { atributos, simular, curto, rng, hash, ... }
   Atributos (0–99) ESTIMADOS PELO SITE a partir das fichas: categoria + ranking (base), posição (perfil), Armas (palavras-chave)
   e um ajuste fixo por personagem (hash do id). Não são dados oficiais. Mesma ficha = mesmos atributos.
   O acaso dos lances vem de um sorteio com semente (mulberry32): mesma semente + mesma dupla = mesma partida. */
(function () {
  'use strict';
  var BL = window.BL; if (!BL) return;
  var norm = BL.norm;
  var M = window.BLX1 = window.BLX1 || {};
  var ATR = M.ATR = [['chu', 'Finalização'], ['dri', 'Drible'], ['vel', 'Velocidade'], ['fis', 'Físico'], ['def', 'Defesa'], ['ego', 'Ego']];
  var GOLS = M.GOLS = 3, LANCES = M.LANCES = 10;

  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  M.hash = hash;
  /* sorteio com semente (mulberry32); aceita texto ou número */
  M.rng = function (seed) {
    var a = (typeof seed === 'number' ? seed : hash(seed)) >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  M.novaSemente = function () { return (Date.now() % 1e8).toString(36) + Math.floor(Math.random() * 1296).toString(36); };

  var PERFIL = [
    [/goleiro|keeper/, { chu: -24, dri: -14, vel: -8, fis: 4, def: 20, ego: -2 }],
    [/zagueiro|defensor|center back|centre back/, { chu: -12, dri: -6, vel: 0, fis: 10, def: 16, ego: 0 }],
    [/lateral|ala |ala$|side back|wing back/, { chu: -6, dri: 2, vel: 9, fis: 0, def: 9, ego: 0 }],
    [/volante/, { chu: -6, dri: 0, vel: -2, fis: 8, def: 12, ego: 0 }],
    [/ponta|winger/, { chu: 2, dri: 8, vel: 10, fis: -4, def: -6, ego: 1 }],
    [/meia/, { chu: 0, dri: 7, vel: 0, fis: -2, def: 2, ego: 2 }],
    [/atacante|centroavante|striker|forward/, { chu: 10, dri: 3, vel: 3, fis: 1, def: -10, ego: 4 }],
    [/versatil/, { chu: 3, dri: 3, vel: 3, fis: 3, def: 3, ego: 3 }]
  ];
  var CHAVES = M.CHAVES = {
    chu: /chute|shot|voleio|finaliz|precis|cabece|gol|impact|knuckle/,
    dri: /drible|finta|controle|dominio|trap|destreza|agilidade|copycat|ambidestr|flexib|chop/,
    vel: /velocidade|aceler|arrancada|reac|explos|agilidade|sprint|godspeed/,
    fis: /fisic|impuls|salto|cabece|resist|corpo|forca|alcance|mola/,
    def: /marca|pressao|defes|bloque|reflexo|previs|intercept|leitura|desarme/,
    ego: /flow|metavision|predator|visao|analit|ego|puppet|passe|adapt|contato visual/
  };
  var CAT = { protagonistas: 70, nel: 64, sub20: 64, selecoes: 63, bl: 60, staff: 50, outros: 50 };
  /* ajuste manual de fã (desligado no "Modo puro"): craques cujo nível a ficha não traduz em números */
  var ELITE = M.ELITE = { kaiser: 9, sae: 8, rin: 2, 'alexis-ness': 7, 'oliver-aiku': 2, 'don-lorenzo': 3 };
  var cacheAtr = {};
  function atributos(p, puro) {
    var ck = p.id + (puro ? '|p' : '');
    if (cacheAtr[ck]) return cacheAtr[ck];
    var base = CAT[p.categoria] || 60, h = hash(p.id), s = {}, pos = norm(p.posicao), prim = norm((p.posicoes || [])[0] || p.posicao);
    if (p.categoria === 'staff' && p.jogador) base = 76; /* mestres da NEL e craques mundiais (Noa, Loki, Lavinho…) */
    if (p.rankingFinal) base += (300 - p.rankingFinal) / 299 * 8 - 3;
    if (!puro) base += ELITE[p.id] || 0;
    ATR.forEach(function (a) { s[a[0]] = base; });
    var achou = false;
    PERFIL.forEach(function (pf) {
      var peso = pf[0].test(prim) ? 1 : (pf[0].test(pos) ? 0.4 : 0);
      if (peso) { achou = achou || peso === 1; for (var k in pf[1]) s[k] += pf[1][k] * peso; }
    });
    if (!achou && !p.jogador) ATR.forEach(function (a) { s[a[0]] -= 4; });
    var bonus = { chu: 0, dri: 0, vel: 0, fis: 0, def: 0, ego: 0 };
    (p.armas || []).forEach(function (arma) {
      var t = norm(arma);
      for (var k in CHAVES) if (CHAVES[k].test(t)) bonus[k] += 4;
      if (/flow/.test(t)) { bonus.ego += 4; for (var j in bonus) bonus[j] += 2; }
      if (/perfeit|divin|machine|maquina|impact|knuckle/.test(t)) for (var m in bonus) bonus[m] += 2;
    });
    ATR.forEach(function (a, i) {
      var k = a[0], jit = ((h >>> (i * 4)) & 15) % 9 - 4;
      s[k] = Math.max(35, Math.min(99, Math.round(s[k] + Math.min(14, bonus[k]) + jit)));
    });
    s.ovr = Math.round((s.chu * 1.2 + s.dri + s.vel + s.fis + s.def * 0.8 + s.ego) / 6);
    return (cacheAtr[ck] = s);
  }
  M.atributos = atributos;

  /* Pentágono de status (5 eixos). Leitura = média de Ego/visão e Defesa/leitura. Mesma função usada no build das fichas. */
  var EIXOS = M.EIXOS = [['chu', 'Finalização'], ['vel', 'Velocidade'], ['fis', 'Físico'], ['lei', 'Leitura'], ['dri', 'Drible']];
  function cinco(s) { return { chu: s.chu, vel: s.vel, fis: s.fis, dri: s.dri, lei: Math.round((s.ego + s.def) / 2) }; }
  M.cinco = cinco;
  M.radarSVG = function (series, titulo) {
    var C = 130, R = 88, n = 5, f = function (n) { return n.toFixed(1); };
    function pt(i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; }
    function poly(r) { return EIXOS.map(function (_, i) { return pt(i, r).map(f).join(','); }).join(' '); }
    var o = '<svg class="radar-svg" viewBox="-55 -8 370 280" role="img" aria-label="' + titulo + '">';
    [1, 0.75, 0.5, 0.25].forEach(function (k) { o += '<polygon class="radar-grade" points="' + poly(R * k) + '"/>'; });
    EIXOS.forEach(function (_, i) { var p = pt(i, R); o += '<line class="radar-eixo" x1="130" y1="130" x2="' + f(p[0]) + '" y2="' + f(p[1]) + '"/>'; });
    series.forEach(function (sr, j) {
      var pts = EIXOS.map(function (e, i) { return pt(i, R * Math.max(0, sr.v[e[0]] - 30) / 69).map(f).join(','); }).join(' ');
      o += '<polygon class="radar-area radar-s' + j + '" pathLength="1" points="' + pts + '"/>';
    });
    EIXOS.forEach(function (e, i) {
      var p = pt(i, R + 30), anc = Math.abs(p[0] - C) < 5 ? 'middle' : (p[0] > C ? 'start' : 'end');
      if (anc !== 'middle') p[0] += anc === 'start' ? -14 : 14;
      o += '<text class="radar-rot" x="' + f(p[0]) + '" y="' + f(p[1] - 4) + '" text-anchor="' + anc + '">' + e[1] + '</text>';
      o += '<text class="radar-val" x="' + f(p[0]) + '" y="' + f(p[1] + 17) + '" text-anchor="' + anc + '">' + series.map(function (sr) { return sr.v[e[0]]; }).join(' · ') + '</text>';
    });
    return o + '</svg>';
  };
  /* Arma da ficha que combina com o tipo de lance (para a narração) */
  function golpe(p, k) {
    var a = (p.armas || []).filter(function (x) { return CHAVES[k].test(norm(x)) && !/^(fisico|velocidade|drible|passe|chute)$/.test(norm(x)); })[0];
    return a ? a.replace(/\s*\([^)]*\)/, '') : null;
  }
  var temFlow = function (p) { return (p.armas || []).some(function (x) { return /flow/i.test(x); }); };
  /* nome curto: sobrenome, ou primeiro nome quando os dois têm o mesmo sobrenome (Rin × Sae Itoshi) */
  function curto(p, outro) {
    var s = BL.sobrenome(p);
    return outro && outro.id !== p.id && BL.sobrenome(outro) === s ? p.nome.split(' ')[0] : s;
  }
  M.curto = curto;
  M.timeAtual = function (p) { var f = p.fases && p.fases[p.fases.length - 1]; return f ? f.time.replace(/\s*\(.*\)$/, '') : ''; };

  var sig = function (x) { return 1 / (1 + Math.exp(-x)); };
  var TIPOS = {
    dri: { rot: 'Drible × Desarme', atk: 'dri', def: 'def' },
    vel: { rot: 'Arrancada × Perseguição', atk: 'vel', def: 'vel' },
    fis: { rot: 'Corpo a corpo', atk: 'fis', def: 'fis' }
  };
  /* simular(A, B, semente|rnd, {puro}) → { ev, J, venc, lances, frase } — determinístico para a mesma semente */
  function simular(A, B, semente, op) {
    op = op || {};
    var rnd = typeof semente === 'function' ? semente : M.rng(semente == null ? M.novaSemente() : semente);
    var pick = function (l) { return l[Math.floor(rnd() * l.length)]; };
    var nome = function (p) { return curto(p, p === A ? B : A); };
    var J = [{ p: A, s: op.sA || atributos(A, op.puro), g: 0, flow: 0, acordou: false, st: { chutes: 0, dribles: 0, desarmes: 0, defesas: 0 } },
             { p: B, s: op.sB || atributos(B, op.puro), g: 0, flow: 0, acordou: false, st: { chutes: 0, dribles: 0, desarmes: 0, defesas: 0 } }];
    var ev = [], quem = rnd() < sig((J[0].s.vel - J[1].s.vel) / 20) ? 0 : 1, n = 0, ouro = false, teveOuro = false;
    var v = function (j, k) { return j.s[k] + (j.flow > 0 ? 12 : 0); };
    ev.push({ t: 'narra', txt: '🪙 ' + nome(J[quem].p) + ' ganha o cara ou coroa e começa com a bola.' });
    while (n < LANCES + 6) {
      if (n >= LANCES && !ouro) {
        if (J[0].g !== J[1].g) { ev.push({ t: 'narra', txt: '⏱ Fim dos ' + LANCES + ' lances! ' + nome(J[J[0].g > J[1].g ? 0 : 1].p) + ' segura a vantagem.' }); break; }
        ouro = teveOuro = true; ev.push({ t: 'ouro', txt: '⏱ Empate após ' + LANCES + ' lances! Gol de ouro: quem marcar primeiro vence.' });
      }
      n++;
      var at = J[quem], df = J[1 - quem];
      ev.push({ t: 'lance', n: n, quem: quem, ouro: ouro });
      /* despertar do ego: uma vez por jogo, mais provável para quem está atrás */
      [at, df].forEach(function (j) {
        if (j.flow > 0) j.flow--;
        var atras = j === at ? at.g < df.g : df.g < at.g;
        var ch = Math.max(0.02, (j.s.ego - 55) / 260) * (atras ? 2.2 : 1) * (n > 3 ? 1 : 0.4);
        if (!j.acordou && rnd() < ch) {
          j.acordou = true; j.flow = 3;
          ev.push({ t: 'flow', lado: J.indexOf(j), txt: temFlow(j.p) ? '⚡ ' + nome(j.p) + ' entra no FLOW! Tudo fica em câmera lenta… +12 em tudo por 3 lances.' : '🔥 Despertar do ego! ' + nome(j.p) + ' devora o jogo com fome de gol. +12 em tudo por 3 lances.' });
        }
      });
      /* 1º duelo: escolhido pelos pontos fortes de quem ataca */
      var w = { dri: Math.pow(at.s.dri, 3), vel: Math.pow(at.s.vel, 3), fis: Math.pow(at.s.fis, 3) }, r = rnd() * (w.dri + w.vel + w.fis);
      var tipo = r < w.dri ? 'dri' : (r < w.dri + w.vel ? 'vel' : 'fis'), T = TIPOS[tipo];
      var va = v(at, T.atk), vd = v(df, T.def), passou = rnd() < sig((va - vd) / 12);
      var ga = golpe(at.p, tipo), gd = golpe(df.p, T.def);
      ev.push({ t: 'duelo', rot: T.rot, quem: quem, va: va, vd: vd, venceu: passou ? quem : 1 - quem });
      if (!passou) {
        df.st.desarmes++;
        ev.push({ t: 'narra', lado: 1 - quem, txt: pick({
          dri: [nome(df.p) + ' lê o drible e rouba a bola' + (gd ? ' — ' + gd + '!' : '!'), 'Desarme limpo de ' + nome(df.p) + '. ' + nome(at.p) + ' fica no chão.'],
          vel: [nome(df.p) + ' alcança ' + nome(at.p) + ' na corrida e fecha o caminho!', 'Arrancada de ' + nome(at.p) + '… mas ' + nome(df.p) + ' chega antes.'],
          fis: [nome(df.p) + ' ganha no corpo e fica com a bola!', 'Choque forte — ' + nome(df.p) + ' não cede um centímetro.']
        }[tipo]) });
      } else {
        at.st.dribles++;
        ev.push({ t: 'narra', lado: quem, txt: pick({
          dri: [nome(at.p) + ' passa por ' + nome(df.p) + (ga ? ' usando a Arma “' + ga + '”' : ' com um drible desconcertante') + '!', 'Finta de corpo de ' + nome(at.p) + ' — ' + nome(df.p) + ' compra e fica para trás!'],
          vel: [nome(at.p) + ' dispara' + (ga ? ' (' + ga + ')' : '') + ' e deixa ' + nome(df.p) + ' comendo poeira!', 'Explosão de ' + nome(at.p) + '! Ninguém acompanha.'],
          fis: [nome(at.p) + ' segura ' + nome(df.p) + ' no corpo' + (ga ? ' — ' + ga + ' —' : '') + ' e gira!', 'Ombro a ombro… ' + nome(at.p) + ' leva a melhor!']
        }[tipo]) });
        /* 2º duelo: chute × defesa (goleiro defende com tudo; jogador de linha tenta o bloqueio) */
        var gk = /goleiro/.test(norm(df.p.posicao));
        var vc = v(at, 'chu'), vb = gk ? v(df, 'def') : Math.round(v(df, 'def') * 0.6 + v(df, 'vel') * 0.2 + v(df, 'fis') * 0.2) - 4;
        var pg = Math.max(0.12, Math.min(0.85, sig((vc - vb) / 11) - 0.05 + (ouro ? 0.1 + 0.06 * (n - LANCES) : 0)));
        var gol = rnd() < pg, gc = golpe(at.p, 'chu');
        at.st.chutes++;
        ev.push({ t: 'duelo', rot: gk ? 'Chute × Defesa' : 'Chute × Bloqueio', quem: quem, va: vc, vd: vb, venceu: gol ? quem : 1 - quem });
        if (gol) {
          at.g++;
          /* R5: formas neutras (Armas podem ser femininas: "Precisão de chute") */
          ev.push({ t: 'gol', lado: quem, placar: [J[0].g, J[1].g], txt: pick(['⚽ GOOOL! ' + nome(at.p) + (gc ? ' finaliza com ' + gc : ' bate firme') + ' e estufa a rede!', '⚽ GOL de ' + nome(at.p) + '! O ego falou mais alto.', '⚽ ' + nome(at.p) + ' acha o ângulo — GOL!']) });
        } else {
          df.st.defesas++;
          ev.push({ t: 'narra', lado: 1 - quem, txt: pick(gk ? ['🧤 Defesaça de ' + nome(df.p) + '!', nome(at.p) + ' chuta' + (gc ? ' (' + gc + ')' : '') + '… ' + nome(df.p) + ' voa e espalma!'] : ['🛡 ' + nome(df.p) + ' se joga na frente e bloqueia!', nome(at.p) + ' finaliza' + (gc ? ' com ' + gc : '') + '… e a bola raspa a trave!', nome(df.p) + ' trava o chute no último segundo!']) });
        }
      }
      if (at.g >= GOLS || (ouro && at.g !== df.g)) break;
      quem = 1 - quem;
    }
    var penalti = false;
    if (J[0].g === J[1].g) { /* salvaguarda: decide no pênalti pela Finalização */
      var k = rnd() < sig((J[0].s.chu - J[1].s.chu) / 10) ? 0 : 1; J[k].g++; penalti = true;
      ev.push({ t: 'gol', lado: k, placar: [J[0].g, J[1].g], txt: '⚽ Ninguém marca no gol de ouro… pênalti decisivo convertido por ' + nome(J[k].p) + '!' });
    }
    var venc = J[0].g > J[1].g ? 0 : 1, wv = J[venc].p, lv = J[1 - venc].p;
    var frase = pick([nome(wv) + ' foi mais egoísta. ' + nome(lv) + ' vai ter que evoluir.', 'O ego de ' + nome(wv) + ' devorou ' + nome(lv) + '.', nome(lv) + ' lutou, mas ' + nome(wv) + ' foi o protagonista hoje.']);
    return { ev: ev, J: J, venc: venc, lances: n, ouro: teveOuro, penalti: penalti, frase: frase, nome: nome };
  }
  M.simular = simular;
})();
