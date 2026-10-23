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
      if (BL.voz && BL.voz.on) return; /* narrador por voz ligado: não falar junto */
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
    sobrenome: function (p) { return p.nome.split(' ').slice(-1)[0]; },
    /* miniatura 112×112 (img/thumb) para avatares pequenos; cai para a foto grande */
    /* versão dos dados (js/versao.js): links com semente levam &v= ; aviso se o link for de outra versão */
    versao: function () { return window.BL_VERSAO || ''; },
    avisoVersao: function (el) {
      var v = new URLSearchParams(location.search).get('v');
      if (!el || !v || !window.BL_VERSAO || v === window.BL_VERSAO) return false;
      var p = document.createElement('p'); p.className = 'aviso-versao'; p.setAttribute('role', 'note');
      p.textContent = 'Este link é de uma versão anterior dos dados (' + v + ' → ' + window.BL_VERSAO + '); o resultado pode ser diferente do que foi compartilhado.';
      el.insertBefore(p, el.firstChild); return true;
    },
    thumb: function (p) { return p.thumb || p.img; },
    /* link compartilhável: em file:// usa o site publicado como base */
    PUBLICO: 'https://guilherme-dev099.github.io/Bluelock-Project/',
    urlPublica: function (pagina, busca) {
      pagina = pagina || (location.pathname.split('/').pop() || 'index.html');
      busca = busca == null ? location.search : busca;
      if (location.protocol === 'file:') return BL.PUBLICO + pagina + busca;
      return new URL(pagina + busca, location.href).href;
    },
    copiar: function (texto, botao, rotulo) {
      var ok = function () {
        BL.anunciar(rotulo || 'Link copiado');
        if (!botao) return;
        var o = botao.textContent; botao.textContent = (rotulo || 'Link copiado') + ' ✓';
        setTimeout(function () { botao.textContent = o; }, 2000);
      };
      var fb = function () {
        var t = document.createElement('textarea'); t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        var deu = false; try { deu = document.execCommand('copy'); } catch (x) {}
        t.remove(); deu ? ok() : prompt('Copie:', texto);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(ok, fb); else fb();
    }
  };
})();
