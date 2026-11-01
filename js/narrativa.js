/* Narrativa interativa "300 → 1" (rodada 2, #5): motor de cenas, condições, efeitos, save e mapa de finais. Script clássico. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, app = $('#nar'), RO = window.BL_ROTEIRO; if (!app || !RO || !window.BL) return;
  var esc = BL.esc, K = 'bl-narrativa', KF = 'bl-narrativa-finais', por = {};
  var ATR = [['chu', 'Chute'], ['dri', 'Drible'], ['vel', 'Velocidade'], ['fis', 'Físico'], ['lei', 'Leitura']];
  var NOMEQ = { isagi: 'Isagi', bachira: 'Bachira', kunigami: 'Kunigami', chigiri: 'Chigiri', barou: 'Barou' };
  function ler(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function novo() { return { cena: RO.inicio, ego: 0, chu: 0, dri: 0, vel: 0, fis: 0, lei: 0, q: {}, flags: {}, arma: '', hist: [], semente: Math.random().toString(36).slice(2, 8), x1: null }; }
  var E = ler(K, null) || novo();
  function stats() { var s = { chu: 68 + 2 * E.chu, dri: 68 + 2 * E.dri, vel: 68 + 2 * E.vel, fis: 68 + 2 * E.fis, def: 66 + 2 * E.lei, ego: 66 + 2 * E.ego }; for (var k in s) s[k] = Math.min(97, s[k]); s.ovr = Math.round((s.chu * 1.2 + s.dri + s.vel + s.fis + s.def * 0.8 + s.ego) / 6); return s; }
  function valor(nome) { if (nome === 'ovr') return stats().ovr; if (nome === 'arma') return E.arma ? 1 : 0; if (nome.indexOf('q.') === 0) return E.q[nome.slice(2)] || 0; if (nome in E && typeof E[nome] === 'number') return E[nome]; return E.flags[nome] ? 1 : 0; }
  function cond(se) {
    if (!se) return true; var m = se.match(/^([\w.]+)\s*(>=|<=|<|>|==)?\s*(\d+)?$/); if (!m) return false;
    var v = valor(m[1]), n = +(m[3] || 1);
    return !m[2] ? v > 0 : m[2] === '>=' ? v >= n : m[2] === '<=' ? v <= n : m[2] === '<' ? v < n : m[2] === '>' ? v > n : v === n;
  }
  function efeito(ef) {
    var out = [];
    ef.forEach(function (e) {
      var k = e[0], v = e[1];
      if (typeof v === 'number') { if (k.indexOf('q.') === 0) { E.q[k.slice(2)] = (E.q[k.slice(2)] || 0) + v; out.push('Química com ' + (NOMEQ[k.slice(2)] || k.slice(2)) + ' +' + v); } else { E[k] = (E[k] || 0) + v; var r = k === 'ego' ? 'Ego' : (ATR.filter(function (a) { return a[0] === k; })[0] || [0, k])[1]; out.push(r + (v > 0 ? ' +' : ' ') + v); } }
      else if (k === 'arma') { E.arma = v; out.push('Arma: ' + v); } else if (k === 'flag') E.flags[v] = 1;
    });
    return out;
  }
  function ir(id, ganhos) {
    var c = RO.cenas[id]; E.cena = id; E.x1 = null;
    if (c.x1) {
      var adv = por[c.x1.adv], eu = { id: 'voce-300', nome: 'Você (nº 300)', posicao: 'Atacante', armas: E.arma ? [E.arma] : [], img: '' };
      if (adv && window.BLX1) {
        var r = BLX1.simular(eu, adv, E.semente + '-' + id, { sA: stats() });
        E.x1 = { adv: adv.nome, venceu: r.venc === 0, g: [r.J[0].g, r.J[1].g], lances: r.ev.filter(function (e) { return e.txt && (e.t === 'gol' || e.t === 'flow' || e.t === 'ouro'); }).slice(0, 6).map(function (e) { return e.txt; }) };
      } else E.x1 = { adv: c.x1.adv, venceu: stats().ovr >= 80, g: [0, 0], lances: [] };
    }
    if (c.fim) { var F = ler(KF, {}); if (!F[c.fim.k]) { F[c.fim.k] = new Date().toISOString().slice(0, 10); gravar(KF, F); if (window.blEv) blEv('narrativa', { final: c.fim.k, n: Object.keys(F).length }); } }
    gravar(K, E); render(ganhos);
  }
  function retrato(id) { var p = por[id]; return p ? '<img class="nr-ret" src="' + esc(p.img) + '" alt="' + esc(p.nome) + '" width="480" height="552">' : ''; }
  function render(ganhos) {
    var c = RO.cenas[E.cena]; if (!c) { E = novo(); c = RO.cenas[E.cena]; }
    var h = '<article class="nr-cena" aria-labelledby="nr-t">' + (c.ret ? '<figure class="nr-fig">' + retrato(c.ret) + '</figure>' : '') + '<div class="nr-txt">' +
      '<h2 id="nr-t" tabindex="-1">' + esc(c.tit) + '</h2>' + (ganhos && ganhos.length ? '<p class="nr-ganho" role="status">' + esc(ganhos.join(' · ')) + '</p>' : '') +
      c.txt.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
    if (c.x1 && E.x1) {
      h += '<section class="nr-x1" aria-label="Resultado do x1"><p class="nr-x1-p"><b>x1 contra ' + esc(E.x1.adv) + ':</b> ' + (E.x1.venceu ? 'você vence' : 'você perde') + ' por ' + E.x1.g[0] + ' a ' + E.x1.g[1] + '</p>' +
        (E.x1.lances.length ? '<ol class="nr-lances">' + E.x1.lances.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' : '') +
        '<p class="nr-nota">Simulado pelo motor do Duelo com os seus atributos desta história.</p></section>' +
        '<ul class="nr-esc"><li><button type="button" class="btn" data-ir="' + (E.x1.venceu ? c.x1.venceu : c.x1.perdeu) + '">Continuar →</button></li></ul>';
    } else if (c.fim) {
      h += '<p class="nr-fim">Final: <b>' + esc(c.fim.nome) + '</b></p><ul class="nr-esc"><li><button type="button" class="btn" data-acao="reiniciar">↻ Começar outra história</button></li><li><a class="btn btn-2" href="#nr-mapa">Ver o mapa de finais</a></li></ul>';
    } else {
      h += '<ul class="nr-esc">' + c.esc.map(function (e, i) { var ok = cond(e.se); return ok ? '<li><button type="button" class="btn btn-2" data-esc="' + i + '">' + esc(e.t) + '</button></li>' : ''; }).join('') + '</ul>';
    }
    h += '</div></article>';
    $('.nr-palco').innerHTML = h;
    var s = stats();
    $('.nr-med').innerHTML = '<h2 class="hub-sec">Você, nº 300</h2><p class="nr-ego">Ego <b>' + E.ego + '</b> · Geral estimado <b>' + s.ovr + '</b></p>' + (E.arma ? '<p>Arma: <b>' + esc(E.arma) + '</b></p>' : '<p>Arma: ainda nenhuma</p>') +
      '<ul class="nr-atr">' + ATR.map(function (a) { var v = s[a[0] === 'lei' ? 'def' : a[0]]; return '<li><span>' + a[1] + '</span><meter min="35" max="99" value="' + v + '">' + v + '</meter><b>' + v + '</b></li>'; }).join('') + '</ul>' +
      (Object.keys(E.q).length ? '<h3>Química</h3><ul class="nr-q">' + Object.keys(E.q).map(function (k) { return '<li>' + esc(NOMEQ[k] || k) + ': ' + '★'.repeat(Math.min(5, E.q[k])) + ' <span class="sr-only">' + E.q[k] + '</span></li>'; }).join('') + '</ul>' : '');
    mapa();
  }
  function mapa() {
    var F = ler(KF, {}), fins = Object.keys(RO.cenas).map(function (k) { return RO.cenas[k]; }).filter(function (c) { return c.fim; });
    $('.nr-mapa-l').innerHTML = fins.map(function (c) { var ok = F[c.fim.k]; return '<li class="' + (ok ? 'ok' : '') + '">' + (ok ? '🏁 <b>' + esc(c.fim.nome) + '</b>' : '🔒 Final ainda não descoberto') + '</li>'; }).join('');
    $('.nr-mapa-n').textContent = Object.keys(F).length + ' de ' + fins.length + ' finais descobertos.';
  }
  app.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var c = RO.cenas[E.cena], g;
    if (b.dataset.esc != null) { var es = c.esc[+b.dataset.esc]; if (!cond(es.se)) return; g = efeito(es.ef); E.hist.push(E.cena); ir(es.d, g); foco(); }
    else if (b.dataset.ir) { E.hist.push(E.cena); ir(b.dataset.ir); foco(); }
    else if (b.dataset.acao === 'reiniciar') { E = novo(); gravar(K, E); render(); foco(); BL.anunciar('Nova história'); }
  });
  function foco() { var t = $('#nr-t'); if (t) t.focus(); if (!BL.reduce && app.scrollIntoView) $('.nr-palco').scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  BL.personagens().then(function (ps) { ps.forEach(function (p) { por[p.id] = p; }); $('.nr-ini').hidden = true; app.hidden = false; render(); }, function () { render(); });
})();
