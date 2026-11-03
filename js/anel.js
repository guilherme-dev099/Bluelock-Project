/* Home: anel imersivo 3D (sem JS, a lista vira trilho horizontal com links) */
(function () {
  var h = document.querySelector('.anel-h'); if (!h) return;
  var pal = h.querySelector('.anel-palco'), cil = h.querySelector('.anel-cil'), cs = [].slice.call(h.querySelectorAll('.anel-c'));
  var nome = h.querySelector('.anel-nome'), arma = h.querySelector('.anel-arma'), cont = h.querySelector('.anel-cont'), cur = h.querySelector('.anel-cur');
  var n = cs.length, ang = 0, R = 0, mov = 0, x0 = null, a0 = 0, passo = 360 / n;
  h.classList.add('is-3d');
  function raio() { var w = cs[0].offsetWidth || 240; R = Math.round(w / 2 / Math.tan(Math.PI / n) * 1.08); cs.forEach(function (c, i) { c.parentNode.style.transform = 'rotateY(' + (i * passo) + 'deg) translateZ(' + R + 'px)'; }); pinta(); }
  function idx() { return ((Math.round(-ang / passo) % n) + n) % n; }
  function pinta() {
    cil.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + ang + 'deg)';
    var k = idx(); cs.forEach(function (c, i) { c.classList.toggle('on', i === k); c.tabIndex = 0; });
    nome.textContent = cs[k].getAttribute('data-nome');
    arma.textContent = 'Arma: ' + cs[k].getAttribute('data-arma');
    cont.textContent = ('0' + (k + 1)).slice(-2) + ' / ' + ('0' + n).slice(-2);
  }
  function ir(i) { var alvo = -i * passo, d = ((alvo - ang) % 360 + 540) % 360 - 180; ang += d; pinta(); }
  cs.forEach(function (c, i) {
    c.addEventListener('focus', function () { ir(i); });
    c.addEventListener('click', function (e) { if (mov > 6) e.preventDefault(); });
    c.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });
  pal.addEventListener('pointerdown', function (e) { if (e.button) return; x0 = e.clientX; a0 = ang; mov = 0; h.classList.add('arr'); });
  window.addEventListener('pointermove', function (e) {
    if (cur) { cur.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }
    if (x0 === null) return; mov = Math.abs(e.clientX - x0); ang = a0 + (e.clientX - x0) * 0.25; pinta();
  });
  window.addEventListener('pointerup', function () { if (x0 === null) return; x0 = null; h.classList.remove('arr'); ir(idx()); });
  var t; pal.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault(); ang -= e.deltaX * 0.2; pinta(); clearTimeout(t); t = setTimeout(function () { ir(idx()); }, 150); }, { passive: false });
  pal.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { ir(idx() + 1); cs[idx()].focus(); e.preventDefault(); } if (e.key === 'ArrowLeft') { ir(idx() - 1); cs[idx()].focus(); e.preventDefault(); } });
  window.addEventListener('resize', raio); raio();
})();
