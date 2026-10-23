/* P1 "Arquivo Blue Lock": busca, filtros (clube NEL, posição, Arma), ordenação e estado na URL — index.html */
(function () {
  'use strict';
  var BL = window.BL, form = document.querySelector('.arquivo');
  if (!BL || !form) return;
  var POS = ['atacante', 'centroavante', 'meia', 'ponta', 'ala', 'lateral', 'volante', 'zagueiro', 'goleiro'];
  var CATS = { protagonistas: 'Protagonistas', bl: 'Outros do Blue Lock', sub20: 'Sub-20 Japão', nel: 'Clubes da NEL', selecoes: 'Seleções estrangeiras', staff: 'Treinadores & Staff', outros: 'Outros' };
  var ORDENS = { final: 'Ranking final', inicio: 'Ranking inicial', salto: 'Maior salto', az: 'A–Z' };
  BL.personagens().then(function (dados) {
    var porId = {}; dados.forEach(function (p) { porId[p.id] = p; });
    var idDe = function (el) { return el.getAttribute('href').replace('.html', ''); };
    var cards = [].map.call(document.querySelectorAll('a.card'), function (el) { return { el: el, p: porId[idDe(el)] }; })
      .filter(function (c) { return c.p; });
    var ordemOriginal = cards.map(function (c) { return c.el; });
    var clubeNEL = function (p) { var f = p.fases.filter(function (x) { return x.fase === 'Neo Egoist League'; })[0]; return f ? f.times[0] : null; };
    var posicoes = function (p) { var t = BL.norm((p.posicao || '').replace(/\([^)]*\)/g, '')); return POS.filter(function (k) { return t.indexOf(k) >= 0; }); };
    var armasN = function (p) { return p.armas.map(BL.chaveArma); };
    var slug = function (s) { return BL.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };

    var contagemArmas = {}, rotuloArma = {};
    dados.forEach(function (p) { p.armas.forEach(function (a) { var k = BL.chaveArma(a); contagemArmas[k] = (contagemArmas[k] || 0) + 1; rotuloArma[k] = rotuloArma[k] || cap(a.replace(/\s*\([^)]*\)/g, '')); }); });
    var opcoes = {
      categoria: Object.keys(CATS).filter(function (k) { return dados.some(function (p) { return p.categoria === k; }); }),
      clube: dados.map(clubeNEL).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(),
      posicao: POS.filter(function (k) { return dados.some(function (p) { return posicoes(p).indexOf(k) >= 0; }); }),
      arma: Object.keys(contagemArmas).filter(function (k) { return contagemArmas[k] >= 2; }).sort(function (a, b) { return contagemArmas[b] - contagemArmas[a]; }).slice(0, 16)
    };
    var rotulo = { categoria: function (v) { return CATS[v]; }, clube: function (v) { return v; }, posicao: cap, arma: function (v) { return rotuloArma[v] + ' (' + contagemArmas[v] + ')'; } };

    // estado (URL usa slugs legíveis: ?clube=bastard-munchen&arma=metavision&ordem=salto&q=flow)
    var qs = new URLSearchParams(location.search), estado = {};
    Object.keys(opcoes).forEach(function (t) { var v = qs.get(t); var hit = v && opcoes[t].filter(function (o) { return slug(o) === v; })[0]; if (hit) estado[t] = hit; });
    var q = document.getElementById('q'), ordem = document.getElementById('ordem'), cont = document.getElementById('contagem');
    q.value = qs.get('q') || '';
    if (ORDENS[qs.get('ordem')]) ordem.value = qs.get('ordem');

    Object.keys(opcoes).forEach(function (tipo) {
      var box = form.querySelector('[data-filtro=' + tipo + ']');
      opcoes[tipo].forEach(function (v) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = rotulo[tipo](v); b.dataset.v = v;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { estado[tipo] = estado[tipo] === v ? undefined : v; aplicar(true); });
        box.appendChild(b);
      });
    });
    function nomear(on) {
      cards.forEach(function (c) { var g = c.el.closest('details'); c.el.style.viewTransitionName = on && !c.el.hidden && (!g || g.open) ? 'card-' + c.p.id : ''; });
    }

    function passa(p) {
      var t = BL.norm(q.value);
      return (!t || BL.norm(p.nome).indexOf(t) >= 0 || armasN(p).some(function (a) { return a.indexOf(t) >= 0; }))
        && (!estado.categoria || p.categoria === estado.categoria)
        && (!estado.clube || clubeNEL(p) === estado.clube)
        && (!estado.posicao || posicoes(p).indexOf(estado.posicao) >= 0)
        && (!estado.arma || armasN(p).indexOf(estado.arma) >= 0);
    }
    var CHAVE = {
      final: function (p) { return p.rankingFinal || 999; },
      inicio: function (p) { return p.inicioOficial ? p.rankingInicio : 999; },
      salto: function (p) { var s = BL.salto(p); return s == null ? 1e6 : -s; },
      az: function (p) { return BL.norm(p.nome); }
    };
    function badge(c, k) {
      var r = c.el.querySelector('.rank'); if (!r) { if (k !== 'salto') return; }
      var s = BL.salto(c.p);
      if (!r) return;
      var v = r.querySelector('.rank-v'), sr = r.querySelector('.sr-only');
      if (k === 'salto' && s != null) { v.textContent = '+' + s; sr.textContent = 'Salto no ranking: '; r.classList.add('salto'); }
      else { v.textContent = '#' + c.p.rankingFinal; sr.textContent = 'Ranking final '; r.classList.remove('salto'); }
    }
    function aplicar(animar) {
      var mudar = function () {
        var n = 0, k = ordem.value;
        cards.forEach(function (c) { var ok = passa(c.p); c.el.hidden = !ok; if (ok) n++; badge(c, k); });
        var lista = k ? ordemOriginal.slice().sort(function (a, b) {
          var x = CHAVE[k](porId[idDe(a)]), y = CHAVE[k](porId[idDe(b)]);
          return x < y ? -1 : x > y ? 1 : 0;
        }) : ordemOriginal;
        lista.forEach(function (el) { el.parentNode.appendChild(el); });
        form.querySelectorAll('[data-filtro] button').forEach(function (b) {
          b.setAttribute('aria-pressed', String(estado[b.parentNode.dataset.filtro] === b.dataset.v));
        });
        var ativo = !!(q.value.trim() || Object.keys(estado).some(function (t) { return estado[t]; }));
        document.querySelectorAll('details.grupo').forEach(function (d) {
          var vis = [].filter.call(d.querySelectorAll('a.card'), function (c) { return !c.hidden; }).length;
          d.hidden = vis === 0;
          var n = d.querySelector('.n'); if (n) n.textContent = vis;
          if (d.dataset.aberto === undefined) d.dataset.aberto = d.open ? '1' : '';
          if (ativo) { if (!d.dataset.auto) d.dataset.auto = '1'; d.open = vis > 0 && (vis <= 40 || d.dataset.aberto === '1' || estado.categoria === d.dataset.cat); }
          else if (d.dataset.auto) { d.open = d.dataset.aberto === '1'; delete d.dataset.auto; }
        });
        var msg = n ? n + (n === 1 ? ' personagem encontrado' : ' personagens encontrados') + (k ? ' · ordem: ' + ORDENS[k] : '') : 'Nenhum personagem com esses filtros';
        cont.textContent = msg;
        var u = new URLSearchParams();
        if (q.value.trim()) u.set('q', q.value.trim());
        Object.keys(estado).forEach(function (t) { if (estado[t]) u.set(t, slug(estado[t])); });
        if (k) u.set('ordem', k);
        var s = u.toString();
        try { history.replaceState(null, '', (s ? '?' + s : location.pathname) + location.hash); } catch (e) {}
      };
      var visiveis = cards.filter(function (c) { var g = c.el.closest('details'); return !c.el.hidden && (!g || g.open); }).length;
      if (animar && visiveis <= 60) { nomear(true); BL.transicao(function () { mudar(); nomear(true); }); setTimeout(function () { nomear(false); }, 900); } else mudar();
    }
    q.addEventListener('input', function () { aplicar(false); });
    ordem.addEventListener('change', function () { aplicar(true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('reset', function () { Object.keys(estado).forEach(function (k) { delete estado[k]; }); setTimeout(function () { aplicar(true); }); });
    form.hidden = false;
    aplicar(false);
  }).catch(function (e) { console.warn('Arquivo indisponível:', e); });
})();
