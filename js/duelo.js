/* Duelo x1: escolha dois personagens e veja um mano a mano lance a lance — duelo.html?a=isagi&b=rin
   Atributos (0–99) derivados das fichas: categoria + ranking (base), posição (perfil), Armas (palavras-chave)
   e um ajuste fixo por personagem (hash do id). Mesma ficha = mesmos atributos; o acaso fica só nos lances. */
(function () {
  'use strict';
  var BL = window.BL, raiz = document.querySelector('.x1');
  if (!BL || !raiz) return;
  var esc = BL.esc, norm = BL.norm;
  var $ = function (s, el) { return (el || raiz).querySelector(s); };
  var ATR = [['chu', 'Finalização'], ['dri', 'Drible'], ['vel', 'Velocidade'], ['fis', 'Físico'], ['def', 'Defesa'], ['ego', 'Ego']];
  var GOLS = 3, LANCES = 10;

  /* ---------- atributos ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
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
  var CHAVES = {
    chu: /chute|shot|voleio|finaliz|precis|cabece|gol|impact|knuckle/,
    dri: /drible|finta|controle|dominio|trap|destreza|agilidade|copycat|ambidestr|flexib|chop/,
    vel: /velocidade|aceler|arrancada|reac|explos|agilidade|sprint|godspeed/,
    fis: /fisic|impuls|salto|cabece|resist|corpo|forca|alcance|mola/,
    def: /marca|pressao|defes|bloque|reflexo|previs|intercept|leitura|desarme/,
    ego: /flow|metavision|predator|visao|analit|ego|puppet|passe|adapt|contato visual/
  };
  var CAT = { protagonistas: 70, nel: 64, sub20: 64, selecoes: 63, bl: 60, staff: 50, outros: 50 };
  /* calibração de fã: craques cujo nível a ficha não traduz em números */
  var ELITE = { kaiser: 9, sae: 8, rin: 2, 'alexis-ness': 7, 'oliver-aiku': 2, 'don-lorenzo': 3 };
  var cacheAtr = {};
  function atributos(p) {
    if (cacheAtr[p.id]) return cacheAtr[p.id];
    var base = CAT[p.categoria] || 60, h = hash(p.id), s = {}, pos = norm(p.posicao), prim = norm((p.posicoes || [])[0] || p.posicao);
    if (p.categoria === 'staff' && p.jogador) base = 76; /* mestres da NEL e craques mundiais (Noa, Loki, Lavinho…) */
    if (p.rankingFinal) base += (300 - p.rankingFinal) / 299 * 8 - 3;
    base += ELITE[p.id] || 0;
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
    return (cacheAtr[p.id] = s);
  }
  /* Arma da ficha que combina com o tipo de lance (para a narração) */
  function golpe(p, k) {
    var a = (p.armas || []).filter(function (x) { return CHAVES[k].test(norm(x)) && !/^(fisico|velocidade|drible|passe|chute)$/.test(norm(x)); })[0];
    return a ? a.replace(/\s*\([^)]*\)/, '') : null;
  }
  var temFlow = function (p) { return (p.armas || []).some(function (x) { return /flow/i.test(x); }); };
  var nome = function (p) { return BL.sobrenome(p); };
  var timeAtual = function (p) { var f = p.fases && p.fases[p.fases.length - 1]; return f ? f.time.replace(/\s*\(.*\)$/, '') : ''; };

  /* ---------- simulação ---------- */
  var sig = function (x) { return 1 / (1 + Math.exp(-x)); };
  var pick = function (l) { return l[Math.floor(Math.random() * l.length)]; };
  var TIPOS = {
    dri: { rot: 'Drible × Desarme', atk: 'dri', def: 'def' },
    vel: { rot: 'Arrancada × Perseguição', atk: 'vel', def: 'vel' },
    fis: { rot: 'Corpo a corpo', atk: 'fis', def: 'fis' }
  };
  function simular(A, B) {
    var J = [{ p: A, s: atributos(A), g: 0, flow: 0, acordou: false, st: { chutes: 0, dribles: 0, desarmes: 0, defesas: 0 } },
             { p: B, s: atributos(B), g: 0, flow: 0, acordou: false, st: { chutes: 0, dribles: 0, desarmes: 0, defesas: 0 } }];
    var ev = [], quem = Math.random() < sig((J[0].s.vel - J[1].s.vel) / 20) ? 0 : 1, n = 0, ouro = false;
    var v = function (j, k) { return j.s[k] + (j.flow > 0 ? 12 : 0); };
    ev.push({ t: 'narra', txt: '🪙 ' + nome(J[quem].p) + ' ganha o cara ou coroa e começa com a bola.' });
    while (n < LANCES + 6) {
      if (n >= LANCES && !ouro) {
        if (J[0].g !== J[1].g) { ev.push({ t: 'narra', txt: '⏱ Fim dos ' + LANCES + ' lances! ' + nome(J[J[0].g > J[1].g ? 0 : 1].p) + ' segura a vantagem.' }); break; }
        ouro = true; ev.push({ t: 'ouro', txt: '⏱ Empate após ' + LANCES + ' lances! Gol de ouro: quem marcar primeiro vence.' });
      }
      n++;
      var at = J[quem], df = J[1 - quem];
      ev.push({ t: 'lance', n: n, quem: quem, ouro: ouro });
      /* despertar do ego: uma vez por jogo, mais provável para quem está atrás */
      [at, df].forEach(function (j) {
        if (j.flow > 0) j.flow--;
        var atras = j === at ? at.g < df.g : df.g < at.g;
        var ch = Math.max(0.02, (j.s.ego - 55) / 260) * (atras ? 2.2 : 1) * (n > 3 ? 1 : 0.4);
        if (!j.acordou && Math.random() < ch) {
          j.acordou = true; j.flow = 3;
          ev.push({ t: 'flow', lado: J.indexOf(j), txt: temFlow(j.p) ? '⚡ ' + nome(j.p) + ' entra no FLOW! Tudo fica em câmera lenta… +12 em tudo por 3 lances.' : '🔥 Despertar do ego! ' + nome(j.p) + ' devora o jogo com fome de gol. +12 em tudo por 3 lances.' });
        }
      });
      /* 1º duelo: escolhido pelos pontos fortes de quem ataca */
      var w = { dri: Math.pow(at.s.dri, 3), vel: Math.pow(at.s.vel, 3), fis: Math.pow(at.s.fis, 3) }, r = Math.random() * (w.dri + w.vel + w.fis);
      var tipo = r < w.dri ? 'dri' : (r < w.dri + w.vel ? 'vel' : 'fis'), T = TIPOS[tipo];
      var va = v(at, T.atk), vd = v(df, T.def), passou = Math.random() < sig((va - vd) / 12);
      var ga = golpe(at.p, tipo), gd = golpe(df.p, T.def);
      ev.push({ t: 'duelo', rot: T.rot, quem: quem, va: va, vd: vd, venceu: passou ? quem : 1 - quem });
      if (!passou) {
        df.st.desarmes++;
        ev.push({ t: 'narra', lado: 1 - quem, txt: pick({
          dri: [nome(df.p) + ' lê o drible e rouba a bola' + (gd ? ' com ' + gd : '') + '!', 'Desarme limpo de ' + nome(df.p) + '. ' + nome(at.p) + ' fica no chão.'],
          vel: [nome(df.p) + ' alcança ' + nome(at.p) + ' na corrida e fecha o caminho!', 'Arrancada de ' + nome(at.p) + '… mas ' + nome(df.p) + ' chega antes.'],
          fis: [nome(df.p) + ' ganha no corpo e fica com a bola!', 'Choque forte — ' + nome(df.p) + ' não cede um centímetro.']
        }[tipo]) });
      } else {
        at.st.dribles++;
        ev.push({ t: 'narra', lado: quem, txt: pick({
          dri: [nome(at.p) + ' passa por ' + nome(df.p) + (ga ? ' com ' + ga : ' com um drible desconcertante') + '!', 'Finta de corpo de ' + nome(at.p) + ' — ' + nome(df.p) + ' compra e fica para trás!'],
          vel: [nome(at.p) + ' dispara' + (ga ? ' (' + ga + ')' : '') + ' e deixa ' + nome(df.p) + ' comendo poeira!', 'Explosão de ' + nome(at.p) + '! Ninguém acompanha.'],
          fis: [nome(at.p) + ' segura ' + nome(df.p) + ' no corpo' + (ga ? ' — ' + ga : '') + ' e gira!', 'Ombro a ombro… ' + nome(at.p) + ' leva a melhor!']
        }[tipo]) });
        /* 2º duelo: chute × defesa (goleiro defende com tudo; jogador de linha tenta o bloqueio) */
        var gk = /goleiro/.test(norm(df.p.posicao));
        var vc = v(at, 'chu'), vb = gk ? v(df, 'def') : Math.round(v(df, 'def') * 0.6 + v(df, 'vel') * 0.2 + v(df, 'fis') * 0.2) - 4;
        var pg = Math.max(0.12, Math.min(0.85, sig((vc - vb) / 11) - 0.05 + (ouro ? 0.1 + 0.06 * (n - LANCES) : 0)));
        var gol = Math.random() < pg, gc = golpe(at.p, 'chu');
        at.st.chutes++;
        ev.push({ t: 'duelo', rot: gk ? 'Chute × Defesa' : 'Chute × Bloqueio', quem: quem, va: vc, vd: vb, venceu: gol ? quem : 1 - quem });
        if (gol) {
          at.g++;
          ev.push({ t: 'gol', lado: quem, placar: [J[0].g, J[1].g], txt: pick(['⚽ GOOOL! ' + nome(at.p) + (gc ? ' solta o ' + gc : ' bate firme') + ' e estufa a rede!', '⚽ GOL de ' + nome(at.p) + '! O ego falou mais alto.', '⚽ ' + nome(at.p) + ' acha o ângulo — GOL!']) });
        } else {
          df.st.defesas++;
          ev.push({ t: 'narra', lado: 1 - quem, txt: pick(gk ? ['🧤 Defesaça de ' + nome(df.p) + '!', nome(at.p) + ' chuta' + (gc ? ' (' + gc + ')' : '') + '… ' + nome(df.p) + ' voa e espalma!'] : ['🛡 ' + nome(df.p) + ' se joga na frente e bloqueia!', nome(at.p) + ' finaliza' + (gc ? ' com ' + gc : '') + '… e a bola raspa a trave!', nome(df.p) + ' trava o chute no último segundo!']) });
        }
      }
      if (at.g >= GOLS || (ouro && at.g !== df.g)) break;
      quem = 1 - quem;
    }
    if (J[0].g === J[1].g) { /* salvaguarda: decide no pênalti pela Finalização */
      var k = Math.random() < sig((J[0].s.chu - J[1].s.chu) / 10) ? 0 : 1; J[k].g++;
      ev.push({ t: 'gol', lado: k, placar: [J[0].g, J[1].g], txt: '⚽ Ninguém marca no gol de ouro… pênalti decisivo convertido por ' + nome(J[k].p) + '!' });
    }
    var venc = J[0].g > J[1].g ? 0 : 1;
    return { ev: ev, J: J, venc: venc, lances: n };
  }

  /* ---------- interface ---------- */
  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    var qs = new URLSearchParams(location.search);
    var staff = $('#x1-staff');
    staff.checked = qs.get('staff') === '1' || [qs.get('a'), qs.get('b')].some(function (id) { return por[id] && !por[id].jogador; });
    var lista = function () { return todos.filter(function (p) { return staff.checked || p.jogador; }); };
    var sel = { a: por[qs.get('a')] || por.isagi, b: por[qs.get('b')] || null };
    if (!sel.b || sel.b === sel.a) sel.b = sel.a.id === 'rin' ? por.isagi : por.rin;
    raiz.classList.add('pronto');

    function cartao(lado) {
      var p = sel[lado], s = atributos(p), o = sel[lado === 'a' ? 'b' : 'a'], so = atributos(o);
      var el = $('.x1-pick[data-lado="' + lado + '"] .x1-card');
      el.innerHTML = '<div class="x1-foto"><img src="' + esc(p.img) + '" alt="" width="480" height="552"><span class="x1-ovr" title="Geral">' + s.ovr + '</span></div>' +
        '<h2><a href="' + esc(p.url) + '">' + esc(p.nome) + '</a></h2><p class="pos">' + esc((p.posicoes && p.posicoes[0]) || p.posicao || (p.jogador ? 'Jogador' : 'Staff')) + (timeAtual(p) ? ' · ' + esc(timeAtual(p)) : '') + '</p>' +
        '<ul class="x1-atr">' + ATR.map(function (a) {
          var k = a[0], cls = s[k] > so[k] ? ' class="mais"' : '';
          return '<li' + cls + '><span>' + a[1] + '</span><i style="--v:' + s[k] + '%"></i><b>' + s[k] + '</b></li>';
        }).join('') + '</ul>' +
        ((p.armas || []).length ? '<p class="x1-armas">' + p.armas.slice(0, 4).map(function (x) { return '<span class="chip">' + esc(x.replace(/\s*\([^)]*\)/, '')) + '</span>'; }).join(' ') + '</p>' : '');
      $('#x1-busca-' + lado).value = '';
      $('#x1-busca-' + lado).placeholder = nome(p) + ' · trocar…';
    }
    function ficha() {
      var A = sel.a, B = sel.b, ka = {}, kb = {};
      A.armas.forEach(function (x) { ka[BL.chaveArma(x)] = x; }); B.armas.forEach(function (x) { kb[BL.chaveArma(x)] = x; });
      var comum = Object.keys(ka).filter(function (k) { return k in kb; }).map(function (k) { return ka[k]; });
      var ul = function (l) { return l.length ? l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li class="vazio">Nenhuma</li>'; };
      var linhas = BL.FASES.map(function (fase) {
        var fa = A.fases.filter(function (x) { return x.fase === fase; })[0], fb = B.fases.filter(function (x) { return x.fase === fase; })[0];
        return fa || fb ? '<tr><th scope="row">' + esc(fase) + '</th><td>' + (fa ? esc(fa.time) : '—') + '</td><td>' + (fb ? esc(fb.time) : '—') + '</td></tr>' : '';
      }).join('');
      $('.x1-ficha-corpo').innerHTML = '<div class="armas"><div class="col comum"><h4>Armas em comum</h4><ul>' + ul(comum) + '</ul></div></div>' +
        (linhas ? '<table class="traj"><thead><tr><th scope="col">Fase</th><th scope="col">' + esc(A.nome) + '</th><th scope="col">' + esc(B.nome) + '</th></tr></thead><tbody>' + linhas + '</tbody></table>' : '');
    }
    function url() { return '?a=' + sel.a.id + '&b=' + sel.b.id + (staff.checked ? '&staff=1' : ''); }
    function render() {
      cartao('a'); cartao('b'); ficha();
      try { history.replaceState(null, '', url()); } catch (e) {}
      document.title = nome(sel.a) + ' × ' + nome(sel.b) + ' | Duelo x1 | Blue Lock';
    }
    function escolher(lado, p) {
      var outro = lado === 'a' ? 'b' : 'a';
      if (sel[outro].id === p.id) sel[outro] = sel[lado];
      sel[lado] = p; BL.transicao(render); BL.anunciar(nome(sel.a) + ' contra ' + nome(sel.b));
    }

    /* busca com fotos (combobox) */
    ['a', 'b'].forEach(function (lado) {
      var inp = $('#x1-busca-' + lado), ul = $('#x1-lista-' + lado), ativo = -1, res = [];
      function abrir(q) {
        q = norm(q);
        res = lista().filter(function (p) { return !q || norm(p.nome).indexOf(q) >= 0 || norm(timeAtual(p)).indexOf(q) >= 0 || norm(p.posicao).indexOf(q) >= 0; }).slice(0, 60);
        ativo = -1; inp.removeAttribute('aria-activedescendant');
        ul.innerHTML = res.length ? res.map(function (p, i) {
          return '<li role="option" id="x1-op-' + lado + '-' + i + '" data-i="' + i + '" aria-selected="false"><img src="' + esc(p.img) + '" alt="" width="40" height="46" loading="lazy"><span><b>' + esc(p.nome) + '</b><small>' + esc((p.posicoes && p.posicoes[0]) || (p.jogador ? '' : 'Staff')) + (timeAtual(p) ? ' · ' + esc(timeAtual(p)) : '') + '</small></span><em>' + atributos(p).ovr + '</em></li>';
        }).join('') : '<li class="x1-vazio">Ninguém encontrado</li>';
        ul.hidden = false; inp.setAttribute('aria-expanded', 'true');
      }
      function fechar() { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); }
      function mover(d) {
        if (!res.length) return;
        ativo = (ativo + d + res.length) % res.length;
        [].forEach.call(ul.children, function (li, i) { li.setAttribute('aria-selected', String(i === ativo)); });
        var li = ul.children[ativo]; inp.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' });
      }
      inp.addEventListener('input', function () { abrir(inp.value); });
      inp.addEventListener('focus', function () { abrir(inp.value); });
      inp.addEventListener('blur', function () { setTimeout(fechar, 150); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (ul.hidden) abrir(inp.value); mover(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); var p = res[ativo < 0 ? 0 : ativo]; if (p) { escolher(lado, p); fechar(); } }
        else if (e.key === 'Escape') { fechar(); inp.value = ''; }
      });
      ul.addEventListener('mousedown', function (e) {
        var li = e.target.closest('li[data-i]'); if (!li) return;
        e.preventDefault(); escolher(lado, res[+li.dataset.i]); fechar(); inp.blur();
      });
    });

    var sortear = function (lado) {
      var l = lista().filter(function (p) { return p.id !== sel.a.id && p.id !== sel.b.id; });
      return l[Math.floor(Math.random() * l.length)];
    };
    staff.addEventListener('change', function () {
      if (!staff.checked) ['a', 'b'].forEach(function (k) { if (!sel[k].jogador) sel[k] = sortear(k); });
      render();
    });

    /* ---------- partida ---------- */
    var arena = $('.x1-arena'), fim = $('.x1-final'), escolha = $('.x1-escolha'), log = $('.x1-log'), timer = null, rapido = false, jogo = null, fila = [];
    var espera = function () { return BL.reduce ? 450 : (rapido ? 420 : 1050); };
    function lutador(j, lado) {
      return '<img src="' + esc(j.p.img) + '" alt="" width="480" height="552"><h3>' + esc(j.p.nome) + '</h3><p class="x1-flow" hidden>⚡ FLOW</p>';
    }
    function comecar() {
      jogo = simular(sel.a, sel.b); fila = jogo.ev.slice();
      escolha.hidden = true; fim.hidden = true; arena.hidden = false; $('.x1-ctrl').hidden = false;
      $('.x1-lut.a').innerHTML = lutador(jogo.J[0], 'a'); $('.x1-lut.b').innerHTML = lutador(jogo.J[1], 'b');
      $('.x1-pl-a').innerHTML = '<img src="' + esc(sel.a.img) + '" alt="">' + esc(nome(sel.a));
      $('.x1-pl-b').innerHTML = esc(nome(sel.b)) + '<img src="' + esc(sel.b.img) + '" alt="">';
      $('.x1-ga').textContent = '0'; $('.x1-gb').textContent = '0';
      $('.x1-n').textContent = 'Apito inicial'; $('.x1-acao').innerHTML = '<span class="x1-rot">Primeiro a ' + GOLS + ' gols</span>';
      $('.x1-campo').dataset.bola = '';
      log.innerHTML = '';
      $('.x1-arena h2').focus();
      BL.anunciar('Começa o x1: ' + sel.a.nome + ' contra ' + sel.b.nome);
      clearTimeout(timer); timer = setTimeout(passo, espera());
    }
    function linha(txt, cls) {
      var li = document.createElement('li'); li.className = cls || ''; li.textContent = txt; log.insertBefore(li, log.firstChild);
    }
    var lutEl = function (i) { return $('.x1-lut.' + (i ? 'b' : 'a')); };
    function aplicar(e, silencioso) {
      var campo = $('.x1-campo');
      ['a', 'b'].forEach(function (k) { $('.x1-lut.' + k).classList.remove('ganhou', 'perdeu'); });
      if (e.t === 'lance') {
        $('.x1-n').textContent = (e.ouro ? 'Gol de ouro · ' : '') + 'Lance ' + e.n + (e.ouro ? '' : ' de ' + LANCES);
        campo.dataset.bola = e.quem ? 'b' : 'a';
        $('.x1-acao').innerHTML = '<span class="x1-rot">' + esc(nome(jogo.J[e.quem].p)) + ' parte para cima</span>';
        lutEl(e.quem).classList.add('ataca'); lutEl(1 - e.quem).classList.remove('ataca');
      } else if (e.t === 'duelo') {
        var a = e.quem === 0 ? e.va : e.vd, b = e.quem === 0 ? e.vd : e.va;
        $('.x1-acao').innerHTML = '<span class="x1-rot">' + esc(e.rot) + '</span><div class="x1-forca"><b>' + a + '</b><span><i class="fa" style="--v:' + a + '%"></i><i class="fb" style="--v:' + b + '%"></i></span><b>' + b + '</b></div>';
        lutEl(e.venceu).classList.add('ganhou'); lutEl(1 - e.venceu).classList.add('perdeu');
        campo.dataset.bola = e.venceu ? 'b' : 'a';
      } else if (e.t === 'flow') {
        lutEl(e.lado).querySelector('.x1-flow').hidden = false; lutEl(e.lado).classList.add('em-flow');
        linha(e.txt, 'flow'); if (!silencioso) BL.anunciar(e.txt);
      } else if (e.t === 'gol') {
        $('.x1-ga').textContent = e.placar[0]; $('.x1-gb').textContent = e.placar[1];
        var g = $(e.lado ? '.x1-gb' : '.x1-ga'); g.classList.remove('pop'); void g.offsetWidth; g.classList.add('pop');
        campo.classList.remove('golaco'); void campo.offsetWidth; campo.classList.add('golaco');
        lutEl(e.lado).classList.add('ganhou');
        linha(e.txt, 'gol ' + (e.lado ? 'b' : 'a')); if (!silencioso) BL.anunciar(e.txt + ' Placar: ' + e.placar[0] + ' a ' + e.placar[1]);
      } else if (e.t === 'narra' || e.t === 'ouro') {
        linha(e.txt, e.t === 'ouro' ? 'ouro' : (e.lado == null ? '' : (e.lado ? 'b' : 'a')));
      }
    }
    function passo() {
      var e = fila.shift();
      if (!e) return final();
      aplicar(e);
      timer = setTimeout(passo, e.t === 'gol' ? espera() * 1.8 : (e.t === 'lance' ? espera() * 0.6 : espera()));
    }
    function pular() { clearTimeout(timer); while (fila.length) aplicar(fila.shift(), true); final(); }
    function final() {
      clearTimeout(timer);
      var J = jogo.J, w = J[jogo.venc], l = J[1 - jogo.venc];
      var linhaSt = function (rot, k) { return '<tr><td>' + J[0].st[k] + '</td><th scope="row">' + rot + '</th><td>' + J[1].st[k] + '</td></tr>'; };
      fim.innerHTML = '<h2 tabindex="-1">🏆 ' + esc(w.p.nome) + ' vence o x1!</h2>' +
        '<div class="x1-campeao ' + (jogo.venc ? 'b' : 'a') + '"><img src="' + esc(w.p.img) + '" alt="" width="480" height="552"><div><p class="x1-placar-final"><span>' + esc(nome(J[0].p)) + '</span> <b>' + J[0].g + ' × ' + J[1].g + '</b> <span>' + esc(nome(J[1].p)) + '</span></p>' +
        '<p>' + esc(pick([nome(w.p) + ' foi mais egoísta. ' + nome(l.p) + ' vai ter que evoluir.', 'O ego de ' + nome(w.p) + ' devorou ' + nome(l.p) + '.', nome(l.p) + ' lutou, mas ' + nome(w.p) + ' foi o protagonista hoje.'])) + ' <small>(' + jogo.lances + ' lances)</small></p>' +
        '<table class="x1-est"><caption class="sr-only">Estatísticas do x1</caption><thead><tr><th scope="col">' + esc(nome(J[0].p)) + '</th><th></th><th scope="col">' + esc(nome(J[1].p)) + '</th></tr></thead><tbody>' +
        '<tr><td>' + J[0].g + '</td><th scope="row">Gols</th><td>' + J[1].g + '</td></tr>' + linhaSt('Chutes', 'chutes') + linhaSt('Duelos vencidos no ataque', 'dribles') + linhaSt('Desarmes', 'desarmes') + linhaSt('Defesas / bloqueios', 'defesas') +
        '<tr><td>' + (J[0].acordou ? '⚡' : '—') + '</td><th scope="row">Despertar do ego</th><td>' + (J[1].acordou ? '⚡' : '—') + '</td></tr></tbody></table>' +
        '<div class="x1-botoes"><button type="button" class="btn" data-acao="revanche">↻ Revanche</button><button type="button" class="btn btn-2" data-acao="trocar-pers">Trocar personagens</button><button type="button" class="btn btn-2" data-acao="copiar">Copiar link</button></div></div></div>';
      fim.hidden = false; $('.x1-ctrl').hidden = true;
      $('.x1-n').textContent = 'Fim de jogo';
      fim.querySelector('h2').focus();
      BL.anunciar(w.p.nome + ' vence por ' + J[jogo.venc].g + ' a ' + J[1 - jogo.venc].g);
    }
    function voltar() { clearTimeout(timer); fila = []; arena.hidden = true; fim.hidden = true; escolha.hidden = false; render(); $('.x1-comecar').focus(); }

    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return;
      var a = b.dataset.acao;
      if (a === 'sortear') { var x = sortear(); sel.a = x; sel.b = sortear(); if (sel.b === sel.a) sel.b = sortear(); BL.transicao(render); BL.anunciar(nome(sel.a) + ' contra ' + nome(sel.b)); }
      if (a === 'sortear-a' || a === 'sortear-b') escolher(a.slice(-1), sortear());
      if (a === 'inverter') { var t = sel.a; sel.a = sel.b; sel.b = t; BL.transicao(render); }
      if (a === 'comecar' || a === 'revanche') comecar();
      if (a === 'pular') pular();
      if (a === 'veloc') { rapido = !rapido; b.setAttribute('aria-pressed', String(rapido)); b.textContent = rapido ? '⏩ 2×' : '▶ 1×'; }
      if (a === 'trocar-pers') voltar();
      if (a === 'copiar') {
        var u = location.href, ok = function () { var o = b.textContent; b.textContent = 'Link copiado ✓'; BL.anunciar('Link copiado'); setTimeout(function () { b.textContent = o; }, 2000); };
        var fb = function () { var t = document.createElement('textarea'); t.value = u; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (x) { prompt('Copie o link:', u); } t.remove(); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(u).then(ok, fb); else fb();
      }
    });
    render();
    if (qs.get('auto') === '1') comecar();
  }).catch(function (e) { console.warn('Duelo indisponível:', e); });
})();
