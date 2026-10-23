/* Combobox com fotos reaproveitável (ARIA 1.2: input[role=combobox] + ul[role=listbox]) — script clássico
   BL.combobox(input, ul, { fonte: () => lista, escolher: p => {}, sub: p => 'texto', filtro: p => bool, limite: 60 }) */
(function () {
  'use strict';
  var BL = window.BL; if (!BL) return;
  BL.combobox = function (inp, ul, op) {
    var ativo = -1, res = [], pref = (op.prefixo || ul.id + '-op-'), esc = BL.esc, norm = BL.norm;
    function abrir(q) {
      q = norm(q);
      /* relevância: nome exato > começo do nome/sobrenome > trecho do nome > trecho do subtítulo (empates mantêm a ordem da fonte) */
      var nota = function (p) {
        if (!q) return 1; var n = norm(p.nome);
        if (n === q) return 4;
        if (n.indexOf(q) === 0 || n.split(/[\s-]+/).some(function (w) { return w.indexOf(q) === 0; })) return 3;
        if (n.indexOf(q) >= 0) return 2;
        return norm(op.sub ? op.sub(p) : '').indexOf(q) >= 0 ? 1 : 0;
      };
      res = op.fonte().map(function (p, i) { return { p: p, n: (!op.filtro || op.filtro(p)) ? nota(p) : 0, i: i }; })
        .filter(function (o) { return o.n > 0; })
        .sort(function (a, b) { return b.n - a.n || a.i - b.i; })
        .map(function (o) { return o.p; }).slice(0, op.limite || 60);
      ativo = -1; inp.removeAttribute('aria-activedescendant');
      ul.innerHTML = res.length ? res.map(function (p, i) {
        return '<li role="option" id="' + pref + i + '" data-i="' + i + '" aria-selected="false"><img src="' + esc(BL.thumb(p)) + '" alt="" width="40" height="40" loading="lazy"><span><b>' + esc(p.nome) + '</b><small>' + esc(op.sub ? op.sub(p) : '') + '</small></span>' + (op.extra ? op.extra(p) : '') + '</li>';
      }).join('') : '<li class="x1-vazio">Ninguém encontrado</li>';
      ul.hidden = false; inp.setAttribute('aria-expanded', 'true');
    }
    function fechar() { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); }
    function mover(d) {
      if (!res.length) return;
      ativo = (ativo + d + res.length) % res.length;
      [].forEach.call(ul.children, function (li, i) { li.setAttribute('aria-selected', String(i === ativo)); });
      var li = ul.children[ativo]; inp.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' });
    }
    function pegar(p) { if (!p) return; fechar(); inp.value = ''; op.escolher(p); }
    inp.addEventListener('input', function () { abrir(inp.value); });
    inp.addEventListener('focus', function () { if (inp.value || op.abrirNoFoco) abrir(inp.value); });
    inp.addEventListener('blur', function () { setTimeout(fechar, 150); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (ul.hidden) abrir(inp.value); mover(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (!ul.hidden) pegar(res[ativo < 0 ? 0 : ativo]); }
      /* Esc fecha só a lista (dentro de um <dialog> não fecha o diálogo); com a lista fechada, limpa o campo; vazio, deixa o Esc seguir */
      else if (e.key === 'Escape') { if (!ul.hidden) { e.preventDefault(); e.stopPropagation(); fechar(); } else if (inp.value) { e.preventDefault(); e.stopPropagation(); inp.value = ''; } }
    });
    ul.addEventListener('mousedown', function (e) {
      var li = e.target.closest('li[data-i]'); if (!li) return;
      e.preventDefault(); pegar(res[+li.dataset.i]); if (op.blurAoEscolher) inp.blur();
    });
    return { fechar: fechar, abrir: abrir };
  };
})();
