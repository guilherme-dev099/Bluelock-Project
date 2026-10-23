/* TINTA & EGO · lote 2 · Hero "O Olho" (só no index): letras, entrada, brilho das pupilas, parallax leve e faixa-manifesto pausável.
   Script clássico, funciona via file://. Sem JS o hero aparece completo e estático. */
(function () {
  'use strict';
  var hx = document.querySelector('.hx'); if (!hx) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0;
  [].forEach.call(hx.querySelectorAll('.hx-t .w'), function (w) {
    var txt = w.textContent; w.textContent = '';
    txt.split('').forEach(function (ch) {
      var s = document.createElement('span'); s.className = 'l'; s.setAttribute('aria-hidden', 'true');
      s.textContent = ch; s.style.setProperty('--i', i++); w.appendChild(s);
    });
  });
  var go = function () { requestAnimationFrame(function () { hx.classList.add('is-in'); }); };
  if (reduce) hx.classList.add('is-in');
  else if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 600); })]).then(go);
  else go();
  var eye = hx.querySelector('.hx-eye'), img = eye && eye.querySelector('img');
  function alinhar() {
    if (!img || !img.naturalWidth) return;
    var fr = eye.getBoundingClientRect(), ir = img.getBoundingClientRect(); if (!fr.height) return;
    [['--ey1', '--gy1'], ['--ey2', '--gy2']].forEach(function (p) {
      var pct = parseFloat(getComputedStyle(eye).getPropertyValue(p[0])) / 100;
      eye.style.setProperty(p[1], ((ir.top + ir.height * pct - fr.top) / fr.height * 100).toFixed(2) + '%');
    });
  }
  if (img) { if (img.complete) alinhar(); else img.addEventListener('load', alinhar); addEventListener('resize', alinhar, { passive: true }); setTimeout(alinhar, 1200); }
  /* faixa-manifesto: Pausar/Tocar (WCAG 2.2.2) */
  var fx = document.querySelector('.faixa'), bp = fx && fx.querySelector('.faixa-pausa');
  if (bp) bp.addEventListener('click', function () {
    var p = bp.getAttribute('aria-pressed') !== 'true';
    bp.setAttribute('aria-pressed', String(p)); fx.setAttribute('data-pausa', String(p)); bp.textContent = p ? 'Tocar' : 'Pausar';
  });
  if (reduce || !img) return;
  var tick = false, visivel = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; }).observe(hx);
  addEventListener('scroll', function () {
    if (tick || !visivel) return; tick = true;
    requestAnimationFrame(function () { img.style.setProperty('--py', (scrollY * 0.18).toFixed(1) + 'px'); alinhar(); tick = false; });
  }, { passive: true });
})();
