/* Tier list acessível (rodada 1, #7): faixas S–D, mover por botões/teclado (arrastar é extra), estado no link. Script clássico. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, app = $('#tier'); if (!app || !window.BL) return;
  var F = ['S', 'A', 'B', 'C', 'D'], esc = BL.esc, est = { S: [], A: [], B: [], C: [], D: [] }, tit = '', por = {}, todos = [];
  var PRE = window.BL_TIER_PRE || [];
  function ler() {
    var q = new URLSearchParams(location.search); tit = (q.get('t') || '').slice(0, 60);
    F.forEach(function (f) { est[f] = (q.get(f) || '').split(',').filter(function (id) { return por[id]; }); });
    var vistos = {}; F.forEach(function (f) { est[f] = est[f].filter(function (id) { if (vistos[id]) return false; vistos[id] = 1; return true; }); });
  }
  function url() {
    var q = new URLSearchParams(); F.forEach(function (f) { if (est[f].length) q.set(f, est[f].join(',')); }); if (tit) q.set('t', tit);
    var s = q.toString(); return location.pathname + (s ? '?' + s : '');
  }
  function salvar() { try { history.replaceState(null, '', url()); } catch (e) {} }
  function onde(id) { for (var i = 0; i < F.length; i++) { var j = est[F[i]].indexOf(id); if (j >= 0) return [i, j]; } return null; }
  function total() { return F.reduce(function (s, f) { return s + est[f].length; }, 0); }
  function render(foco) {
    $('#tr-t').value = tit; $('.tr-titulo').textContent = tit || 'Minha tier list';
    $('.tr-faixas').innerHTML = F.map(function (f, fi) {
      return '<li class="tr-faixa" data-f="' + f + '"><h2 class="tr-rot" id="tr-f-' + f + '">' + f + '</h2><ol class="tr-itens" aria-labelledby="tr-f-' + f + '" data-f="' + f + '">' +
        (est[f].length ? est[f].map(function (id, i) {
          var p = por[id], n = esc(p.nome);
          return '<li class="tr-item" draggable="true" data-id="' + id + '"><img src="' + esc(BL.thumb(p)) + '" alt="" width="56" height="56" loading="lazy"><span class="tr-nome">' + n + '</span><span class="tr-bt">' +
            '<button type="button" data-m="up" aria-label="' + n + ': subir para a faixa ' + (F[fi - 1] || f) + '"' + (fi === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button type="button" data-m="down" aria-label="' + n + ': descer para a faixa ' + (F[fi + 1] || f) + '"' + (fi === F.length - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button type="button" data-m="left" aria-label="' + n + ': mover para a esquerda"' + (i === 0 ? ' disabled' : '') + '>←</button>' +
            '<button type="button" data-m="right" aria-label="' + n + ': mover para a direita"' + (i === est[f].length - 1 ? ' disabled' : '') + '>→</button>' +
            '<button type="button" data-m="del" aria-label="Remover ' + n + '">✕</button></span></li>';
        }).join('') : '<li class="tr-vazia">vazia</li>') + '</ol></li>';
    }).join('');
    $('.tr-cont').textContent = total() + ' personagem(ns) na lista.';
    salvar();
    if (foco) { var b = app.querySelector('.tr-item[data-id="' + foco[0] + '"] [data-m="' + foco[1] + '"]'); if (!b || b.disabled) b = app.querySelector('.tr-item[data-id="' + foco[0] + '"] button:not([disabled])'); if (b) b.focus(); }
  }
  function mover(id, m) {
    var o = onde(id); if (!o) return; var f = F[o[0]], l = est[f], p = por[id];
    if (m === 'del') { l.splice(o[1], 1); render(); BL.anunciar(p.nome + ' removido'); $('#tr-busca').focus(); return; }
    if (m === 'up' || m === 'down') { var nf = F[o[0] + (m === 'up' ? -1 : 1)]; if (!nf) return; l.splice(o[1], 1); est[nf].push(id); BL.anunciar(p.nome + ' movido para ' + nf + ', posição ' + est[nf].length); }
    else { var j = o[1] + (m === 'left' ? -1 : 1); if (j < 0 || j >= l.length) return; l.splice(o[1], 1); l.splice(j, 0, id); BL.anunciar(p.nome + ' na posição ' + (j + 1) + ' da faixa ' + f); }
    render([id, m]);
  }
  function add(p) {
    if (onde(p.id)) { BL.anunciar(p.nome + ' já está na lista'); return; }
    if (total() >= 60) { BL.anunciar('Máximo de 60 personagens'); return; }
    var f = $('#tr-faixa').value; est[f].push(p.id); render(); BL.anunciar(p.nome + ' entrou na faixa ' + f + ', posição ' + est[f].length);
  }
  BL.personagens().then(function (ps) {
    todos = ps; ps.forEach(function (p) { por[p.id] = p; }); ler();
    BL.combobox($('#tr-busca'), $('#tr-busca-lista'), { fonte: function () { return todos; }, sub: function (p) { return p.posicao || ''; }, escolher: add, abrirNoFoco: false });
    $('#tr-pre').innerHTML = '<option value="">Escolher um preset…</option>' + PRE.map(function (x, i) { return '<option value="' + i + '">' + esc(x.nome) + ' (' + x.ids.length + ')</option>'; }).join('');
    render();
  });
  app.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.m) return mover(b.closest('.tr-item').dataset.id, b.dataset.m);
    var a = b.dataset.acao;
    if (a === 'link') { BL.copiar(BL.urlPublica('tier.html', url().replace(location.pathname, '')), b, 'Link copiado'); if (window.blEv && total()) blEv('tier', { n: total() }); }
    if (a === 'limpar') { F.forEach(function (f) { est[f] = []; }); render(); BL.anunciar('Lista limpa'); }
    if (a === 'imprimir') print();
    if (a === 'preset') {
      var x = PRE[$('#tr-pre').value]; if (!x) { $('#tr-pre').focus(); return; }
      F.forEach(function (f) { est[f] = []; }); x.ids.forEach(function (id) { if (por[id]) est.C.push(id); }); tit = x.nome; render();
      BL.anunciar('Preset ' + x.nome + ': ' + est.C.length + ' personagens na faixa C. Use as setas para ranquear.');
    }
  });
  $('#tr-t').addEventListener('input', function (e) { tit = e.target.value.slice(0, 60); $('.tr-titulo').textContent = tit || 'Minha tier list'; salvar(); });
  /* arrastar (extra; nunca o único meio) */
  var arr = null;
  app.addEventListener('dragstart', function (e) { var li = e.target.closest && e.target.closest('.tr-item'); if (!li) return; arr = li.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', arr); } catch (x) {} });
  app.addEventListener('dragover', function (e) { if (arr && e.target.closest('.tr-faixa')) e.preventDefault(); });
  app.addEventListener('drop', function (e) {
    var fx = e.target.closest('.tr-faixa'); if (!arr || !fx) return; e.preventDefault();
    var o = onde(arr); est[F[o[0]]].splice(o[1], 1);
    var alvo = e.target.closest('.tr-item'), l = est[fx.dataset.f], j = alvo && alvo.dataset.id !== arr ? l.indexOf(alvo.dataset.id) : l.length;
    l.splice(j < 0 ? l.length : j, 0, arr); BL.anunciar(por[arr].nome + ' movido para ' + fx.dataset.f); arr = null; render();
  });
  app.addEventListener('dragend', function () { arr = null; });
})();
