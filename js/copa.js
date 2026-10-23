/* "Copa do Ego" — mata-mata de 8/16/32 decidido com o motor do x1 (js/x1-motor.js). Determinístico pela semente:
   copa.html?p=time-z&t=16&seed=k3x9 reproduz o mesmo torneio. Resultados simulados, não da obra. */
(function () {
  'use strict';
  var BL = window.BL, M = window.BLX1, raiz = document.querySelector('.cp');
  if (!BL || !M || !raiz) return;
  var esc = BL.esc, $ = function (s) { return raiz.querySelector(s); };
  var temFase = function (p, nome, re) { return p.fases.some(function (f) { return f.fase === nome && re.test(f.time); }); };
  var nel = function (p) { var f = p.fases.filter(function (x) { return x.fase === 'Neo Egoist League'; })[0]; return f && f.times[0] ? f.times[0] : null; };
  var PRESETS = {
    'time-z': { nome: 'Time Z', desc: 'quem jogou no Time Z na 1ª Seleção', f: function (t) { return t.filter(function (p) { return temFase(p, '1ª Seleção', /^Time Z\b/); }); } },
    'eleven': { nome: 'Blue Lock Eleven', desc: 'quem esteve no Blue Lock Eleven contra a Sub-20', f: function (t) { return t.filter(function (p) { return temFase(p, 'Blue Lock × Sub-20', /Blue Lock Eleven/); }); } },
    'sub20': { nome: 'Japão Sub-20 atual', desc: 'quem está na Japão Sub-20 na situação mais recente', f: function (t) { return t.filter(function (p) { return temFase(p, 'Atual', /Japão Sub-20/); }); } },
    'nel': { nome: 'Clubes da NEL', desc: 'os melhores de cada clube da NEL pelo Geral estimado, completando com sorteados dos clubes', nel: true },
    'aleatorio': { nome: 'Aleatória', desc: 'jogadores sorteados entre todos com ficha de jogador' },
    'custom': { nome: 'Personalizada', desc: 'você escolhe os participantes' }
  };
  var NOME_R = { 1: 'Final', 2: 'Semifinal', 4: 'Quartas de final', 8: 'Oitavas de final', 16: 'Dezesseis-avos de final' };
  function embaralhar(l, rnd) { l = l.slice(); for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = l[i]; l[i] = l[j]; l[j] = t; } return l; }
  var pot2 = function (n) { return n < 2 ? 0 : Math.pow(2, Math.floor(Math.log(n) / Math.LN2 + 1e-9)); };

  BL.personagens().then(function (todos) {
    var jog = todos.filter(function (p) { return p.jogador; }), por = {};
    todos.forEach(function (p) { por[p.id] = p; });
    var qs = new URLSearchParams(location.search);
    var form = $('.cp-form'), tamSel = $('#cp-tam'), info = $('.cp-info'), puro = $('#cp-puro');
    var custom = (qs.get('ids') || '').split(',').filter(function (id) { return por[id] && por[id].jogador; });
    var estado = null, timer = null, pausado = false, fila = [];
    raiz.classList.add('pronto');
    BL.avisoVersao(raiz);
    if (qs.get('p') && PRESETS[qs.get('p')]) form.querySelector('input[name=p][value="' + qs.get('p') + '"]').checked = true;
    if (/^(8|16|32)$/.test(qs.get('t') || '')) tamSel.value = qs.get('t');
    if (qs.get('puro') === '1') puro.checked = true;
    var preset = function () { return form.querySelector('input[name=p]:checked').value; };

    function participantes(pid, tam, seed) {
      var rnd = M.rng(seed + ':sorteio'), P = PRESETS[pid], l;
      if (pid === 'custom') l = custom.map(function (id) { return por[id]; });
      else if (pid === 'aleatorio') l = jog;
      else if (P.nel) {
        var clubes = {}, base = [], resto = [];
        jog.forEach(function (p) { var c = nel(p); if (c) (clubes[c] = clubes[c] || []).push(p); });
        var k = { 8: 1, 16: 2, 32: 5 }[tam];
        Object.keys(clubes).sort().forEach(function (c) {
          var o = clubes[c].slice().sort(function (a, b) { return M.atributos(b, puro.checked).ovr - M.atributos(a, puro.checked).ovr || (a.id < b.id ? -1 : 1); });
          base = base.concat(o.slice(0, k)); resto = resto.concat(o.slice(k));
        });
        return { lista: embaralhar(base.concat(embaralhar(resto, rnd).slice(0, Math.max(0, tam - base.length))), rnd), total: base.length + resto.length };
      } else l = P.f(jog);
      var n = Math.min(tam, pot2(l.length));
      return { lista: embaralhar(l, rnd).slice(0, n), total: l.length };
    }
    function descrever() {
      var pid = preset(), P = PRESETS[pid], tam = +tamSel.value;
      $('.cp-custom').hidden = pid !== 'custom';
      if (pid === 'custom') { renderCustom(); }
      var r = participantes(pid, tam, 'x');
      var n = r.lista.length;
      info.textContent = n < 4 ? (pid === 'custom' ? 'Escolha pelo menos 4 participantes (' + custom.length + ' agora).' : 'Poucos participantes nesta chave.') :
        P.nome + ': ' + P.desc + '. ' + r.total + ' nas fichas → chave de ' + n + (r.total > n ? ' (sorteio decide quem entra)' : '') + '.';
      $('.cp-comecar').disabled = n < 4;
    }
    function renderCustom() {
      var ul = $('.cp-escolhidos');
      ul.innerHTML = custom.map(function (id) { var p = por[id]; return '<li><img src="' + esc(BL.thumb(p)) + '" alt="" width="28" height="28"> ' + esc(p.nome) + ' <button type="button" class="x1-mini" data-tirar="' + esc(id) + '" aria-label="Remover ' + esc(p.nome) + '">×</button></li>'; }).join('');
      $('.cp-n-custom').textContent = custom.length + ' de 32';
    }
    BL.combobox($('#cp-busca'), $('#cp-lista'), {
      fonte: function () { return jog; }, filtro: function (p) { return custom.indexOf(p.id) < 0; },
      sub: function (p) { return ((p.posicoes || [])[0] || '') + (M.timeAtual(p) ? ' · ' + M.timeAtual(p) : ''); },
      escolher: function (p) { if (custom.length >= 32) { BL.anunciar('Máximo de 32'); return; } custom.push(p.id); descrever(); BL.anunciar(p.nome + ' entrou. ' + custom.length + ' participantes.'); }
    });
    $('.cp-escolhidos').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tirar]'); if (!b) return;
      custom = custom.filter(function (id) { return id !== b.dataset.tirar; }); descrever(); $('#cp-busca').focus(); BL.anunciar('Removido. ' + custom.length + ' participantes.');
    });
    form.addEventListener('change', descrever);
    $('[data-acao="custom-sortear"]').addEventListener('click', function () {
      custom = embaralhar(jog, M.rng(M.novaSemente())).slice(0, +tamSel.value).map(function (p) { return p.id; }); descrever();
    });

    /* ---------- torneio ---------- */
    function montar(pid, tam, seed) {
      var vivos = participantes(pid, tam, seed).lista, rodadas = [];
      while (vivos.length > 1) {
        var jogos = [];
        for (var i = 0; i < vivos.length; i += 2) {
          var s = seed + ':' + rodadas.length + ':' + (i / 2), A = vivos[i], B = vivos[i + 1];
          var r = M.simular(A, B, s, { puro: puro.checked });
          jogos.push({ a: A, b: B, s: s, g: [r.J[0].g, r.J[1].g], venc: r.venc, ouro: r.ouro, penalti: r.penalti, flow: (r.J[0].acordou ? 1 : 0) + (r.J[1].acordou ? 1 : 0), w: r.venc ? B : A });
        }
        rodadas.push(jogos); vivos = jogos.map(function (j) { return j.w; });
      }
      return { pid: pid, tam: tam, seed: seed, rodadas: rodadas, campeao: vivos[0] };
    }
    function urlCopa(st) {
      return '?p=' + st.pid + '&t=' + st.tam + '&seed=' + encodeURIComponent(st.seed) + (st.pid === 'custom' ? '&ids=' + custom.join(',') : '') + (puro.checked ? '&puro=1' : '') + (BL.versao() ? '&v=' + BL.versao() : '');
    }
    var linkX1 = function (j) { return 'duelo.html?a=' + j.a.id + '&b=' + j.b.id + '&seed=' + encodeURIComponent(j.s) + (puro.checked ? '&puro=1' : '') + (BL.versao() ? '&v=' + BL.versao() : '') + '&auto=1'; };
    function lado(p, cls, g) {
      return '<span class="cp-l ' + cls + '"><img src="' + esc(BL.thumb(p)) + '" alt="" width="32" height="32"><span class="cp-nome">' + esc(p.nome) + '</span><b class="cp-g">' + (g == null ? '' : g) + '</b></span>';
    }
    function jogoHtml(j, revelado) {
      if (!j) return '<li class="jogo vazio"><span class="cp-l">A definir</span><span class="cp-l">A definir</span></li>';
      if (!revelado) return '<li class="jogo"><div class="cp-cx">' + lado(j.a, '', null) + lado(j.b, '', null) + '</div></li>';
      var rot = j.a.nome + ' ' + j.g[0] + ' a ' + j.g[1] + ' ' + j.b.nome + (j.penalti ? ', no pênalti' : (j.ouro ? ', gol de ouro' : '')) + '. Abre o x1.';
      return '<li class="jogo feito" data-ids="' + esc(j.a.id + ' ' + j.b.id) + '"><a class="cp-cx" href="' + esc(linkX1(j)) + '" aria-label="' + esc(rot) + '">' + lado(j.a, j.venc ? 'perd' : 'venc', j.g[0]) + lado(j.b, j.venc ? 'venc' : 'perd', j.g[1]) +
        (j.ouro ? '<span class="cp-tag" aria-hidden="true">' + (j.penalti ? 'pênalti' : 'gol de ouro') + '</span>' : '') + '</a></li>';
    }
    var feitos = {};
    function renderChave() {
      var st = estado;
      $('.copa').innerHTML = st.rodadas.map(function (jogos, r) {
        var t = NOME_R[jogos.length] || ('Rodada ' + (r + 1));
        return '<section class="rodada" aria-labelledby="cp-r' + r + '"><h3 id="cp-r' + r + '">' + t + '</h3><ol>' + jogos.map(function (j, i) {
          var conhecido = r === 0 || (feitos[(r - 1) + ':' + (2 * i)] && feitos[(r - 1) + ':' + (2 * i + 1)]);
          return jogoHtml(conhecido ? j : null, feitos[r + ':' + i]);
        }).join('') + '</ol></section>';
      }).join('');
    }
    /* B2: troca só o <li> revelado (e a vaga da rodada seguinte), sem refazer a chave: o foco não se perde */
    var liDe = function (r, i) { var rs = $('.copa').querySelectorAll('.rodada')[r]; return rs ? rs.querySelectorAll('.jogo')[i] : null; };
    function trocar(r, i, html, animar) {
      var velho = liDe(r, i); if (!velho) return;
      var tinhaFoco = velho.contains(document.activeElement);
      var tmp = document.createElement('ol'); tmp.innerHTML = html; var novo = tmp.firstChild;
      if (animar && !BL.reduce) novo.classList.add('revelando');
      velho.replaceWith(novo);
      if (tinhaFoco) { var alvo = novo.querySelector('a.cp-cx') || novo.querySelector('.cp-cx'); if (alvo) { if (!alvo.matches('a')) alvo.tabIndex = -1; alvo.focus(); } }
    }
    function revelar(r, i) {
      feitos[r + ':' + i] = 1;
      trocar(r, i, jogoHtml(estado.rodadas[r][i], true), true);
      var j = Math.floor(i / 2);
      if (estado.rodadas[r + 1] && feitos[r + ':' + (2 * j)] && feitos[r + ':' + (2 * j + 1)]) trocar(r + 1, j, jogoHtml(estado.rodadas[r + 1][j], false), false);
    }
    function comecar(st, instantaneo) {
      estado = st; feitos = {}; clearTimeout(timer); setPausa(false, false);
      form.hidden = true; $('.cp-torneio').hidden = false; $('.cp-campeao').hidden = true; $('.cp-ctrl').hidden = false;
      try { history.replaceState(null, '', urlCopa(st)); } catch (e) {}
      var n = st.rodadas[0].length * 2;
      $('#cp-t').textContent = 'Copa do Ego · ' + PRESETS[st.pid].nome + ' · ' + n + ' egoístas';
      renderChave(); $('#cp-t').focus();
      fila = [];
      st.rodadas.forEach(function (jogos, r) { jogos.forEach(function (j, i) { fila.push({ r: r, i: i, ultimo: i === jogos.length - 1 }); }); });
      BL.anunciar('Começa a Copa do Ego com ' + n + ' egoístas. Espaço ou o botão Pausar param a revelação.');
      if (instantaneo) pular(); else timer = setTimeout(passo, 900);
    }
    function anunciarRodada(r) {
      var jogos = estado.rodadas[r];
      if (jogos.length === 1) return;
      BL.anunciar((NOME_R[jogos.length] || 'Rodada') + ': avançam ' + jogos.map(function (j) { return j.w.nome; }).join(', ') + '.');
    }
    function passo() {
      if (pausado) return;
      var x = fila.shift(); if (!x) return campeao();
      revelar(x.r, x.i);
      if (x.ultimo) anunciarRodada(x.r);
      if (BL.voz && BL.voz.on) { var jj = estado.rodadas[x.r][x.i]; BL.voz.falar(jj.w.nome + ' vence ' + (jj.w === jj.a ? jj.b.nome : jj.a.nome) + ' por ' + Math.max(jj.g[0], jj.g[1]) + ' a ' + Math.min(jj.g[0], jj.g[1])); }
      timer = setTimeout(passo, x.ultimo ? 1500 : 650);
    }
    function pular() { clearTimeout(timer); pausado = false; if (BL.voz) BL.voz.cancel(); while (fila.length) { var x = fila.shift(); feitos[x.r + ':' + x.i] = 1; } renderChave(); campeao(); }
    function setPausa(on, falar) {
      pausado = on; if (on && BL.voz) BL.voz.cancel(); var b = $('[data-acao="pausar"]');
      b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '▶ Retomar' : '❚❚ Pausar';
      clearTimeout(timer); if (!on && estado && fila.length) timer = setTimeout(passo, 300);
      if (falar !== false) BL.anunciar(on ? 'Revelação pausada' : 'Revelação retomada');
    }
    function campeao() {
      var st = estado, c = st.campeao, todosJ = [].concat.apply([], st.rodadas);
      var caminho = [];
      st.rodadas.forEach(function (jogos) { jogos.forEach(function (j) { if (j.a === c || j.b === c) caminho.push(j); }); });
      var golea = todosJ.slice().sort(function (x, y) { return Math.abs(y.g[0] - y.g[1]) - Math.abs(x.g[0] - x.g[1]) || (y.g[0] + y.g[1]) - (x.g[0] + x.g[1]); })[0];
      var ouros = todosJ.filter(function (j) { return j.ouro; }).length, flows = todosJ.reduce(function (s, j) { return s + j.flow; }, 0), gols = todosJ.reduce(function (s, j) { return s + j.g[0] + j.g[1]; }, 0);
      [].forEach.call($('.copa').querySelectorAll('.jogo.feito[data-ids~="' + c.id + '"]'), function (li) { li.classList.add('caminho'); });
      var el = $('.cp-campeao');
      el.innerHTML = '<h2 tabindex="-1">🏆 ' + esc(c.nome) + ' é o campeão da Copa do Ego!</h2><div class="x1-campeao"><img src="' + esc(c.img) + '" alt="" width="480" height="552"><div>' +
        '<h3>Caminho até o título</h3><ol class="cp-caminho">' + caminho.map(function (j) {
          var eA = j.a === c, adv = eA ? j.b : j.a, gc = eA ? j.g[0] : j.g[1], ga = eA ? j.g[1] : j.g[0];
          return '<li><span>' + esc(NOME_R[st.rodadas.filter(function (jj) { return jj.indexOf(j) >= 0; })[0].length]) + ':</span> venceu ' + esc(adv.nome) + ' por ' + gc + ' a ' + ga + (j.ouro ? (j.penalti ? ' (pênalti)' : ' (gol de ouro)') : '') + ' · <a href="' + esc(linkX1(j)) + '">ver o x1</a></li>';
        }).join('') + '</ol>' +
        '<ul class="dd-est"><li><b>' + gols + '</b> gols</li><li><b>' + Math.max(golea.g[0], golea.g[1]) + '×' + Math.min(golea.g[0], golea.g[1]) + '</b> maior goleada <small>(' + esc(M.curto(golea.w, golea.w === golea.a ? golea.b : golea.a)) + ' sobre ' + esc(M.curto(golea.w === golea.a ? golea.b : golea.a, golea.w)) + ')</small></li><li><b>' + ouros + '</b> gols de ouro</li><li><b>' + flows + '</b> despertares do ego</li></ul>' +
        '<p class="cp-aviso">Torneio simulado pelo site com atributos estimados (não oficiais). O link reproduz exatamente esta Copa.</p>' +
        '<div class="x1-botoes"><button type="button" class="btn" data-acao="copiar">Copiar link da Copa</button><button type="button" class="btn btn-2" data-acao="nova">↻ Nova Copa (mesma chave)</button><a class="btn btn-2" href="duelo.html?a=' + esc(c.id) + '">⚔ Desafiar o campeão</a><button type="button" class="btn btn-2" data-acao="editar">Mudar chave</button></div></div></div>';
      var novas = 0;
      if (window.BL_ALBUM) estado.rodadas[0].forEach(function (j) { if (BL_ALBUM.ganhar(j.a.id, 'copa', true)) novas++; if (BL_ALBUM.ganhar(j.b.id, 'copa', true)) novas++; });
      if (novas) el.querySelector('.cp-aviso').insertAdjacentHTML('beforebegin', '<p class="album-nova">🃏 ' + novas + (novas === 1 ? ' figurinha nova' : ' figurinhas novas') + ' no <a href="album.html">Álbum do Ego</a> (participantes da Copa)</p>');
      el.hidden = false; $('.cp-ctrl').hidden = true;
      el.querySelector('h2').focus();
      if (BL.voz) BL.voz.falar(c.nome + ' é o campeão da Copa do Ego!');
      BL.anunciar(c.nome + ' é o campeão da Copa do Ego!' + (novas ? ' ' + novas + ' figurinhas novas no álbum.' : ''));
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var pid = preset();
      comecar(montar(pid, +tamSel.value, M.novaSemente()));
    });
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return;
      var a = b.dataset.acao;
      if (a === 'pausar') setPausa(!pausado);
      if (a === 'pular') pular();
      if (a === 'copiar') BL.copiar(BL.urlPublica('copa.html', urlCopa(estado)), b, 'Link da Copa copiado');
      if (a === 'nova') comecar(montar(estado.pid, estado.tam, M.novaSemente()));
      if (a === 'editar') { clearTimeout(timer); $('.cp-torneio').hidden = true; form.hidden = false; descrever(); $('.cp-comecar').focus(); }
    });
    $('.cp-torneio').addEventListener('keydown', function (e) {
      if (e.key === ' ' && !e.target.closest('button,a,input') && fila.length) { e.preventDefault(); setPausa(!pausado); }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && fila.length && !pausado && estado) setPausa(true, false); });
    descrever();
    if (qs.get('seed') && qs.get('p') && PRESETS[qs.get('p')]) {
      var st = montar(qs.get('p'), +tamSel.value, qs.get('seed'));
      if (st.rodadas.length) comecar(st, qs.get('rev') === '0');
    }
  }).catch(function (e) { console.warn('Copa indisponível:', e); });
})();
