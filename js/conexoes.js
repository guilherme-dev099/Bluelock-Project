/* Seção "Conexões" nas fichas: quem dividiu time com o personagem (fases seguras) + Número de Isagi */
(function () {
  'use strict';
  var BL = window.BL, info = document.querySelector('.char .info');
  if (!BL || !BL.grafo || !info) return;
  var id = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    if (!por[id]) return;
    var G = BL.grafo(todos), adj = G.adj, viz = Object.keys(adj[id] || {});
    var dist = BL.bfs(adj, 'isagi').dist, n = dist[id];
    var sec = document.createElement('section'); sec.className = 'conexoes'; sec.setAttribute('aria-labelledby', 'cx-t');
    var num = id === 'isagi' ? 'Número de Isagi: <b>0</b> (é o próprio)' : (n == null ? 'Número de Isagi: <b>—</b> (sem caminho até o Isagi pelas fichas)' : 'Número de Isagi: <b>' + n + '</b> · <a href="graus.html?de=isagi&ate=' + id + '">ver o caminho</a>');
    if (!viz.length) {
      sec.innerHTML = '<h2 class="ph" id="cx-t">Conexões</h2><p class="cx-num">' + num + '</p><p class="cx-vazio">Sem time em comum registrado nas fichas (1ª Seleção, Blue Lock × Sub-20, NEL, times anteriores ou situação atual).</p>';
    } else {
      var lista = viz.map(function (v) { return { p: por[v], l: adj[id][v] }; }).sort(function (a, b) { return b.l.length - a.l.length || a.p.nome.localeCompare(b.p.nome); });
      sec.innerHTML = '<h2 class="ph" id="cx-t">Conexões</h2><p class="cx-num">' + num + '</p>' +
        '<details class="cx-det"><summary>' + lista.length + (lista.length === 1 ? ' companheiro de time' : ' companheiros de time') + ' nas fichas</summary><ul class="cx-lista">' +
        lista.map(function (x) { return '<li><a href="' + BL.esc(x.p.url) + '"><img src="' + BL.esc(BL.thumb(x.p)) + '" alt="" width="32" height="32" loading="lazy"> ' + BL.esc(x.p.nome) + '</a> <small>' + x.l.map(function (l) { return BL.esc(BL.lacoTxt(l)); }).join(' · ') + '</small></li>'; }).join('') +
        '</ul></details><p class="cx-nota">Só contam fases em que dá para afirmar que jogaram juntos (2ª e 3ª Seleção ficam de fora). <a href="graus.html?de=' + id + '">Ligar a outro personagem →</a></p>';
    }
    var antes = info.querySelector('.cmp') || info.querySelector('.src');
    info.insertBefore(sec, antes);
  });
})();
