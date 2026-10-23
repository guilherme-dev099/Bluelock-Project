/* Blue Lock — loader compartilhado (script clássico: funciona em http:// e file://) */
(function () {
  'use strict';
  var cache;
  var base = (document.currentScript && document.currentScript.src) || location.href;
  function carregarEmbed() {
    return new Promise(function (ok, erro) {
      if (window.BL_DATA) return ok(window.BL_DATA);
      var s = document.createElement('script');
      s.src = new URL('dados-embed.js', base).href;
      s.onload = function () { window.BL_DATA ? ok(window.BL_DATA) : erro(new Error('dados vazios')); };
      s.onerror = erro;
      document.head.appendChild(s);
    });
  }
  var BL = window.BL = {
    FASES: ['1ª Seleção', '2ª Seleção', '3ª Seleção', 'Blue Lock × Sub-20', 'Neo Egoist League', 'Atual'],
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    /* http(s): busca data/personagens.json; file:// (ou falha): usa js/dados-embed.js */
    personagens: function () {
      if (cache) return cache;
      if (location.protocol === 'file:') return (cache = carregarEmbed());
      cache = fetch(new URL('../data/personagens.json', base))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(carregarEmbed);
      return cache;
    },
    norm: function (s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); },
    anunciar: function (msg) {
      var r = document.getElementById('sr-live');
      if (!r) { r = document.createElement('p'); r.id = 'sr-live'; r.className = 'sr-only'; r.setAttribute('aria-live', 'polite'); document.body.appendChild(r); }
      r.textContent = ''; requestAnimationFrame(function () { r.textContent = msg; });
    },
    /* salto só quando o ranking começa no "(início)" */
    salto: function (p) { return p.inicioOficial && p.rankingFinal ? p.rankingInicio - p.rankingFinal : null; },
    transicao: function (fn) {
      if (BL.reduce || !document.startViewTransition) return fn();
      var t = document.startViewTransition(fn), nada = function () {};
      /* transições interrompidas (cliques rápidos) não devem gerar erros não tratados */
      t.ready.catch(nada); t.finished.catch(nada); t.updateCallbackDone.catch(nada);
    },
    /* chave de Arma: ignora parênteses ("Visão espacial (Spatial Awareness)" = "visão espacial") */
    chaveArma: function (a) { return BL.norm(String(a).replace(/\s*\([^)]*\)/g, '')); },
    sobrenome: function (p) { return p.nome.split(' ').slice(-1)[0]; }
  };
})();
