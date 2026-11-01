/* Trilho visual da trajetória nas fichas (rodada 1, #12). A lista ol.phases continua sendo a fonte e o texto acessível;
   o trilho é um reforço visual (aria-hidden) e respeita o botão de spoiler. Script clássico. */
(function () {
  'use strict';
  var ol = document.querySelector('.char ol.phases'); if (!ol || !window.BL) return;
  var CANON = BL.FASES || ['1ª Seleção', '2ª Seleção', '3ª Seleção', 'Blue Lock × Sub-20', 'Neo Egoist League', 'Atual'];
  var CURTO = { '1ª Seleção': '1ª Sel.', '2ª Seleção': '2ª Sel.', '3ª Seleção': '3ª Sel.', 'Blue Lock × Sub-20': '× Sub-20', 'Neo Egoist League': 'NEL', 'Atual': 'Atual' };
  var lis = [].slice.call(ol.children), mapa = {};
  lis.forEach(function (li) { var b = li.querySelector('b'); if (!b) return; var f = b.textContent.trim(); if (CANON.indexOf(f) >= 0) mapa[f] = li; });
  if (!Object.keys(mapa).length) return;
  function time(li) { var t = li.textContent.replace(li.querySelector('b').textContent, '').replace(/→\s*nº\s*\S+\s*$/, '').replace(/^\s*→\s*/, '').replace(/\s*→\s*$/, '').trim(); return t || '—'; }
  var tr = document.createElement('ol'); tr.className = 'trilho'; tr.setAttribute('aria-hidden', 'true');
  tr.innerHTML = CANON.map(function (f, i) {
    var li = mapa[f];
    return '<li class="tr-m' + (li ? ' tem' : ' vazio') + '" data-f="' + i + '"><span class="tr-p"></span><b>' + CURTO[f] + '</b><span class="tr-t">' + (li ? BL.esc(time(li)) : '—') + '</span></li>';
  }).join('');
  ol.parentNode.insertBefore(tr, ol);
  function sync() { CANON.forEach(function (f, i) { var li = mapa[f], m = tr.children[i]; m.classList.toggle('oculto', !!(li && li.hidden)); if (li) m.querySelector('.tr-t').textContent = li.hidden ? 'spoiler' : time(li); }); }
  sync(); new MutationObserver(sync).observe(ol, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  if (!BL.reduce) { tr.classList.add('tr-anim'); requestAnimationFrame(function () { requestAnimationFrame(function () { tr.classList.add('tr-on'); }); }); }
})();
