/* "Seis graus de Isagi" (graus.html?de=isagi&ate=kaiser): caminho mais curto por times em comum + desafio "Ligue em ≤ 3" */
(function () {
  'use strict';
  var BL = window.BL, raiz = document.querySelector('.gr');
  if (!BL || !BL.grafo || !BL.combobox || !raiz) return;
  var esc = BL.esc, $ = function (s) { return raiz.querySelector(s); };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    var G = BL.grafo(todos), adj = G.adj;
    var ligados = todos.filter(function (p) { return Object.keys(adj[p.id]).length; });
    var qs = new URLSearchParams(location.search);
    var sel = { de: por[qs.get('de')] || por.isagi, ate: por[qs.get('ate')] || null }, alt = Math.max(0, parseInt(qs.get('c'), 10) || 0);
    raiz.classList.add('pronto');
    var ruins = ['de', 'ate'].filter(function (k) { return qs.get(k) && !por[qs.get(k)]; });
    if (ruins.length) BL.avisoUrl(raiz, 'Este link tem ' + (ruins.length > 1 ? 'personagens que não existem' : 'um personagem que não existe') + ' nas fichas (' + ruins.map(function (k) { return '“' + qs.get(k) + '”'; }).join(', ') + ')' + (qs.get('de') && !por[qs.get('de')] ? '; começamos pelo Isagi.' : '.'));
    if (sel.ate) BL.avisoVersao(raiz);
    var staff = function (id) { return !por[id].jogador; };
    var sub = function (p) { var n = Object.keys(adj[p.id]).length; return n ? n + ' companheiros nas fichas' : 'sem vínculo nas fichas'; };
    function mostrarSel() {
      ['de', 'ate'].forEach(function (k) {
        var p = sel[k], el = $('.gr-sel-' + k);
        el.innerHTML = p ? '<img src="' + esc(BL.thumb(p)) + '" alt="" width="40" height="40"> <b>' + esc(p.nome) + '</b>' : '<span class="gr-nada">ninguém escolhido</span>';
        $('#gr-' + k).placeholder = p ? 'Trocar ' + p.nome + '…' : 'Buscar personagem…';
      });
    }
    ['de', 'ate'].forEach(function (k) {
      BL.combobox($('#gr-' + k), $('#gr-' + k + '-lista'), { fonte: function () { return todos; }, sub: sub, abrirNoFoco: false,
        escolher: function (p) { sel[k] = p; alt = 0; mostrarSel(); BL.anunciar((k === 'de' ? 'De: ' : 'Até: ') + p.nome); if (sel.de && sel.ate) ligar(); } });
    });
    function cadeiaHtml(c) {
      var h = '';
      c.forEach(function (id, i) {
        var p = por[id];
        if (i) { var l = BL.melhorLaco(adj, c[i - 1], id), n = adj[c[i - 1]][id].length; h += '<li class="aresta" style="--i:' + (2 * i - 1) + '"><span class="sr-only">' + (staff(c[i - 1]) || staff(id) ? 'estiveram juntos em' : 'jogaram juntos em') + ' </span>' + esc(l.time) + ' <small>(' + esc(BL.FASE_CURTA[l.fase] || l.fase) + ')' + (n > 1 ? ' +' + (n - 1) : '') + '</small></li>'; }
        h += '<li class="no" style="--i:' + (2 * i) + '"><a href="' + esc(p.url) + '"><img src="' + esc(BL.thumb(p)) + '" alt="" width="40" height="40"> ' + esc(p.nome) + '</a></li>';
      });
      return h;
    }
    function ligar(foco) {
      var res = $('.gr-res'), A = sel.de, B = sel.ate;
      if (!A || !B) return;
      try { history.replaceState(null, '', '?de=' + A.id + '&ate=' + B.id + (alt ? '&c=' + alt : '') + (window.BL_VERSAO ? '&v=' + window.BL_VERSAO : '')); } catch (e) {}
      res.hidden = false;
      var r = BL.bfs(adj, A.id), c = null, total = 1;
      if (A.id === B.id) c = [A.id];
      else if (B.id in r.dist) {
        /* quantos caminhos mínimos existem? (conta pelos pais) */
        var conta = {}; var cnt = function (v) { if (v === A.id) return 1; if (v in conta) return conta[v]; var s = 0; r.pais[v].forEach(function (u) { s += cnt(u); }); return (conta[v] = s); };
        total = cnt(B.id);
        /* caminho nº k (k = alt % total), em ordem fixa: "Outro caminho" percorre todos sem repetir */
        var k = alt % total, v = B.id; c = [v];
        while (v !== A.id) { var ps = r.pais[v]; for (var j = 0; j < ps.length; j++) { var n = cnt(ps[j]); if (k < n) { v = ps[j]; break; } k -= n; } c.unshift(v); }
      }
      var t = $('#gr-res-t'), ol = $('.gr-cadeia');
      if (!c) {
        t.textContent = 'Sem caminho entre ' + A.nome + ' e ' + B.nome;
        ol.innerHTML = '<li class="gr-sem">' + (Object.keys(adj[A.id]).length && Object.keys(adj[B.id]).length ? 'Os dois estão em grupos sem ligação nas fichas.' : 'Sem time em comum registrado nas fichas para ' + esc(!Object.keys(adj[A.id]).length ? A.nome : B.nome) + '.') + '</li>';
        $('[data-acao="outro"]').hidden = true;
        BL.anunciar(t.textContent);
      } else {
        var g = c.length - 1;
        t.textContent = g === 0 ? 'É a mesma pessoa: 0 graus' : g + (g === 1 ? ' grau' : ' graus') + ' entre ' + A.nome + ' e ' + B.nome + (total > 1 ? ' · caminho ' + (alt % total + 1) + ' de ' + total + ' mínimos' : '');
        ol.innerHTML = cadeiaHtml(c);
        $('[data-acao="outro"]').hidden = total < 2;
        BL.anunciar(g + (g === 1 ? ' grau: ' : ' graus: ') + c.map(function (id) { return por[id].nome; }).join(', '));
      }
      if (foco) t.focus();
    }
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return;
      var a = b.dataset.acao;
      if (a === 'ligar') { if (!sel.ate) { $('#gr-ate').focus(); BL.anunciar('Escolha o personagem de destino'); return; } alt = 0; ligar(true); }
      if (a === 'trocar') { if (!sel.ate) { $('#gr-ate').focus(); BL.anunciar('Escolha primeiro o personagem de destino'); return; } var t = sel.de; sel.de = sel.ate; sel.ate = t; alt = 0; mostrarSel(); ligar(); }
      if (a === 'sortear') { sel.ate = ligados[Math.floor(Math.random() * ligados.length)]; alt = 0; mostrarSel(); ligar(true); }
      if (a === 'outro') { alt++; ligar(); }
      if (a === 'copiar') BL.copiar(BL.urlPublica('graus.html', location.search), b);
      if (a === 'novo-desafio') novoDesafio(Math.random().toString(36).slice(2, 7), true);
      if (a === 'solucao') revelarSolucao();
    });
    mostrarSel(); if (sel.ate) ligar();

    /* ----- "Ligue em ≤ 3" ----- */
    var D = null;
    function novoDesafio(seed, foco) {
      var rnd = window.BLX1 ? BLX1.rng('graus:' + seed) : Math.random, cand = [];
      for (var t = 0; t < 400 && !cand.length; t++) {
        var a = ligados[Math.floor(rnd() * ligados.length)], r = BL.bfs(adj, a.id);
        cand = Object.keys(r.dist).filter(function (k) { return r.dist[k] === 3; });
        if (cand.length) D = { a: a, b: por[cand[Math.floor(rnd() * cand.length)]], atual: a.id, passos: [a.id], erros: 0, fim: false };
      }
      $('.gr-d-sol').hidden = true; $('.gr-d-sol ol').innerHTML = '';
      renderDesafio(); if (!foco) return; $('#gr-d-t').focus();
      BL.anunciar('Ligue ' + D.a.nome + ' a ' + D.b.nome + ' em até 3 passos.');
    }
    function renderDesafio() {
      var box = $('.gr-desafio-corpo');
      box.innerHTML = '<p class="gr-d-alvo">Ligue <b>' + esc(D.a.nome) + '</b> a <b>' + esc(D.b.nome) + '</b> em até <b>3</b> passos, escolhendo a cada vez alguém que dividiu time (como jogador ou na comissão) com o último da corrente.</p>' +
        '<ol class="gr-cadeia gr-d-cadeia">' + cadeiaHtml(D.passos) + (D.fim ? '' : '<li class="no alvo"><span><img src="' + esc(BL.thumb(D.b)) + '" alt="" width="40" height="40"> ' + esc(D.b.nome) + ' ?</span></li>') + '</ol>' +
        '<p class="gr-d-st"></p>';
      $('.gr-d-busca').hidden = D.fim;
    }
    BL.combobox($('#gr-d'), $('#gr-d-lista'), { fonte: function () { return todos; }, sub: sub, filtro: function (p) { return !D || D.passos.indexOf(p.id) < 0; },
      escolher: function (p) {
        if (!D || D.fim) return;
        var st = function (m) { var e = $('.gr-d-st'); if (e) e.textContent = m; BL.anunciar(m); };
        if (!adj[D.atual][p.id]) { D.erros++; st(p.nome + ' não esteve no mesmo time que ' + por[D.atual].nome + ' nas fichas. Tente outro.'); return; }
        D.passos.push(p.id); D.atual = p.id;
        var n = D.passos.length - 1;
        if (p.id === D.b.id) { D.fim = true; renderDesafio(); st('🏆 Ligou em ' + n + (n === 1 ? ' passo' : ' passos') + (D.erros ? ' (' + D.erros + ' tentativa' + (D.erros > 1 ? 's' : '') + ' sem vínculo)' : '') + '!'); return; }
        if (n >= 3) { D.fim = true; renderDesafio(); st('Acabaram os 3 passos. Veja uma solução abaixo.'); revelarSolucao(); return; }
        renderDesafio(); st('Agora ' + p.nome + '. Faltam ' + (3 - n) + ' passos.'); $('#gr-d').focus();
      } });
    function revelarSolucao() {
      if (!D) return; var c = BL.caminho(BL.bfs(adj, D.a.id), D.b.id);
      $('.gr-d-sol').hidden = false; $('.gr-d-sol ol').innerHTML = cadeiaHtml(c);
    }
    novoDesafio('dia-' + new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()));

    /* ----- números ----- */
    var r0 = BL.bfs(adj, 'isagi'), dist = {}; Object.keys(r0.dist).forEach(function (k) { var d = r0.dist[k]; dist[d] = (dist[d] || 0) + 1; });
    var top = todos.slice().sort(function (a, b) { return Object.keys(adj[b.id]).length - Object.keys(adj[a.id]).length || a.nome.localeCompare(b.nome); }).slice(0, 10);
    $('.gr-num').innerHTML = '<h2>Número de Isagi</h2><p>Quantos passos separam cada personagem do Isagi, só por times em comum nas fichas.</p><ul class="dd-est">' +
      Object.keys(dist).filter(function (k) { return k > 0; }).map(function (k) { return '<li><b>' + dist[k] + '</b> a ' + k + (k == 1 ? ' grau' : ' graus') + '</li>'; }).join('') +
      '<li><b>' + (todos.length - Object.keys(r0.dist).length) + '</b> sem caminho</li></ul>' +
      '<h2>Mais conectados</h2><ol class="gr-top">' + top.map(function (p) { return '<li><a href="' + esc(p.url) + '"><img src="' + esc(BL.thumb(p)) + '" alt="" width="32" height="32"> ' + esc(p.nome) + '</a> <small>' + Object.keys(adj[p.id]).length + ' companheiros</small></li>'; }).join('') + '</ol>';
  }).catch(function (e) { console.warn('Seis graus indisponível:', e); });
})();
