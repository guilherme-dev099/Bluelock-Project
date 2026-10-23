/* P2 "Do Time Z ao mundo": linha do tempo por fase com avatares que voam entre blocos (View Transitions = FLIP nativo) — historia.html */
(function () {
  'use strict';
  var BL = window.BL, root = document.querySelector('.tl');
  if (!BL || !root) return;
  var esc = BL.esc;
  var NOTAS = {
    '2ª Seleção': 'Na 2ª Seleção as fichas registram apenas os grupos "Time Red" e "Time White" (alguns passaram pelos dois). Estar no mesmo bloco aqui não significa que jogaram juntos.',
    '3ª Seleção': '"Time Blue Lock" reúne todos os aprovados da 2ª Seleção, que passaram em times diferentes.',
    'Neo Egoist League': 'Clubes da NEL (Alemanha, Espanha, Inglaterra, Itália e França).',
    'Atual': 'Situação mais recente registrada nas fichas.'
  };
  BL.personagens().then(function (dados) {
    var FASES = BL.FASES, lista = root.querySelector('.tl-fases'), painel = root.querySelector('.tl-painel'), nota = root.querySelector('.tl-nota');
    var playBtn = root.querySelector('.tl-play'), atual = 0, timer = null;
    FASES.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'tab-' + i; b.textContent = f; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'tl-painel');
      b.addEventListener('click', function () { parar(); ir(i); });
      lista.appendChild(b);
    });
    painel.id = 'tl-painel';

    function grupos(fase) {
      var g = [], idx = {}, fora = [];
      dados.forEach(function (p) {
        var f = p.fases.filter(function (x) { return x.fase === fase; })[0];
        if (!f) { fora.push({ p: p }); return; }
        var t = f.times[0];
        if (!(t in idx)) { idx[t] = g.length; g.push([t, []]); }
        g[idx[t]][1].push({ p: p, f: f });
      });
      g.sort(function (a, b) { return b[1].length - a[1].length; });
      return { g: g, fora: fora };
    }
    function avatar(x) {
      var p = x.p, f = x.f;
      return '<li><a href="' + esc(p.url) + '" class="av" style="view-transition-name:av-' + esc(p.id) + '">' +
        '<img src="' + esc(p.img) + '" alt="" width="56" height="56" loading="lazy">' +
        '<span class="av-n">' + esc(p.nome) + '</span>' +
        (f && f.numero ? '<span class="av-num">nº ' + esc(f.numero) + '</span>' : '') +
        (f && f.papel ? '<span class="av-papel">' + esc(f.papel) + '</span>' : '') + '</a></li>';
    }
    function render() {
      var fase = FASES[atual], r = grupos(fase);
      painel.innerHTML = r.g.map(function (t) {
        return '<section class="tl-time"><h3>' + esc(t[0]) + ' <small>' + t[1].length + '</small></h3><ul>' + t[1].map(avatar).join('') + '</ul></section>';
      }).join('') + (r.fora.length ? '<section class="tl-time tl-fora"><h3>Sem registro nesta fase <small>' + r.fora.length + '</small></h3><ul>' + r.fora.map(avatar).join('') + '</ul></section>' : '');
      nota.textContent = NOTAS[fase] || '';
      [].forEach.call(lista.children, function (t, i) { t.setAttribute('aria-selected', String(i === atual)); t.tabIndex = i === atual ? 0 : -1; });
      painel.setAttribute('aria-labelledby', 'tab-' + atual);
      var tab = lista.children[atual];
      if (tab.scrollIntoView && lista.scrollWidth > lista.clientWidth) lista.scrollTo({ left: tab.offsetLeft - lista.offsetLeft - 12, behavior: BL.reduce ? 'auto' : 'smooth' });
    }
    function ir(i, anunciar) {
      atual = (i + FASES.length) % FASES.length;
      BL.transicao(render);
      if (anunciar !== false) BL.anunciar('Fase: ' + FASES[atual]);
    }
    function parar() {
      clearInterval(timer); timer = null;
      playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = '▶ Reproduzir trajetória';
    }
    lista.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1, Home: -atual, End: FASES.length - 1 - atual }[e.key];
      if (d === undefined) return;
      e.preventDefault(); parar(); ir(atual + d); lista.children[atual].focus();
    });
    root.querySelector('.tl-prev').addEventListener('click', function () { parar(); ir(atual - 1); });
    root.querySelector('.tl-next').addEventListener('click', function () { parar(); ir(atual + 1); });
    playBtn.addEventListener('click', function () {
      if (timer) { parar(); return; }
      playBtn.setAttribute('aria-pressed', 'true'); playBtn.textContent = '❚❚ Pausar';
      ir(0);
      timer = setInterval(function () { if (atual === FASES.length - 1) parar(); else ir(atual + 1); }, BL.reduce ? 2500 : 1600);
    });
    root.hidden = false;
    render();
  }).catch(function (e) { console.warn('Linha do tempo indisponível:', e); });
})();
