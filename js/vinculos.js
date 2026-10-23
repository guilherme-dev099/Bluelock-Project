/* Vínculos entre personagens (quem dividiu time numa fase "segura") — compartilhado por Seis graus, Conexões, Prancheta, Vestiário e Liga.
   2ª e 3ª Seleção ficam de fora: Red/White e "Time Blue Lock" são registros de grupo, não times em que jogaram juntos. */
(function () {
  'use strict';
  var BL = window.BL; if (!BL) return;
  BL.FASES_SEGURAS = { '1ª Seleção': 1, 'Blue Lock × Sub-20': 1, 'Neo Egoist League': 1, 'Antes / outros times': 1, 'Atual': 0.5 };
  BL.FASE_CURTA = { '1ª Seleção': '1ª Seleção', 'Blue Lock × Sub-20': 'BL × Sub-20', 'Neo Egoist League': 'NEL', 'Antes / outros times': 'antes', 'Atual': 'atual' };
  BL.grafo = function (todos) {
    if (BL._grafo) return BL._grafo;
    var grupos = {}, adj = {};
    todos.forEach(function (p) {
      adj[p.id] = {};
      p.fases.forEach(function (f) {
        if (!(f.fase in BL.FASES_SEGURAS) || !f.times || !f.times[0]) return;
        var k = f.fase + '|' + f.times[0]; grupos[k] = grupos[k] || [];
        if (grupos[k].indexOf(p.id) < 0) grupos[k].push(p.id);
      });
    });
    Object.keys(grupos).forEach(function (k) {
      var g = grupos[k], fase = k.split('|')[0], time = k.split('|')[1];
      g.forEach(function (a) { g.forEach(function (b) { if (a !== b) (adj[a][b] = adj[a][b] || []).push({ fase: fase, time: time, peso: BL.FASES_SEGURAS[fase] }); }); });
    });
    return (BL._grafo = { adj: adj, grupos: grupos });
  };
  /* BFS guardando todos os pais (caminhos alternativos de mesmo tamanho) */
  BL.bfs = function (adj, s) {
    var dist = {}, pais = {}, fila = [s], i = 0; dist[s] = 0; pais[s] = [];
    while (i < fila.length) {
      var u = fila[i++];
      Object.keys(adj[u] || {}).sort().forEach(function (v) {
        if (!(v in dist)) { dist[v] = dist[u] + 1; pais[v] = [u]; fila.push(v); }
        else if (dist[v] === dist[u] + 1) pais[v].push(u);
      });
    }
    return { dist: dist, pais: pais };
  };
  BL.caminho = function (r, t, escolha) {
    if (!(t in r.dist)) return null; var c = [t];
    while (r.pais[c[0]].length) { var ps = r.pais[c[0]]; c.unshift(ps[escolha ? escolha(ps.length) : 0]); }
    return c;
  };
  /* rótulo do laço mais forte entre a e b: "Blue Lock Eleven (BL × Sub-20)" */
  BL.lacoTxt = function (l) { return l.time + ' (' + (BL.FASE_CURTA[l.fase] || l.fase) + ')'; };
  BL.melhorLaco = function (adj, a, b) { return (adj[a][b] || []).slice().sort(function (x, y) { return y.peso - x.peso; })[0]; };
})();
