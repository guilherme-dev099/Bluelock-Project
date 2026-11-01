/* Fábrica de Desafios — player (desafio.html#d=…). Conteúdo de fã: título só via textContent. Script clássico. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, app = $('#dsf'), F = window.BL_FAB; if (!app || !F || !window.BL) return;
  var esc = BL.esc, por = {}, todos = [];
  var h = new URLSearchParams(location.hash.slice(1)), d = F.decodificar(h.get('d') || ''), rAmigo = parseInt(h.get('r'), 10);
  function pista(p, k) {
    var nel = (p.fases || []).filter(function (f) { return f.fase === 'Neo Egoist League'; })[0];
    if (k === 'pos') return 'Posição: ' + (p.posicao || 'não informada');
    if (k === 'arma') return 'Arma: ' + ((p.armas || []).slice(0, 2).join(', ') || 'não informada');
    if (k === 'fase') return p.fases && p.fases[0] ? '1ª fase: ' + p.fases[0].fase + ' (' + p.fases[0].time + ')' : '1ª fase: não informada';
    if (k === 'rank') return 'Ranking final: ' + (p.rankingFinal ? p.rankingFinal + 'º' : 'sem ranking');
    if (k === 'nel') return 'NEL: ' + (nel ? nel.time : 'não jogou');
  }
  function erro() { $('.dsf-tit').textContent = 'Desafio inválido'; $('.dsf-corpo').innerHTML = '<p>Este link está incompleto ou foi feito para outra versão dos dados. <a href="fabrica.html">Crie um desafio novo</a>.</p>'; }
  function adivinhe() {
    var i = 0, pts = 0, tent = 0, MAX = 3, res = [];
    function tela() {
      if (i >= d.ids.length) return fim();
      var p = por[d.ids[i]];
      $('.dsf-corpo').innerHTML = '<p class="dsf-prog">Personagem ' + (i + 1) + ' de ' + d.ids.length + ' · ' + pts + ' ponto(s)</p><ul class="dsf-pistas">' + d.pistas[i].map(function (k) { return '<li>' + esc(pista(p, k)) + '</li>'; }).join('') + '</ul>' +
        '<div class="x1-busca"><label for="dsf-b">Quem é? (tentativa ' + (tent + 1) + ' de ' + MAX + ')</label><div class="x1-campo-busca"><input id="dsf-b" type="search" role="combobox" aria-expanded="false" aria-controls="dsf-b-lista" aria-autocomplete="list" autocomplete="off" placeholder="Buscar personagem…"></div><ul id="dsf-b-lista" class="x1-lista" role="listbox" aria-label="Personagens" hidden></ul></div>' +
        '<p class="dsf-fb" role="status"></p><p><button type="button" class="btn btn-2" data-acao="pular">Pular</button></p>';
      BL.combobox($('#dsf-b'), $('#dsf-b-lista'), { fonte: function () { return todos; }, abrirNoFoco: false, escolher: function (q) {
        if (q.id === p.id) { pts += MAX - tent; res.push('🟦'); BL.anunciar('Acertou: ' + p.nome); prox(); }
        else { tent++; if (tent >= MAX) { res.push('⬛'); BL.anunciar('Era ' + p.nome); prox(); } else { $('.dsf-fb').textContent = '✗ Não é ' + q.nome + '. Restam ' + (MAX - tent) + '.'; $('label[for=dsf-b]').textContent = 'Quem é? (tentativa ' + (tent + 1) + ' de ' + MAX + ')'; BL.anunciar($('.dsf-fb').textContent); } }
      } });
      $('#dsf-b').focus();
    }
    function prox() { i++; tent = 0; tela(); }
    function fim() {
      var max = d.ids.length * MAX;
      $('.dsf-corpo').innerHTML = '<h3 tabindex="-1">' + pts + ' de ' + max + ' pontos ' + res.join('') + '</h3>' + (isFinite(rAmigo) ? '<p>Quem mandou o link fez ' + Math.max(0, Math.min(max, rAmigo)) + ' de ' + max + '.</p>' : '') +
        '<ol class="dsf-resp">' + d.ids.map(function (id) { return '<li><a href="' + esc(por[id].url) + '">' + esc(por[id].nome) + '</a></li>'; }).join('') + '</ol>' +
        '<p><button type="button" class="btn" data-acao="resultado">Copiar meu resultado</button> <a class="btn btn-2" href="fabrica.html">Criar o meu desafio</a></p>';
      $('.dsf-corpo h3').focus(); BL.anunciar(pts + ' de ' + max + ' pontos');
      app.dataset.pts = pts; app.dataset.max = max; app.dataset.res = res.join('');
      if (window.blEv) blEv('desafio-fa', { ok: pts > 0, pts: pts });
    }
    app.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.acao === 'pular') { res.push('⬛'); prox(); }
      if (b.dataset.acao === 'resultado') { var u = BL.urlPublica('desafio.html', '') + '#d=' + h.get('d') + '&r=' + app.dataset.pts; BL.copiar('Blue Lock · Desafio de fã' + (d.n ? ' “' + d.n + '”' : '') + ': ' + app.dataset.pts + '/' + app.dataset.max + ' ' + app.dataset.res + '\n' + u, b, 'Resultado copiado'); }
    });
    tela();
  }
  function cartao() {
    var ps = d.ids.map(function (id) { return por[id]; }), link, txt;
    if (d.t === 'c') { link = 'copa.html?ids=' + d.ids.join(','); txt = 'Uma Copa do Ego com ' + ps.length + ' participantes escolhidos. Quem leva?'; }
    if (d.t === 'g') { link = 'graus.html?de=' + d.ids[0] + '&ate=' + d.ids[1]; txt = 'Ligue ' + ps[0].nome + ' a ' + ps[1].nome + ' em até ' + d.lim + ' graus. Tente pensar antes de abrir a resposta.'; }
    if (d.t === 'x') { link = 'duelo.html?a=' + d.ids[0] + '&b=' + d.ids[1]; txt = ps[0].nome + ' contra ' + ps[1].nome + ': quem vence o x1? Dê o seu palpite e depois jogue.'; }
    $('.dsf-corpo').innerHTML = '<p>' + esc(txt) + '</p><ul class="dsf-ps">' + ps.map(function (p) { return '<li><img src="' + esc(BL.thumb(p)) + '" alt="" width="48" height="48"><a href="' + esc(p.url) + '">' + esc(p.nome) + '</a></li>'; }).join('') + '</ul>' +
      (d.t === 'x' ? '<fieldset class="dsf-palpite"><legend>Seu palpite</legend>' + ps.map(function (p, i) { return '<label><input type="radio" name="dsf-p" value="' + i + '"> ' + esc(p.nome) + '</label>'; }).join(' ') + '</fieldset>' : '') +
      '<p><a class="btn" href="' + esc(link) + '">Jogar este desafio →</a> <a class="btn btn-2" href="fabrica.html">Criar o meu</a></p>';
    app.addEventListener('click', function (e) { if (e.target.closest('a.btn') && window.blEv) blEv('desafio-fa', { ok: true }); });
  }
  if (!d) { erro(); return; }
  BL.personagens().then(function (ps) {
    todos = ps; ps.forEach(function (p) { por[p.id] = p; });
    if (d.ids.some(function (id) { return !por[id]; })) return erro();
    $('.dsf-tit').textContent = d.n || F.TIPOS[d.t].nome; $('.dsf-tipo').textContent = F.TIPOS[d.t].nome; $('.dsf-aviso').hidden = false;
    if (d.t === 'a') adivinhe(); else cartao();
  });
})();
