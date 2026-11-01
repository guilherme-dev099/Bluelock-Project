/* Fábrica de Desafios — editor (fabrica.html). Script clássico. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, app = $('#fab'), F = window.BL_FAB; if (!app || !F || !window.BL) return;
  var esc = BL.esc, por = {}, todos = [], sel = [], pistas = {};
  function tipo() { return ($('input[name=fab-t]:checked') || {}).value || 'a'; }
  function render() {
    var t = F.TIPOS[tipo()];
    $('.fab-lim').textContent = t.min === t.max ? 'Escolha ' + t.max + ' personagens.' : 'Escolha de ' + t.min + ' a ' + t.max + ' personagens.';
    $('.fab-glim').hidden = tipo() !== 'g';
    $('.fab-sel').innerHTML = sel.map(function (id, i) {
      var p = por[id], h = '<li><img src="' + esc(BL.thumb(p)) + '" alt="" width="40" height="40"><div><b>' + (tipo() === 'g' ? (i ? 'Até: ' : 'De: ') : '') + esc(p.nome) + '</b>';
      if (tipo() === 'a') h += '<fieldset class="fab-pistas"><legend>Pistas para ' + esc(p.nome) + '</legend>' + F.PISTAS.map(function (ps) { return '<label><input type="checkbox" data-id="' + id + '" value="' + ps[0] + '"' + ((pistas[id] || []).indexOf(ps[0]) >= 0 ? ' checked' : '') + '> ' + ps[1] + '</label>'; }).join('') + '</fieldset>';
      return h + '</div><button type="button" class="btn btn-2" data-tirar="' + id + '" aria-label="Tirar ' + esc(p.nome) + '">✕</button></li>';
    }).join('') || '<li class="fab-vazio">Nenhum personagem ainda.</li>';
    $('.fab-cont').textContent = sel.length + ' de ' + t.max;
  }
  function validar() {
    var t = F.TIPOS[tipo()];
    if (sel.length < t.min || sel.length > t.max) return t.min === t.max ? 'Escolha exatamente ' + t.max + ' personagens.' : 'Escolha de ' + t.min + ' a ' + t.max + ' personagens.';
    if (tipo() === 'a') { var sem = sel.filter(function (id) { return !(pistas[id] || []).length; }); if (sem.length) return 'Marque pelo menos uma pista para ' + por[sem[0]].nome + '.'; }
    if (tipo() === 'c' && sel.some(function (id) { return !por[id].jogador; })) return 'A Copa só aceita jogadores (sem staff).';
    return '';
  }
  function gerar() {
    var erro = validar(), msg = $('.fab-msg');
    if (erro) { msg.textContent = erro; msg.className = 'fab-msg erro'; BL.anunciar(erro); return; }
    var cod = F.codificar({ t: tipo(), n: $('#fab-n').value, ids: sel, pistas: sel.map(function (id) { return pistas[id] || []; }), lim: +$('#fab-glim').value });
    var url = BL.urlPublica('desafio.html', '') + '#d=' + cod;
    $('#fab-link').value = url; $('.fab-saida').hidden = false; $('.fab-abrir').href = 'desafio.html#d=' + cod;
    msg.textContent = 'Link pronto, com ' + url.length + ' caracteres.'; msg.className = 'fab-msg ok'; $('#fab-link').focus(); $('#fab-link').select();
    if (window.blEv) blEv('fabrica', { t: tipo() });
  }
  app.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tirar) { sel = sel.filter(function (id) { return id !== b.dataset.tirar; }); render(); BL.anunciar('Removido. ' + sel.length + ' escolhidos.'); $('#fab-busca').focus(); }
    if (b.dataset.acao === 'gerar') gerar();
    if (b.dataset.acao === 'copiar') BL.copiar($('#fab-link').value, b, 'Link copiado');
  });
  app.addEventListener('change', function (e) {
    if (e.target.name === 'fab-t') { var t = F.TIPOS[tipo()]; if (sel.length > t.max) sel = sel.slice(0, t.max); render(); $('.fab-saida').hidden = true; BL.anunciar(t.nome + '. ' + $('.fab-lim').textContent); }
    if (e.target.matches('.fab-pistas input')) { var id = e.target.dataset.id; pistas[id] = [].slice.call(app.querySelectorAll('.fab-pistas input[data-id="' + id + '"]:checked')).map(function (x) { return x.value; }); }
  });
  BL.personagens().then(function (ps) {
    todos = ps; ps.forEach(function (p) { por[p.id] = p; });
    BL.combobox($('#fab-busca'), $('#fab-busca-lista'), { fonte: function () { return todos; }, sub: function (p) { return p.posicao || ''; }, abrirNoFoco: false,
      filtro: function (p) { return sel.indexOf(p.id) < 0 && (tipo() !== 'c' || p.jogador); },
      escolher: function (p) { var t = F.TIPOS[tipo()]; if (sel.length >= t.max) { BL.anunciar('Máximo de ' + t.max); return; } sel.push(p.id); pistas[p.id] = pistas[p.id] || ['pos', 'arma']; render(); BL.anunciar(p.nome + ' entrou. ' + sel.length + ' de ' + t.max + '.'); } });
    render();
  });
})();
