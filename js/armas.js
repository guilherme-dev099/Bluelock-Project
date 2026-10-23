/* Arsenal: todas as Armas que aparecem nas fichas, quem tem cada uma e afinidade por Armas em comum.
   Nenhuma descrição é escrita: só o nome como está na ficha e os portadores. Grupos = palavras-chave do motor do x1 (BLX1.CHAVES). */
(function () {
  'use strict';
  var BL = window.BL, M = window.BLX1; if (!BL || !M) return;
  var raiz = document.querySelector('.ar'); if (!raiz) return;
  var esc = BL.esc, norm = BL.norm, $ = function (s) { return raiz.querySelector(s); };
  var GRUPOS = M.ATR.map(function (a) { return { k: a[0], rot: a[1] }; }).concat([{ k: 'outras', rot: 'Outras' }]);
  var ROT = {}; GRUPOS.forEach(function (g) { ROT[g.k] = g.rot; });
  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    /* índice invertido: chave normalizada → { nomes (formas da ficha), quem } */
    var idx = {};
    todos.forEach(function (p) {
      (p.armas || []).forEach(function (a) {
        var k = BL.chaveArma(a); if (!k) return;
        var o = idx[k] = idx[k] || { k: k, formas: {}, quem: [] };
        o.formas[a] = (o.formas[a] || 0) + 1;
        if (o.quem.indexOf(p) < 0) o.quem.push(p);
      });
    });
    var lista = Object.keys(idx).map(function (k) {
      var o = idx[k], f = Object.keys(o.formas).sort(function (a, b) { return o.formas[b] - o.formas[a] || b.length - a.length; })[0];
      o.nome = f.charAt(0).toUpperCase() + f.slice(1);
      o.id = 'arma-' + k.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      o.grupos = Object.keys(M.CHAVES).filter(function (g) { return M.CHAVES[g].test(k); });
      if (!o.grupos.length) o.grupos = ['outras'];
      o.quem.sort(function (a, b) { return a.ordem - b.ordem; });
      return o;
    });
    var unicas = lista.filter(function (o) { return o.quem.length === 1; }).length;
    var topo = lista.slice().sort(function (a, b) { return b.quem.length - a.quem.length; })[0];
    $('.ar-resumo').innerHTML = '<b>' + lista.length + '</b> Armas diferentes nas fichas · <b>' + unicas + '</b> aparecem numa ficha só · a mais comum: <a href="#' + esc(topo.id) + '">' + esc(topo.nome) + '</a> (' + topo.quem.length + ')';

    /* filtros */
    var filtro = { g: '', q: '', ord: 'n', unicas: false };
    $('.ar-grupos').innerHTML = '<button type="button" class="al-chip" data-g="" aria-pressed="true">Todas</button>' + GRUPOS.map(function (g) {
      var n = lista.filter(function (o) { return o.grupos.indexOf(g.k) >= 0; }).length;
      return '<button type="button" class="al-chip" data-g="' + g.k + '" aria-pressed="false">' + esc(g.rot) + ' <small>' + n + '</small></button>';
    }).join('') + '<button type="button" class="al-chip" data-u="1" aria-pressed="false">★ Armas únicas <small>' + unicas + '</small></button>';
    var ul = $('.ar-lista'), cont = $('.ar-cont');
    function item(o) {
      var unica = o.quem.length === 1, rostos = o.quem.slice(0, 40);
      var x1 = unica ? '<a class="btn btn-2" href="duelo.html?a=' + esc(o.quem[0].id) + '">⚔ Desafiar ' + esc(o.quem[0].nome) + ' no x1</a>'
        : '<button type="button" class="btn btn-2" data-x1="' + esc(o.k) + '">⚔ x1 entre dois portadores</button>';
      return '<li><details id="' + esc(o.id) + '"><summary><span class="ar-nome">' + esc(o.nome) + '</span>' + (unica ? ' <span class="ar-unica">★ Arma única</span>' : '') +
        '<span class="ar-n">' + o.quem.length + (o.quem.length === 1 ? ' personagem' : ' personagens') + '</span>' +
        '<span class="ar-gs">' + o.grupos.map(function (g) { return '<span class="chip ar-g-' + g + '">' + esc(ROT[g]) + '</span>'; }).join('') + '</span></summary>' +
        '<ul class="ar-quem" aria-label="Quem tem ' + esc(o.nome) + '">' + rostos.map(function (p) {
          return '<li><a href="' + esc(p.url) + '"><img src="' + esc(BL.thumb(p)) + '" alt="" width="48" height="48" loading="lazy"><span>' + esc(p.nome) + '</span></a></li>';
        }).join('') + '</ul>' + (Object.keys(o.formas).length > 1 ? '<p class="ar-formas">Nas fichas também aparece como: ' + Object.keys(o.formas).filter(function (f) { return f.toLowerCase() !== o.nome.toLowerCase(); }).map(esc).join(' · ') + '</p>' : '') +
        '<div class="x1-botoes">' + x1 + '</div></details></li>';
    }
    function desenhar() {
      var q = norm(filtro.q);
      var l = lista.filter(function (o) {
        return (!filtro.g || o.grupos.indexOf(filtro.g) >= 0) && (!filtro.unicas || o.quem.length === 1) &&
          (!q || o.k.indexOf(q) >= 0 || o.quem.some(function (p) { return norm(p.nome).indexOf(q) >= 0; }));
      });
      l.sort(filtro.ord === 'az' ? function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); } : function (a, b) { return b.quem.length - a.quem.length || a.nome.localeCompare(b.nome, 'pt'); });
      ul.innerHTML = l.length ? l.map(item).join('') : '<li class="ar-vazio">Nenhuma Arma com esse filtro.</li>';
      cont.textContent = l.length + (l.length === 1 ? ' Arma' : ' Armas') + (filtro.g || filtro.unicas || q ? ' neste filtro' : '');
    }
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('.ar-grupos button');
      if (b) {
        if (b.dataset.u) { filtro.unicas = !filtro.unicas; b.setAttribute('aria-pressed', String(filtro.unicas)); }
        else { filtro.g = b.dataset.g; [].forEach.call(raiz.querySelectorAll('.ar-grupos [data-g]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
        desenhar(); BL.anunciar(cont.textContent); return;
      }
      var x = e.target.closest('[data-x1]');
      if (x) {
        var q = idx[x.dataset.x1].quem, i = Math.floor(Math.random() * q.length), j = (i + 1 + Math.floor(Math.random() * (q.length - 1))) % q.length;
        location.href = 'duelo.html?a=' + q[i].id + '&b=' + q[j].id;
      }
    });
    var tq = null;
    $('#ar-q').addEventListener('input', function (e) { filtro.q = e.target.value; clearTimeout(tq); tq = setTimeout(function () { desenhar(); BL.anunciar(cont.textContent); }, 200); });
    $('#ar-ord').addEventListener('change', function (e) { filtro.ord = e.target.value; desenhar(); });
    /* link direto: armas.html#arma-metavision abre a Arma */
    ul.addEventListener('toggle', function (e) {
      var d = e.target; if (d.tagName !== 'DETAILS' || !d.open) return;
      try { history.replaceState(null, '', '#' + d.id); } catch (x) {}
    }, true);
    desenhar();
    function abrirHash() {
      var h = decodeURIComponent(location.hash.slice(1)); if (!h) return;
      var d = document.getElementById(h);
      if (!d && h.indexOf('arma-') === 0) { filtro = { g: '', q: '', ord: filtro.ord, unicas: false }; desenhar(); d = document.getElementById(h); }
      if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView({ block: 'start', behavior: BL.reduce ? 'auto' : 'smooth' }); d.querySelector('summary').focus({ preventScroll: true }); }
    }
    abrirHash(); addEventListener('hashchange', abrirHash);

    /* afinidade: quem tem mais Armas em comum com um personagem */
    var chaves = function (p) { var s = {}; (p.armas || []).forEach(function (a) { s[BL.chaveArma(a)] = a; }); return s; };
    var afin = $('.ar-afin');
    function afinidade(p) {
      var ka = chaves(p), l = [];
      todos.forEach(function (o) {
        if (o === p) return; var kb = chaves(o), c = Object.keys(ka).filter(function (k) { return k in kb; });
        if (c.length) l.push({ p: o, c: c });
      });
      l.sort(function (a, b) { return b.c.length - a.c.length || a.p.ordem - b.p.ordem; });
      var nA = Object.keys(ka).length;
      afin.innerHTML = '<h3 tabindex="-1">' + esc(p.nome) + ' <small>· ' + nA + (nA === 1 ? ' Arma na ficha' : ' Armas na ficha') + '</small></h3>' +
        (!nA ? '<p>A ficha não lista Armas.</p>' : !l.length ? '<p>Ninguém mais tem uma dessas Armas nas fichas: todas são únicas.</p>' :
        '<ol class="ar-afin-l">' + l.slice(0, 8).map(function (x) {
          return '<li><a href="' + esc(x.p.url) + '"><img src="' + esc(BL.thumb(x.p)) + '" alt="" width="40" height="40" loading="lazy"><b>' + esc(x.p.nome) + '</b></a> <span>' + x.c.length + ' em comum: ' +
            x.c.map(function (k) { return '<a href="#' + esc(idx[k].id) + '">' + esc(idx[k].nome) + '</a>'; }).join(', ') + '</span> <a class="ar-x1" href="duelo.html?a=' + esc(p.id) + '&b=' + esc(x.p.id) + '" aria-label="x1 ' + esc(p.nome) + ' contra ' + esc(x.p.nome) + '">⚔ x1</a></li>';
        }).join('') + '</ol>');
      try { history.replaceState(null, '', '?p=' + p.id + location.hash); } catch (e) {}
      BL.anunciar('Afinidade de ' + p.nome + ': ' + Math.min(8, l.length) + ' personagens com Armas em comum.');
    }
    BL.combobox($('#ar-p'), $('#ar-p-lista'), {
      fonte: function () { return todos.filter(function (p) { return (p.armas || []).length; }); },
      sub: function (p) { return (p.armas || []).length + ' Armas'; },
      escolher: afinidade
    });
    var ini = new URLSearchParams(location.search).get('p');
    if (ini && por[ini]) afinidade(por[ini]);
  }).catch(function (e) { console.warn('Arsenal indisponível:', e); });
})();
