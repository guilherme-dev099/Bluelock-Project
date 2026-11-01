/* Modo Treinador: diagrama passo a passo (sem autoplay) + exercício com feedback. Sem JS, todos os passos ficam visíveis. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function ler() { try { return JSON.parse(localStorage.getItem('bl-treino')) || {}; } catch (e) { return {}; } }
  function anunciar(t) { if (window.BL && BL.anunciar) BL.anunciar(t); }
  /* passos */
  $$('.dg').forEach(function (dg) {
    var ps = $$('.dg-passo', dg), i = 0, st = $('.dg-st', dg), ant = $('[data-dg=ant]', dg), prox = $('[data-dg=prox]', dg);
    dg.classList.add('dg-js'); $('.dg-ctrl', dg).hidden = false;
    function ir(n, falar) {
      i = Math.max(0, Math.min(ps.length - 1, n));
      ps.forEach(function (p, k) { p.hidden = k !== i; });
      st.textContent = 'Passo ' + (i + 1) + ' de ' + ps.length; ant.disabled = i === 0; prox.disabled = i === ps.length - 1;
      if (falar) anunciar(st.textContent + ': ' + $('figcaption', ps[i]).textContent);
    }
    ant.addEventListener('click', function () { ir(i - 1, true); }); prox.addEventListener('click', function () { ir(i + 1, true); });
    dg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { ir(i + 1, true); e.preventDefault(); } if (e.key === 'ArrowLeft') { ir(i - 1, true); e.preventDefault(); } });
    ir(0, false);
  });
  /* exercício */
  var ex = $('.ex'); if (ex) {
    var slug = ex.dataset.licao, fb = $('.ex-fb', ex), selo = $('.ex-selo');
    function feito() { if (selo) selo.hidden = false; }
    if (ler()[slug]) feito();
    function resp(alvo) {
      $$('[data-ok]', ex).forEach(function (b) { b.classList.remove('ex-sim', 'ex-nao'); b.removeAttribute('aria-pressed'); });
      $$('[data-i="' + alvo.dataset.i + '"]', ex).forEach(function (b) { b.classList.add(alvo.dataset.ok === '1' ? 'ex-sim' : 'ex-nao'); b.setAttribute('aria-pressed', 'true'); });
      fb.textContent = (alvo.dataset.ok === '1' ? '✓ ' : '✗ ') + alvo.dataset.fb; fb.className = 'ex-fb ' + (alvo.dataset.ok === '1' ? 'ok' : 'erro');
      if (alvo.dataset.ok === '1') {
        var o = ler(), novo = !o[slug]; o[slug] = new Date().toISOString().slice(0, 10);
        try { localStorage.setItem('bl-treino', JSON.stringify(o)); } catch (e) {}
        feito(); if (novo && window.blEv) blEv('treino', { slug: slug, total: Object.keys(o).length });
      }
    }
    ex.addEventListener('click', function (e) { var b = e.target.closest('[data-ok]'); if (b) resp(b); });
    ex.addEventListener('keydown', function (e) { var b = e.target.closest('g[data-ok]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); resp(b); } });
  }
  /* trilha (treino.html) */
  var tr = $$('.tn-lista li[data-licao]'); if (tr.length) {
    var o = ler(), n = 0;
    tr.forEach(function (li) { if (o[li.dataset.licao]) { n++; li.classList.add('ok'); $('.tn-selo', li).hidden = false; } });
    var p = $('.tn-prog'); if (p) { p.innerHTML = '<meter min="0" max="' + tr.length + '" value="' + n + '">' + n + '</meter> ' + n + ' de ' + tr.length + ' lições concluídas.'; }
  }
})();
