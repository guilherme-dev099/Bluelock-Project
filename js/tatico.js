/* Campo do Ego (rodada 2, #3): interface do jogo tático por turnos. Regras em js/tatico-regras.js. Script clássico. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, app = $('#campo'); if (!app || !window.BL || !window.BL_TAT || !window.BLX1) return;
  var T = BL_TAT, M = BLX1, esc = BL.esc, PRE = (window.BL_TIER_PRE || []).filter(function (x) { return x.ids.length >= 5; });
  var por = {}, todos = [], st = null, modo = null, foco = [0, 0], semente = '', qs = new URLSearchParams(location.search), fimAvisado = false;
  function curto(p) { return M.curto ? M.curto(p) : p.nome.split(' ').pop(); }
  function time(i, seed, excl) {
    var ids = i >= 0 && PRE[i] ? PRE[i].ids : null, pool = (ids ? ids.map(function (id) { return por[id]; }).filter(Boolean) : todos.filter(function (p) { return p.img; }));
    pool = pool.filter(function (p) { return !excl || excl.indexOf(p.id) < 0; }).slice().sort(function (a, b) { return M.atributos(b).ovr - M.atributos(a).ovr; });
    if (!ids) { var h = M.hash ? M.hash(seed) : 7, out = []; for (var k = 0; out.length < 5 && k < 400; k++) { var p = pool[(h + k * 7919) % Math.min(pool.length, 80)]; if (out.indexOf(p) < 0) out.push(p); } pool = out; }
    return pool.slice(0, 5).map(function (p) { return { id: p.id, nome: p.nome, curto: curto(p), armas: p.armas }; });
  }
  function opcoes(sel, v) { sel.innerHTML = PRE.map(function (x, i) { return '<option value="' + i + '"' + (String(i) === v ? ' selected' : '') + '>' + esc(x.nome) + '</option>'; }).join('') + '<option value="-1"' + (v === '-1' ? ' selected' : '') + '>Sorteio de egoístas</option>'; }
  function previa() {
    ['a', 'b'].forEach(function (l) {
      var t = l === 'a' ? time(+$('#cg-a').value, semente + 'a') : time(+$('#cg-b').value, semente + 'b', time(+$('#cg-a').value, semente + 'a').map(function (j) { return j.id; }));
      $('.cg-prev-' + l).innerHTML = t.map(function (j) { var hab = T.habilidades(j); return '<li><b>' + esc(j.nome) + '</b>' + (hab.length ? '<span>' + hab.map(function (h) { return esc(T.rotHab(h).split(':')[0]); }).join(' · ') + '</span>' : '') + '</li>'; }).join('');
    });
  }
  function comecar() {
    if (!semente) semente = Math.random().toString(36).slice(2, 8);
    var ia = +$('#cg-a').value, ib = +$('#cg-b').value;
    var tA = time(ia, semente + 'a'); st = T.novo(tA, time(ib, semente + 'b', tA.map(function (j) { return j.id; })), semente, function (p) { return M.atributos(por[p.id]); });
    fimAvisado = false; modo = null;
    try { history.replaceState(null, '', location.pathname + '?a=' + ia + '&b=' + ib + '&seed=' + semente); } catch (e) {}
    $('.cg-setup').hidden = true; $('.cg-jogo').hidden = false;
    var c = st.J[0][st.bola]; foco = [c.x, c.y];
    render(); BL.anunciar('Começa o Campo do Ego. ' + st.log[0] + ' Use as setas no campo ou a lista de ações.');
    $('.cg-acoes h3').focus();
  }
  function rotuloCasa(x, y) {
    var o = T.ocupada(st, x, y), b = 'Coluna ' + (x + 1) + ', linha ' + (y + 1);
    if (!o) return b + ', vazia';
    var j = st.J[o[0]][o[1]]; return b + ': ' + j.nome + (o[0] ? ' (rival)' : ' (seu time)') + (st.posse === o[0] && st.bola === o[1] ? ', com a bola' : '');
  }
  function render(mover) {
    var ac = T.acoes(st), meu = st.posse === 0 && !st.fim, alvo = {};
    if (meu) ac.forEach(function (a) { if (a.t === 'mover' && modo === 'mover') alvo[a.x + ',' + a.y] = a; if (a.t === 'passar') alvo[st.J[0][a.k].x + ',' + st.J[0][a.k].y] = a; if (a.t === 'driblar') alvo[st.J[1][a.k].x + ',' + st.J[1][a.k].y] = a; });
    var g = '';
    for (var y = 0; y < T.H; y++) {
      g += '<div role="row" class="cg-lin">';
      for (var x = 0; x < T.W; x++) {
        var o = T.ocupada(st, x, y), cl = 'cg-c', ct = '';
        if ((x === 0 || x === T.W - 1) && y >= T.GOL[0] && y <= T.GOL[1]) cl += ' cg-area';
        if (o) { var j = st.J[o[0]][o[1]]; cl += o[0] ? ' cg-riv' : ' cg-meu'; if (st.posse === o[0] && st.bola === o[1]) cl += ' cg-bola'; if (j.batido) cl += ' cg-bat'; ct = '<span class="cg-tok" aria-hidden="true">' + esc(j.curto.slice(0, 6)) + '</span>'; }
        var a = alvo[x + ',' + y]; if (a) cl += ' cg-alvo cg-alvo-' + a.t;
        var f = x === foco[0] && y === foco[1];
        g += '<div role="gridcell" class="' + cl + '" data-x="' + x + '" data-y="' + y + '" tabindex="' + (f ? 0 : -1) + '" aria-label="' + esc(rotuloCasa(x, y) + (a ? '. ' + rotAcao(a) : '')) + '">' + ct + '</div>';
      }
      g += '</div>';
    }
    $('.cg-grade').innerHTML = g;
    $('.cg-placar').textContent = 'Você ' + st.placar[0] + ' × ' + st.placar[1] + ' Rival';
    $('.cg-turno').textContent = st.fim ? 'Fim de jogo' : 'Turno ' + (st.t + 1) + ' de ' + st.max + ' · bola com ' + (st.posse ? 'o rival' : 'você');
    ['0', '1'].forEach(function (l) { var m = $('.cg-flow-' + l); m.value = st.flow[l]; m.textContent = st.flow[l]; $('.cg-flow-t-' + l).textContent = st.flowOn[l] ? 'FLOW!' : st.flow[l] + '%'; });
    app.classList.toggle('cg-emflow', st.flowOn[0]);
    var lista = '';
    if (st.fim) lista = '';
    else if (meu) {
      var c = st.J[0][st.bola];
      lista = '<p class="cg-port">Com a bola: <b>' + esc(c.nome) + '</b>' + (c.hab.length ? ' · ' + c.hab.map(function (h) { return esc(T.rotHab(h)); }).join('; ') : '') + '</p><ul class="cg-lista">' +
        ac.filter(function (a) { return a.t !== 'mover'; }).sort(function (a, b) { return b.p - a.p; }).map(function (a) { return '<li><button type="button" class="btn btn-2" data-ac="' + esc(JSON.stringify(a)) + '">' + esc(rotAcao(a)) + '</button></li>'; }).join('') +
        '<li><button type="button" class="btn btn-2" data-modo="mover" aria-pressed="' + (modo === 'mover') + '">' + (modo === 'mover' ? 'Escolha a casa no campo (Esc cancela)' : '➜ Conduzir: escolher casa') + '</button></li></ul>';
    } else lista = '<p class="cg-port">O rival tem a bola. Escolha a postura da sua defesa para o próximo lance:</p><ul class="cg-lista">' +
      [['pressionar', '🔥 Pressionar o portador (mais chance de roubar, abre espaço)'], ['marcar', '🛡 Marcar individualmente'], ['recuar', '🧱 Recuar perto da área (chute rival −10%)']].map(function (p) { return '<li><button type="button" class="btn btn-2" data-postura="' + p[0] + '">' + p[1] + '</button></li>'; }).join('') + '</ul>';
    $('.cg-lista-box').innerHTML = lista;
    $('.cg-log').innerHTML = st.log.slice(-8).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    $('.cg-fim').hidden = !st.fim;
    if (st.fim && !fimAvisado) {
      fimAvisado = true; var v = st.placar[0] > st.placar[1];
      $('.cg-fim h3').textContent = v ? '🏆 Vitória ' + st.placar[0] + ' × ' + st.placar[1] : st.placar[0] === st.placar[1] ? 'Empate ' + st.placar[0] + ' × ' + st.placar[1] : 'Derrota ' + st.placar[0] + ' × ' + st.placar[1];
      if (window.blEv) blEv('tatico', { v: v, gols: st.placar[0] });
      BL.anunciar($('.cg-fim h3').textContent); $('.cg-fim h3').focus();
    }
  }
  function rotAcao(a) {
    var c = st.J[st.posse][st.bola], pc = Math.round(a.p * 100) + '%';
    if (a.t === 'chutar') return '⚽ ' + c.curto + ': chutar ao gol (' + pc + ')';
    if (a.t === 'passar') return '↗ ' + c.curto + ': passar para ' + st.J[st.posse][a.k].curto + ' (' + pc + ')';
    if (a.t === 'driblar') return '↯ ' + c.curto + ': driblar ' + st.J[1 - st.posse][a.k].curto + ' (' + pc + ')';
    return '➜ conduzir até a coluna ' + (a.x + 1) + ', linha ' + (a.y + 1);
  }
  function jogar(a) {
    var n = st.log.length; T.aplicar(st, a); modo = null;
    var c = st.J[st.posse][st.bola]; foco = [c.x, c.y];
    render(); BL.anunciar(st.log.slice(n).join(' '));
  }
  function rival(postura) { st.postura = postura; jogar(T.ia(st)); }
  app.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b && b.dataset.ac) return jogar(JSON.parse(b.dataset.ac));
    if (b && b.dataset.modo) { modo = modo === 'mover' ? null : 'mover'; render(); BL.anunciar(modo ? 'Escolha a casa no campo com as setas e Enter. Casas possíveis estão marcadas.' : 'Cancelado'); if (modo) { var f = $('.cg-c[tabindex="0"]'); if (f) f.focus(); } return; }
    if (b && b.dataset.postura) return rival(b.dataset.postura);
    if (b && b.dataset.acao === 'comecar') return comecar();
    if (b && b.dataset.acao === 'revanche') { semente = Math.random().toString(36).slice(2, 8); return comecar(); }
    if (b && b.dataset.acao === 'trocar') { semente = Math.random().toString(36).slice(2, 8); previa(); $('.cg-setup').hidden = false; $('.cg-jogo').hidden = true; $('#cg-a').focus(); return; }
    if (b && b.dataset.acao === 'link') return BL.copiar(BL.urlPublica('campo.html', location.search), b, 'Link copiado');
    var c = e.target.closest('.cg-c'); if (c) casa(+c.dataset.x, +c.dataset.y);
  });
  function casa(x, y) {
    foco = [x, y]; if (st.fim || st.posse !== 0) { render(); return; }
    var ac = T.acoes(st), a = ac.filter(function (a) {
      if (a.t === 'mover') return modo === 'mover' && a.x === x && a.y === y;
      if (a.t === 'passar') return st.J[0][a.k].x === x && st.J[0][a.k].y === y;
      if (a.t === 'driblar') return st.J[1][a.k].x === x && st.J[1][a.k].y === y;
      return false;
    })[0];
    if (a) jogar(a); else { var c = st.J[0][st.bola]; if (c.x === x && c.y === y) { modo = 'mover'; render(); var f = $('.cg-c[tabindex="0"]'); if (f) f.focus(); BL.anunciar('Escolha a casa para conduzir.'); } }
  }
  app.addEventListener('keydown', function (e) {
    var c = e.target.closest && e.target.closest('.cg-c'); if (!c) return;
    var x = +c.dataset.x, y = +c.dataset.y, d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d) { e.preventDefault(); x = Math.max(0, Math.min(T.W - 1, x + d[0])); y = Math.max(0, Math.min(T.H - 1, y + d[1])); foco = [x, y]; var n = $('.cg-c[data-x="' + x + '"][data-y="' + y + '"]'); c.tabIndex = -1; n.tabIndex = 0; n.focus(); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); casa(x, y); var f = $('.cg-c[data-x="' + foco[0] + '"][data-y="' + foco[1] + '"]'); if (f) f.focus(); }
    if (e.key === 'Escape' && modo) { modo = null; render(); BL.anunciar('Cancelado'); }
  });
  BL.personagens().then(function (ps) {
    todos = ps; ps.forEach(function (p) { por[p.id] = p; });
    var qa = qs.get('a'), qb = qs.get('b'); semente = qs.get('seed') || Math.random().toString(36).slice(2, 8);
    opcoes($('#cg-a'), qa != null ? qa : '0'); opcoes($('#cg-b'), qb != null ? qb : String(Math.min(1, PRE.length - 1)));
    previa(); $('#cg-a').addEventListener('change', previa); $('#cg-b').addEventListener('change', previa);
    $('.cg-setup').hidden = false; $('.cg-carregando').hidden = true;
    if (qs.get('seed')) comecar();
  });
})();
