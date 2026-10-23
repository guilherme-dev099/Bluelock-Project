/* Comum a todas as páginas: menus do topo ("Jogos" / "Explorar"), busca universal (Ctrl+K) e API do Álbum. Script clássico. */
(function () {
  'use strict';
  var BL = window.BL; if (!BL) return;
  /* ----- menus <details> do topo: um aberto por vez, fecha com Esc e clique fora ----- */
  var menus = [].slice.call(document.querySelectorAll('.nav-dd details'));
  menus.forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) menus.forEach(function (o) { if (o !== d) o.open = false; }); });
  });
  document.addEventListener('click', function (e) { menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus.forEach(function (d) { if (d.open) { d.open = false; d.querySelector('summary').focus(); } });
  });
})();
