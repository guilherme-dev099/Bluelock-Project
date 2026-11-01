/* Fábrica de Desafios: codificação compartilhada (editor e player). Ids → índice em BL_ORDEM (só cresce no fim). */
(function () {
  'use strict';
  var O = window.BL_ORDEM || [], MAXT = 40;
  var TIPOS = { a: { nome: 'Adivinhe o personagem', min: 1, max: 5 }, c: { nome: 'Copa do Ego', min: 4, max: 16 }, g: { nome: 'Seis graus', min: 2, max: 2 }, x: { nome: 'Duelo x1', min: 2, max: 2 } };
  var PISTAS = [['pos', 'Posição'], ['arma', 'Arma'], ['fase', '1ª fase e time'], ['rank', 'Ranking final'], ['nel', 'Clube na NEL']];
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function limpar(t) { return String(t || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAXT); }
  function codificar(d) {
    var o = { v: 1, t: d.t, n: limpar(d.n), i: d.ids.map(function (id) { return O.indexOf(id); }) };
    if (d.t === 'a') o.h = d.pistas.map(function (ps) { return PISTAS.reduce(function (m, p, k) { return m | (ps.indexOf(p[0]) >= 0 ? 1 << k : 0); }, 0); });
    if (d.t === 'g' && d.lim) o.l = d.lim;
    return b64e(JSON.stringify(o));
  }
  function decodificar(s) {
    var o; try { o = JSON.parse(b64d(String(s).slice(0, 2000))); } catch (e) { return null; }
    if (!o || o.v !== 1 || !TIPOS[o.t] || !Array.isArray(o.i)) return null;
    var T = TIPOS[o.t]; if (o.i.length < T.min || o.i.length > T.max) return null;
    var ids = o.i.map(function (n) { return typeof n === 'number' && n >= 0 && n < O.length ? O[n] : null; });
    if (ids.indexOf(null) >= 0) return null;
    var d = { t: o.t, n: limpar(o.n), ids: ids };
    if (o.t === 'a') { if (!Array.isArray(o.h) || o.h.length !== ids.length) return null; d.pistas = o.h.map(function (m) { return PISTAS.filter(function (p, k) { return m & (1 << k); }).map(function (p) { return p[0]; }); }); }
    if (o.t === 'g') d.lim = Math.max(1, Math.min(6, parseInt(o.l, 10) || 3));
    return d;
  }
  window.BL_FAB = { TIPOS: TIPOS, PISTAS: PISTAS, codificar: codificar, decodificar: decodificar, limpar: limpar, MAXT: MAXT };
})();
