/* Sobreviva ao Blue Lock: carreira com um novato (ranking inicial ≥ 250). 10 x1 seguidos contra rivais cada vez mais fortes
   (decis de Geral). Vencer = devorar 1 Arma do rival (bônus nos atributos). Perder = fim. Mesmo link (?j=&seed=) = mesmos rivais.
   Atributos e resultados são simulados pelo site (não oficiais). Script clássico, funciona em file://. */
(function () {
  'use strict';
  var BL = window.BL, M = window.BLX1, raiz = document.querySelector('.ca');
  if (!BL || !M || !raiz) return;
  var esc = BL.esc, $ = function (s) { return raiz.querySelector(s); };
  var qs = new URLSearchParams(location.search), CH = 'bl-carreira', CHR = 'bl-carreira-rec', PASSOS = 10;
  var todos, por = {}, novatos, est = null, timer = null, fila = [], pausado = false, jogo = null;
  var lerLS = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  var gravarLS = function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var falar = function (t) { if (BL.voz && BL.voz.on) BL.voz.falar(t); };
  var ovr = function (s) { return Math.round((s.chu * 1.2 + s.dri + s.vel + s.fis + s.def * 0.8 + s.ego) / 6); };

  BL.personagens().then(function (l) {
    todos = l.filter(function (p) { return p.jogador; }); todos.forEach(function (p) { por[p.id] = p; });
    novatos = todos.filter(function (p) { return p.inicioOficial && p.rankingInicio >= 250; }).sort(function (a, b) { return b.rankingInicio - a.rankingInicio; });
    BL.avisoVersao(raiz);
    BL.combobox($('#ca-j'), $('#ca-j-lista'), { fonte: function () { return novatos; }, abrirNoFoco: true, prefixo: 'ca-op-',
      sub: function (p) { return p.rankingInicio + 'º no início · ' + (p.posicoes || [p.posicao])[0]; },
      extra: function (p) { return '<em>' + M.atributos(p).ovr + '</em>'; },
      escolher: function (p) { novo(p, M.novaSemente()); } });
    $('.ca-novatos-n').textContent = novatos.length;
    var rec = lerLS(CHR); if (rec && por[rec.j]) $('.ca-rec').innerHTML = '🏅 Seu recorde: <b>' + rec.passos + ' de ' + PASSOS + '</b> com ' + esc(por[rec.j].nome) + '.';
    var sv = lerLS(CH);
    if (qs.get('j') && por[qs.get('j')] && qs.get('seed')) novo(por[qs.get('j')], qs.get('seed'));
    else if (sv && por[sv.j] && !sv.fim) { var c = $('.ca-cont'); c.hidden = false; c.querySelector('span').textContent = por[sv.j].nome + ' · degrau ' + (sv.i + 1) + ' de ' + PASSOS; }
  }).catch(function () { $('.ca-msg').textContent = 'Não foi possível carregar as fichas.'; });

  function escada(j, seed) {
    var pool = todos.filter(function (p) { return p.id !== j.id; }).sort(function (a, b) { return M.atributos(a).ovr - M.atributos(b).ovr || (a.id < b.id ? -1 : 1); });
    var n = pool.length, out = [];
    for (var i = 0; i < PASSOS; i++) {
      var fatia = pool.slice(Math.floor(i * n / PASSOS), Math.floor((i + 1) * n / PASSOS)).filter(function (p) { return out.indexOf(p) < 0; });
      out.push(fatia[Math.floor(M.rng(seed + ':r' + i)() * fatia.length)]);
    }
    return out;
  }
  function stats(j, armas) {
    var b = M.atributos(j), s = {}; M.ATR.forEach(function (a) { s[a[0]] = b[a[0]]; });
    armas.forEach(function (ar) {
      var t = BL.norm(ar), achou = false;
      for (var k in M.CHAVES) if (M.CHAVES[k].test(t)) { s[k] += 3; achou = true; }
      if (/flow/.test(t)) for (var m in s) s[m] += 2;
      if (!achou) s.ego += 2;
    });
    for (var x in s) s[x] = Math.min(99, s[x]); s.ovr = ovr(s);
    return s;
  }
  function novo(j, seed) { est = { j: j.id, seed: String(seed), i: 0, armas: [], fim: null, v: BL.versao() }; salvar(); render('pre'); }
  function salvar() {
    gravarLS(CH, est);
    try { history.replaceState(null, '', '?j=' + est.j + '&seed=' + encodeURIComponent(est.seed) + (BL.versao() ? '&v=' + BL.versao() : '')); } catch (e) {}
  }
  function eu() { return por[est.j]; }
  var rc = {}; function rivais() { var k = est.j + '|' + est.seed; return rc[k] || (rc[k] = escada(eu(), est.seed)); }
  function cabecalho() {
    var p = eu(), s = stats(p, est.armas), base = M.atributos(p);
    $('.ca-eu').innerHTML = '<img src="' + esc(BL.thumb(p)) + '" alt="" width="72" height="72"><div><h2>' + esc(p.nome) + '</h2><p>Geral <b>' + s.ovr + '</b>' + (s.ovr > base.ovr ? ' <small>(+' + (s.ovr - base.ovr) + ' de Armas devoradas)</small>' : '') + ' · começou ' + p.rankingInicio + 'º</p>' +
      '<p class="ca-atr">' + M.ATR.map(function (a) { return '<span>' + a[1] + ' <b>' + s[a[0]] + '</b>' + (s[a[0]] > base[a[0]] ? '<i>+' + (s[a[0]] - base[a[0]]) + '</i>' : '') + '</span>'; }).join('') + '</p>' +
      (est.armas.length ? '<p class="ca-armas">Devoradas: ' + est.armas.map(function (a) { return '<span class="chip">' + esc(a) + '</span>'; }).join(' ') + '</p>' : '') + '</div>';
    var r = rivais();
    $('.ca-escada').innerHTML = r.map(function (q, i) {
      var st = i < est.i ? 'vencido' : (i === est.i ? (est.fim === 'perdeu' ? 'perdeu' : 'atual') : 'futuro'), ver = i <= est.i;
      return '<li class="' + st + '"' + (i === est.i ? ' aria-current="step"' : '') + '><span class="ca-deg">' + (i + 1) + '</span>' + (ver ? '<img src="' + esc(BL.thumb(q)) + '" alt="" width="40" height="40"><span>' + esc(M.curto(q)) + ' <small>' + M.atributos(q).ovr + '</small></span>' : '<span class="ca-ocu">?</span>') + '<span class="sr-only">' + (st === 'vencido' ? ' vencido' : st === 'perdeu' ? ' derrota' : st === 'atual' ? ' próximo' : ' bloqueado') + '</span></li>';
    }).join('');
  }
  function mostrar(qual) { ['pre', 'jogo', 'escolha', 'fim'].forEach(function (k) { $('.ca-' + k).hidden = k !== qual; }); }
  function render(fase) {
    $('.ca-inicio').hidden = true; $('.ca-run').hidden = false; cabecalho(); mostrar(fase);
    if (fase === 'pre') {
      var q = rivais()[est.i], s = M.atributos(q);
      $('.ca-pre').innerHTML = '<h3 tabindex="-1">Degrau ' + (est.i + 1) + ' de ' + PASSOS + '</h3><div class="ca-vs"><div><img src="' + esc(q.img) + '" alt="" width="160" height="184" loading="lazy"></div><div><p class="ca-rival">' + esc(q.nome) + '</p><p>Geral <b>' + s.ovr + '</b> · ' + esc((q.posicoes || [q.posicao])[0] || '') + '</p><p class="ca-armas">' + (q.armas || []).slice(0, 4).map(function (a) { return '<span class="chip">' + esc(a) + '</span>'; }).join(' ') + '</p></div></div><div class="x1-botoes"><button type="button" class="btn" data-acao="jogar">⚔ Jogar o x1</button><button type="button" class="btn btn-2" data-acao="desistir">Encerrar carreira</button></div>';
      $('.ca-pre h3').focus(); BL.anunciar('Degrau ' + (est.i + 1) + ': ' + q.nome + ', Geral ' + s.ovr);
    }
  }
  /* ---- partida (mini-player com Pausar e Pular; movimento reduzido não muda o ritmo) ---- */
  function linha(txt, cls) { var li = document.createElement('li'); li.className = cls || ''; li.textContent = txt; $('.ca-log').appendChild(li); }
  function aplicar(e, quieto) {
    var nome = jogo.nome;
    if (e.t === 'lance') $('.ca-n').textContent = (e.ouro ? 'Gol de ouro · ' : '') + 'Lance ' + e.n + (e.ouro ? '' : ' de ' + M.LANCES);
    else if (e.t === 'duelo') linha(e.rot + ': ' + nome(jogo.J[0].p) + ' ' + (e.quem === 0 ? e.va : e.vd) + ' × ' + (e.quem === 0 ? e.vd : e.va) + ' ' + nome(jogo.J[1].p), 'duelo');
    else if (e.t === 'gol') { $('.ca-ga').textContent = e.placar[0]; $('.ca-gb').textContent = e.placar[1]; linha(e.txt, 'gol ' + (e.lado ? 'b' : 'a')); if (!quieto) { BL.anunciar(e.txt + ' ' + e.placar[0] + ' a ' + e.placar[1] + '.'); falar(e.txt); } }
    else if (e.txt) { linha(e.txt, e.t); if (!quieto && (e.t === 'flow' || e.t === 'ouro')) { BL.anunciar(e.txt); falar(e.txt); } }
  }
  function passo() {
    if (pausado) return;
    var e = fila.shift(); if (!e) return final();
    aplicar(e);
    timer = setTimeout(passo, e.t === 'gol' ? 1500 : (e.t === 'lance' ? 450 : 800));
  }
  function setPausa(on) {
    pausado = on; clearTimeout(timer);
    var b = $('[data-acao="pausar"]'); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '▶ Retomar' : '❚❚ Pausar';
    if (BL.voz && BL.voz.on) on ? BL.voz.pause() : BL.voz.resume();
    if (!on && fila.length) timer = setTimeout(passo, 250);
    BL.anunciar(on ? 'Partida pausada' : 'Partida retomada');
  }
  function jogar() {
    var q = rivais()[est.i];
    jogo = M.simular(eu(), q, est.seed + ':' + est.i, { sA: stats(eu(), est.armas) }); fila = jogo.ev.slice(); pausado = false;
    mostrar('jogo');
    $('.ca-jogo h3').textContent = M.curto(eu(), q) + ' × ' + M.curto(q, eu());
    $('.ca-pl-a').textContent = M.curto(eu(), q); $('.ca-pl-b').textContent = M.curto(q, eu());
    $('.ca-ga').textContent = '0'; $('.ca-gb').textContent = '0'; $('.ca-n').textContent = 'Apito inicial'; $('.ca-log').innerHTML = '';
    var b = $('[data-acao="pausar"]'); b.setAttribute('aria-pressed', 'false'); b.textContent = '❚❚ Pausar';
    $('.ca-jogo h3').focus(); BL.anunciar('Começa: ' + eu().nome + ' contra ' + q.nome + '.'); falar(eu().nome + ' contra ' + q.nome);
    timer = setTimeout(passo, 700);
  }
  function pular() { clearTimeout(timer); pausado = false; if (BL.voz && BL.voz.on) BL.voz.cancel(); while (fila.length) aplicar(fila.shift(), true); final(); }
  function final() {
    clearTimeout(timer); if (!jogo) return;
    var g = jogo, q = rivais()[est.i], venceu = g.venc === 0, txt = (venceu ? 'Vitória! ' : 'Derrota. ') + M.curto(eu(), q) + ' ' + g.J[0].g + ' × ' + g.J[1].g + ' ' + M.curto(q, eu()) + (g.penalti ? ' (pênalti)' : g.ouro ? ' (gol de ouro)' : '') + '.';
    jogo = null; falar(txt);
    var nova = venceu && window.BL_ALBUM ? BL_ALBUM.ganhar(q.id, 'carreira', true) : false;
    var link = 'duelo.html?a=' + est.j + '&b=' + q.id + '&seed=' + encodeURIComponent(est.seed + ':' + est.i);
    if (!venceu) {
      est.fim = 'perdeu'; salvar(); recorde(est.i);
      fim('<h3 tabindex="-1">💥 Eliminado no degrau ' + (est.i + 1) + '</h3><p>' + esc(txt) + '</p><p>' + esc(eu().nome) + ' sobreviveu a <b>' + est.i + ' de ' + PASSOS + '</b> x1.</p>', link);
      return;
    }
    est.i++;
    if (est.i >= PASSOS) {
      est.fim = 'venceu'; salvar(); recorde(PASSOS);
      fim('<h3 tabindex="-1">🏆 ' + esc(eu().nome) + ' sobreviveu ao Blue Lock!</h3><p>' + esc(txt) + '</p><p>10 x1 seguidos, ' + est.armas.length + ' Armas devoradas. De ' + eu().rankingInicio + 'º a número 1 (na simulação).</p>' + albumNota(nova), link);
      return;
    }
    salvar(); cabecalho();
    var ja = est.armas.concat(eu().armas || []).map(BL.chaveArma), cands = (q.armas || []).filter(function (a) { return ja.indexOf(BL.chaveArma(a)) < 0; });
    var r = M.rng(est.seed + ':a' + est.i); cands = cands.map(function (a) { return [r(), a]; }).sort(function (x, y) { return x[0] - y[0]; }).slice(0, 3).map(function (x) { return x[1]; });
    mostrar('escolha');
    $('.ca-escolha').innerHTML = '<h3 tabindex="-1">✅ ' + esc(txt) + '</h3>' + albumNota(nova) + '<p><a href="' + esc(link) + '">Rever este x1 na tela cheia</a></p>' +
      '<fieldset class="ca-op"><legend>Devore uma Arma de ' + esc(q.nome) + '</legend>' + (cands.length ? cands.map(function (a, i) { return '<label class="cp-op"><input type="radio" name="arma" value="' + esc(a) + '"' + (i ? '' : ' checked') + '> <span>' + esc(a) + ' <small>' + esc(efeito(a)) + '</small></span></label>'; }).join('') : '') +
      (cands.length ? '' : '<p class="ca-dica">A ficha de ' + esc(q.nome) + ' não lista Armas novas para você.</p>') + '<label class="cp-op"><input type="radio" name="arma" value=""' + (cands.length ? '' : ' checked') + '> <span>Fome de gol <small>+2 Ego · bônus do jogo, não é Arma da ficha</small></span></label></fieldset><div class="x1-botoes"><button type="button" class="btn" data-acao="devorar">🍖 Devorar e seguir</button></div>';
    $('.ca-escolha h3').focus(); BL.anunciar(txt + ' Escolha uma Arma para devorar.');
  }
  function efeito(a) {
    var t = BL.norm(a), l = []; for (var k in M.CHAVES) if (M.CHAVES[k].test(t)) l.push('+3 ' + M.ATR.filter(function (x) { return x[0] === k; })[0][1]);
    if (/flow/.test(t)) l.push('+2 em tudo'); return l.length ? l.join(', ') : '+2 Ego';
  }
  function albumNota(nova) { return nova ? '<p class="album-nova">🃏 Figurinha nova no <a href="album.html">Álbum do Ego</a>!</p>' : ''; }
  function fim(html, link) {
    cabecalho(); mostrar('fim');
    $('.ca-fim').innerHTML = html + '<div class="x1-botoes"><button type="button" class="btn" data-acao="de-novo">↻ Mesmo jogador, novos rivais</button><button type="button" class="btn btn-2" data-acao="trocar">Outro novato</button><button type="button" class="btn btn-2" data-acao="copiar">Copiar link desta carreira</button><a class="btn btn-2" href="' + esc(link) + '">Ver o último x1</a></div>';
    $('.ca-fim h3').focus(); BL.anunciar($('.ca-fim h3').textContent);
  }
  function recorde(n) { var r = lerLS(CHR); if (!r || n > r.passos) gravarLS(CHR, { passos: n, j: est.j }); }
  raiz.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var a = b.dataset.acao;
    if (a === 'sortear') novo(novatos[Math.floor(Math.random() * novatos.length)], M.novaSemente());
    if (a === 'continuar') { var sv = lerLS(CH); if (sv && por[sv.j]) { est = sv; render('pre'); } }
    if (a === 'jogar') jogar();
    if (a === 'pausar') setPausa(!pausado);
    if (a === 'pular') pular();
    if (a === 'devorar') { var r = raiz.querySelector('input[name=arma]:checked'); est.armas.push(r && r.value ? r.value : 'Fome de gol'); salvar(); render('pre'); }
    if (a === 'de-novo') novo(eu(), M.novaSemente());
    if (a === 'trocar' || a === 'desistir') { clearTimeout(timer); if (a === 'desistir') { est.fim = 'desistiu'; salvar(); recorde(est.i); } $('.ca-run').hidden = true; $('.ca-inicio').hidden = false; $('.ca-cont').hidden = true; try { history.replaceState(null, '', location.pathname); } catch (x) {} $('#ca-j').focus(); }
    if (a === 'copiar') BL.copiar(BL.urlPublica('carreira.html', '?j=' + est.j + '&seed=' + encodeURIComponent(est.seed) + (BL.versao() ? '&v=' + BL.versao() : '')), b);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === ' ' && !$('.ca-jogo').hidden && !e.target.closest('input,button,a,textarea,select')) { e.preventDefault(); setPausa(!pausado); }
  });
})();
