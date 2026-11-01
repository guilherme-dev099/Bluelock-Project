/* Temporada Egoísta + Conquistas: metajogo local (script clássico, file://). Eventos dos jogos → pontos de Ego,
   ranking pessoal 300 → 1 contra uma curva fixa (sem multiplayer), missões semanais e medalhas. Dados: js/temporada-dados.js */
(function () {
  'use strict';
  var D = window.BL_TEMP; if (!D) return;
  var DIA = 864e5;
  function hoje() { return new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10); }
  function ler(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hs(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /* calendário: temporadas de 28 dias a partir de D.inicio (segunda-feira) */
  function quando(dia) {
    var d = Math.floor((Date.parse(dia) - Date.parse(D.inicio)) / DIA); if (d < 0) d = 0;
    var n = Math.floor(d / 28) + 1, r = d % 28, ini = new Date(Date.parse(D.inicio) + (n - 1) * 28 * DIA);
    return { n: n, semana: Math.floor(r / 7) + 1, diaT: r + 1, ini: ini.toISOString().slice(0, 10), fim: new Date(ini.getTime() + 27 * DIA).toISOString().slice(0, 10) };
  }
  function missoes(n, sem) {
    var pool = D.missoes.slice(), out = [], h = hs('t' + n + 's' + sem);
    while (out.length < 4 && pool.length) { var i = h % pool.length; out.push(pool.splice(i, 1)[0]); h = hs(String(h)); }
    return out;
  }
  function rank(pts) { return Math.max(1, Math.round(300 - 299 * Math.pow(Math.min(1, pts / D.alvo), 0.7))); }
  function ptsPara(r) { return Math.ceil(D.alvo * Math.pow((300 - r + 0.5) / 299, 1 / 0.7)); }
  /* predicados nomeados usados por missões e conquistas */
  var P = {
    ok: function (d) { return !!d.ok; }, venceu: function (d) { return !!d.v; },
    g2: function (d) { return d.g <= 2; }, g3: function (d) { return d.g <= 3; },
    perfeito: function (d) { return d.n && d.ok === d.n; },
    p5: function (d) { return d.passos >= 5; }, p10: function (d) { return d.passos >= 10; },
    seq7: function (d) { return d.seq >= 7; },
    timez: function (d, por) { return tem(por[d.c], 'Time Z'); },
    nel: function (d, por) { var p = por[d.c]; return !!p && (p.fases || []).some(function (f) { return f.fase === 'Neo Egoist League'; }); },
    final: function (d) { return !!d.final; }, final1: function (d) { return d.final === 'um'; }, todos: function (d) { return d.n >= (D.finais || 6); }, s1: function (d) { return d.erros === 0; }
  };
  function tem(p, time) { return !!p && (p.fases || []).some(function (f) { return (f.times || [f.time]).indexOf(time) >= 0; }); }
  var por = {}, todos = [];
  function chave(ev, c) { return ev + (c ? ':' + c : ''); }
  var Q = []; var pronto = false;
  function toast(html) {
    var box = document.querySelector('.tp-toasts');
    if (!box) { box = document.createElement('div'); box.className = 'tp-toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('p'); t.className = 'tp-toast'; t.innerHTML = html; box.appendChild(t); while (box.children.length > 2) box.firstChild.remove();
    setTimeout(function () { t.remove(); }, 6500);
  }
  function estado(q) { var s = ler('bl-temporada-' + q.n, null); if (!s) s = { n: q.n, pts: 0, log: [], dia: {}, sem: {}, feitas: {} }; return s; }
  function vida() { return ler('bl-ego', { tot: {}, fichas: {}, desde: hoje() }); }
  function processar(ev, d) {
    d = d || {}; var dia = hoje(), q = quando(dia), s = estado(q), V = vida(), regra = D.pontos[ev], ganho = 0, msgs = [];
    var antes = rank(s.pts);
    if (ev === 'ficha') { if (V.fichas[d.id]) { gravar('bl-ego', V); return; } V.fichas[d.id] = 1; }
    /* contadores (temporada por semana e vida inteira) */
    var ks = [ev]; Object.keys(P).forEach(function (c) { try { if (P[c](d, por)) ks.push(chave(ev, c)); } catch (e) {} });
    var sk = 's' + q.semana; s.sem[sk] = s.sem[sk] || {};
    ks.forEach(function (k) { V.tot[k] = (V.tot[k] || 0) + 1; s.sem[sk][k] = (s.sem[sk][k] || 0) + 1; });
    if (regra) {
      var dk = dia + ':' + ev; s.dia[dk] = (s.dia[dk] || 0) + 1;
      if (s.dia[dk] <= regra.lim) ganho = regra.base + (regra.bonus && P[regra.bonus.c] && P[regra.bonus.c](d, por) ? regra.bonus.p : 0) + (regra.porPasso ? (d.passos || 0) * regra.porPasso : 0);
    }
    if (ganho) { s.pts += ganho; s.log.unshift({ d: dia, t: regra.txt, p: ganho }); }
    missoes(q.n, q.semana).forEach(function (m) {
      var id = 's' + q.semana + ':' + m.id; if (s.feitas[id]) return;
      if ((s.sem[sk][chave(m.ev, m.c)] || 0) >= m.n) { s.feitas[id] = dia; s.pts += m.pts; s.log.unshift({ d: dia, t: 'Missão: ' + m.nome, p: m.pts }); msgs.push('🎯 Missão cumprida: <b>' + esc(m.nome) + '</b> · +' + m.pts + ' Ego'); }
    });
    s.log = s.log.slice(0, 60);
    gravar('bl-temporada-' + q.n, s); gravar('bl-ego', V);
    var depois = rank(s.pts);
    if (ganho && !msgs.length) msgs.push('+' + ganho + ' Ego · ' + esc(regra.txt) + (depois < antes ? ' · você subiu para <b>#' + depois + '</b>' : ''));
    else if (msgs.length && depois < antes) msgs[0] += ' · agora <b>#' + depois + '</b>';
    msgs.forEach(function (m) { toast(m + ' <a href="temporada.html">Temporada</a>'); });
    if (msgs.length && window.BL && BL.anunciar) BL.anunciar(msgs.map(function (m) { return m.replace(/<[^>]+>/g, ''); }).join('. '));
    conquistas(s, V);
    document.dispatchEvent(new CustomEvent('bl-temporada'));
  }
  /* ---- conquistas ---- */
  function extra(id, s, V) {
    if (id === 'album-50') return Object.keys((ler('bl-album', {}).ids) || {}).length >= 50;
    if (id === 'album-timez') { var a = (ler('bl-album', {}).ids) || {}, z = todos.filter(function (p) { return tem(p, 'Time Z'); }); return z.length > 0 && z.every(function (p) { return a[p.id]; }); }
    if (id === 'fichas-50') return Object.keys(V.fichas).length >= 50;
    if (id === 'fichas-212') return todos.length && Object.keys(V.fichas).length >= todos.length;
    if (id === 'manga-todo') { var m = ler('bl-manga', {}).lidos || {}; return Object.keys(m).length >= D.capitulos; }
    if (id === 'top-100') return rank(s.pts) <= 100;
    if (id === 'top-1') return rank(s.pts) <= 1;
    return false;
  }
  function conquistas(s, V) {
    var C = ler('bl-conquistas', {}), novas = [];
    D.conquistas.forEach(function (c) {
      if (C[c.id]) return;
      var ok = c.ev ? (V.tot[chave(c.ev, c.c)] || 0) >= (c.n || 1) : extra(c.id, s, V);
      if (ok) { C[c.id] = hoje(); novas.push(c); }
    });
    if (!novas.length) return;
    gravar('bl-conquistas', C);
    novas.forEach(function (c) { toast('🏅 Conquista: <b>' + esc(c.nome) + '</b> <a href="meu-ego.html#conquistas">Ver</a>'); });
    if (window.BL && BL.anunciar) BL.anunciar('Conquista desbloqueada: ' + novas.map(function (c) { return c.nome; }).join(', '));
  }
  /* API pública: chamada pelos jogos. Antes dos dados carregarem, enfileira. */
  window.blEv = function (ev, d) { if (pronto) processar(ev, d); else Q.push([ev, d]); };
  window.BL_TEMPORADA = { quando: quando, missoes: missoes, rank: rank, ptsPara: ptsPara, estado: estado, vida: vida, hoje: hoje, esc: esc };
  function iniciar(ps) {
    todos = ps || []; todos.forEach(function (p) { por[p.id] = p; });
    pronto = true;
    var f = document.querySelector('section.char'), id = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    if (f && por[id]) processar('ficha', { id: id });
    Q.splice(0).forEach(function (x) { processar(x[0], x[1]); });
    document.addEventListener('bl-album', function () { processar('album', {}); });
    var q = quando(hoje()), s = estado(q), V = vida(); conquistas(s, V);
    painelSala(); painelMeuEgo(); document.dispatchEvent(new CustomEvent('bl-temporada'));
  }
  function painelSala() {
    var el = document.querySelector('[data-monitor="progresso"] .m-temp'); if (!el) return;
    var q = quando(hoje()), s = estado(q), r = rank(s.pts), ms = missoes(q.n, q.semana), fe = ms.filter(function (m) { return s.feitas['s' + q.semana + ':' + m.id]; }).length;
    el.innerHTML = '<p class="m-rank"><span class="sr-only">Seu ranking: </span>#' + r + '</p><p class="m-det">Temporada ' + q.n + ' · semana ' + q.semana + ' de 4 · ' + s.pts + ' Ego · missões ' + fe + '/' + ms.length + '</p>';
  }
  function painelMeuEgo() {
    var el = document.getElementById('me-conq'); if (!el) return;
    var C = ler('bl-conquistas', {}), n = D.conquistas.filter(function (c) { return C[c.id]; }).length;
    el.innerHTML = '<p class="me-s">' + n + ' de ' + D.conquistas.length + ' desbloqueadas.</p><ul class="cq-grade">' + D.conquistas.map(function (c) {
      var ok = C[c.id];
      return '<li class="cq' + (ok ? ' ok' : '') + '"><span class="cq-m" aria-hidden="true">' + (ok ? c.e : '🔒') + '</span><b>' + esc(c.nome) + '</b><span>' + esc(c.desc) + '</span><small>' + (ok ? 'Desbloqueada em ' + ok.split('-').reverse().join('/') : 'Bloqueada') + '</small></li>';
    }).join('') + '</ul>';
    var t = document.getElementById('me-temp'); if (t) { var q = quando(hoje()), s = estado(q); t.innerHTML = '<p class="me-v">#' + rank(s.pts) + '</p><p class="me-s">Temporada ' + q.n + ' · ' + s.pts + ' Ego · <a href="temporada.html">Abrir a Temporada</a></p>'; }
  }
  if (window.BL && BL.personagens) BL.personagens().then(iniciar, function () { iniciar([]); }); else iniciar([]);
})();
