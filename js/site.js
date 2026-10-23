/* Comum a todas as páginas: menus do topo ("Jogos" / "Explorar"), busca universal (Ctrl+K) e API do Álbum. Script clássico. */
(function () {
  'use strict';
  var BL = window.BL; if (!BL) return;
  var esc = BL.esc, norm = BL.norm;
  /* ----- menus <details> do topo: um aberto por vez, fecha com Esc e clique fora ----- */
  var menus = [].slice.call(document.querySelectorAll('.nav-dd details'));
  menus.forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) menus.forEach(function (o) { if (o !== d) o.open = false; }); });
  });
  document.addEventListener('click', function (e) { menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus.forEach(function (d) { if (d.open) { d.open = false; d.querySelector('summary').focus(); } });
  });

  /* fecha o menu quando o foco sai dele (Tab) */
  menus.forEach(function (d) {
    d.addEventListener('focusout', function (e) { if (d.open && e.relatedTarget && !d.contains(e.relatedTarget)) d.open = false; });
  });
  /* selo do desafio do dia (hub e menu Jogos): pendente / em andamento / feito */
  (function () {
    var selos = document.querySelectorAll('[data-dd-selo]'); if (!selos.length) return;
    var dia; try { dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { return; }
    var ler = function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
    var feito = ler('bl-dd-feito') === dia, pal = ler('bl-dd-' + dia), and = !feito && pal && pal.length;
    var txt = feito ? '✓ feito hoje' : and ? 'em andamento' : 'pendente';
    Array.prototype.forEach.call(selos, function (s) {
      s.textContent = txt; s.hidden = false;
      s.className = 'dd-selo ' + (feito ? 'dd-selo-ok' : 'dd-selo-pend');
      s.setAttribute('aria-label', '(desafio de hoje: ' + txt.replace('✓ ', '') + ')');
    });
  })();

  /* ----- Álbum do Ego: figurinhas guardadas no navegador (localStorage 'bl-album') ----- */
  var CHAVE = 'bl-album';
  function ler() { try { var o = JSON.parse(localStorage.getItem(CHAVE) || '{}'); o.ids = o.ids || {}; o.esp = o.esp || {}; o.log = o.log || []; return o; } catch (e) { return { ids: {}, esp: {}, log: [] }; } }
  function gravar(o) { try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) {} }
  var ESPECIAIS = { flow: { nome: 'FLOW', emoji: '⚡', dica: 'Desperte o Flow em qualquer página (botão ⚡ ou digite f-l-o-w).' } };
  window.BL_ALBUM = {
    ESPECIAIS: ESPECIAIS,
    ler: ler, gravar: gravar,
    tem: function (id) { var o = ler(); return !!(o.ids[id] || o.esp[id]); },
    /* ganhar(id, origem, silencioso) → true se a figurinha é nova */
    ganhar: function (id, origem, silencioso) {
      var o = ler(), esp = !!ESPECIAIS[id], casa = esp ? o.esp : o.ids, nova = !casa[id];
      casa[id] = (casa[id] || 0) + 1;
      if (nova) { o.log.unshift({ id: id, o: origem || '', t: Date.now() }); o.log = o.log.slice(0, 30); }
      gravar(o);
      try { document.dispatchEvent(new CustomEvent('bl-album', { detail: { id: id, nova: nova, origem: origem } })); } catch (e) {}
      if (nova && !silencioso) BL.anunciar(esp ? 'Figurinha especial desbloqueada: ' + ESPECIAIS[id].nome + '!' : 'Nova figurinha no Álbum do Ego!');
      return nova;
    }
  };
  /* easter egg: entrar no Flow dá a figurinha especial (uma vez) */
  var html = document.documentElement;
  var verFlow = function () {
    if (!html.hasAttribute('data-flow') || BL_ALBUM.tem('flow')) return;
    BL_ALBUM.ganhar('flow', 'flow');
    var t = document.createElement('p'); t.className = 'album-toast'; t.setAttribute('role', 'status');
    t.innerHTML = '⚡ Figurinha especial <b>FLOW</b> desbloqueada! <a href="album.html">Ver no Álbum</a>';
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 7000);
  };
  new MutationObserver(verFlow).observe(html, { attributes: true, attributeFilter: ['data-flow'] });
  setTimeout(verFlow, 0);

  /* ----- Busca universal (Ctrl+K ou 🔍) ----- */
  var btn = document.querySelector('.busca-btn'); if (!btn) return;
  btn.hidden = false;
  var dlg, inp, ul, msg, todos = null, res = [], ativo = -1, opener = null;
  var PAGS = [['index.html', '🏠', 'Personagens', 'todas as fichas'], ['duelo.html', '⚔', 'Duelo x1', 'jogo']];
  [].forEach.call(document.querySelectorAll('nav .nav-dd-m a'), function (a) {
    var h = a.getAttribute('href'); if (PAGS.some(function (p) { return p[0] === h; })) return;
    PAGS.push([h, (a.querySelector('span') || {}).textContent || '→', (function () { var c = a.cloneNode(true), x = c.querySelector('.dd-selo'); if (x) x.remove(); return c.textContent.replace(/^\s*\S+\s/, '').trim(); })(), a.closest('details').querySelector('summary').textContent.trim().toLowerCase()]);
  });
  function times(p) { var s = []; (p.fases || []).forEach(function (f) { (f.times || []).forEach(function (t) { if (s.indexOf(t) < 0) s.push(t); }); }); return s; }
  /* melhor personagem para um trecho de nome */
  function achar(q) {
    q = norm(q); if (!q || !todos) return null; var best = null, bs = 0;
    todos.forEach(function (p) {
      var n = norm(p.nome), s = n === q ? 9 : (n.split(' ').some(function (w) { return w === q; }) ? 7 : (n.indexOf(q) === 0 ? 5 : (n.split(' ').some(function (w) { return w.indexOf(q) === 0; }) ? 4 : (n.indexOf(q) >= 0 ? 2 : 0))));
      if (s && p.jogador) s += 0.5;
      if (s > bs) { bs = s; best = p; }
    });
    return best;
  }
  function calcular(qr) {
    var q = norm(qr), out = [], m;
    if (!q) {
      out.push({ e: '🎲', r: 'Desafio diário: quem é o egoísta?', s: 'jogo', h: 'egoista.html' });
      PAGS.forEach(function (p) { out.push({ e: p[1], r: p[2], s: p[3], h: p[0] }); });
      out.push({ e: '⚡', r: 'Alternar modo Flow', s: 'ação', fn: function () { var f = document.querySelector('.flow-btn'); if (f) f.click(); } });
      return out;
    }
    if ((m = qr.match(/^\s*(.+?)\s+(?:x|vs|×|contra)\s+(.+?)\s*$/i))) {
      var a = achar(m[1]), b = achar(m[2]);
      if (a && b && a !== b) out.push({ e: '⚔', r: 'Duelo x1: ' + a.nome + ' × ' + b.nome, s: 'ação', h: 'duelo.html?a=' + a.id + '&b=' + b.id + '&auto=1' });
    }
    if ((m = qr.match(/^\s*(?:caminho\s+(?:de\s+)?)?(.+?)\s*(?:→|->|>|\baté\b|\bate\b|\bpara\b)\s*(.+?)\s*$/i))) {
      var c = achar(m[1]), d = achar(m[2]);
      if (c && d) out.push({ e: '🔗', r: 'Caminho: ' + c.nome + ' → ' + d.nome, s: 'Seis graus', h: 'graus.html?de=' + c.id + '&ate=' + d.id });
    }
    if (/^copa\b/.test(q)) {
      var tam = (q.match(/\b(8|16|32)\b/) || [])[1];
      out.push({ e: '🏆', r: 'Copa do Ego' + (tam ? ' com ' + tam : ''), s: 'jogo', h: 'copa.html' + (tam ? '?t=' + tam : '') });
    }
    if (/^(desafio|diario|egoista)/.test(q)) out.push({ e: '🕵', r: 'Desafio diário: quem é o egoísta?', s: 'jogo', h: 'egoista.html' });
    if (/^flow/.test(q)) out.push({ e: '⚡', r: 'Alternar modo Flow', s: 'ação', fn: function () { var f = document.querySelector('.flow-btn'); if (f) f.click(); } });
    PAGS.forEach(function (p) { if (norm(p[2]).indexOf(q) >= 0 || norm(p[0]).indexOf(q) === 0) out.push({ e: p[1], r: p[2], s: p[3], h: p[0] }); });
    /* Armas (Arsenal): "metavision" → armas.html#arma-metavision */
    if (todos && q.length >= 3 && document.querySelector('nav a[href="armas.html"]')) {
      var vistas = {};
      todos.forEach(function (p) { (p.armas || []).forEach(function (x) { var k = BL.chaveArma(x); if (k.indexOf(q) >= 0 && !vistas[k]) vistas[k] = x; }); });
      Object.keys(vistas).slice(0, 3).forEach(function (k) { out.push({ e: '⚔', r: 'Arsenal: ' + vistas[k].charAt(0).toUpperCase() + vistas[k].slice(1), s: 'quem tem esta Arma', h: 'armas.html#arma-' + k.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }); });
    }
    if (todos) {
      var ach = [];
      todos.forEach(function (p) {
        var n = norm(p.nome), sc = 0, por = '';
        if (n.indexOf(q) === 0 || n.split(' ').some(function (w) { return w.indexOf(q) === 0; })) sc = 10; else if (n.indexOf(q) >= 0) sc = 8;
        if (!sc && q.length >= 3) {
          var t = times(p).filter(function (x) { return norm(x).indexOf(q) >= 0; })[0];
          var ar = (p.armas || []).filter(function (x) { return norm(x).indexOf(q) >= 0; })[0];
          if (t) { sc = 4; por = 'time: ' + t; } else if (ar) { sc = 3; por = 'Arma: ' + ar; } else if (norm(p.posicao).indexOf(q) >= 0) { sc = 2; por = p.posicao; }
        }
        if (sc) ach.push({ p: p, sc: sc + (p.jogador ? 0.5 : 0) - p.ordem / 1000, por: por });
      });
      ach.sort(function (x, y) { return y.sc - x.sc; });
      ach.slice(0, 12).forEach(function (x) { out.push({ img: BL.thumb(x.p), r: x.p.nome, s: x.por || x.p.posicao || '', h: x.p.url }); });
    }
    return out.slice(0, 14);
  }
  function desenhar() {
    ul.innerHTML = res.map(function (o, i) {
      return '<li role="option" id="busca-op-' + i + '" data-i="' + i + '" aria-selected="' + (i === ativo) + '">' + (o.img ? '<img src="' + esc(o.img) + '" alt="" width="36" height="36">' : '<span class="busca-e" aria-hidden="true">' + esc(o.e) + '</span>') + '<span><b>' + esc(o.r) + '</b><small>' + esc(o.s || '') + '</small></span></li>';
    }).join('');
    inp.setAttribute('aria-activedescendant', ativo >= 0 ? 'busca-op-' + ativo : '');
    msg.textContent = res.length ? res.length + (res.length === 1 ? ' resultado' : ' resultados') + '. Setas para navegar, Enter para abrir.' : 'Nada encontrado. Tente um nome, time, posição ou Arma; ou "isagi x rin", "kaiser → nagi", "copa 16".';
    var el = ativo >= 0 && document.getElementById('busca-op-' + ativo); if (el) el.scrollIntoView({ block: 'nearest' });
  }
  function atualizar() { res = calcular(inp.value); ativo = res.length ? 0 : -1; desenhar(); }
  function executar(o) {
    if (!o) return;
    if (o.fn) { dlg.close(); o.fn(); return; }
    location.href = o.h;
  }
  function montar() {
    dlg = document.createElement('dialog'); dlg.className = 'busca-dlg'; dlg.setAttribute('aria-labelledby', 'busca-t');
    dlg.innerHTML = '<h2 id="busca-t" class="sr-only">Buscar no site</h2><div class="busca-campo"><span aria-hidden="true">🔍</span><input id="busca-inp" type="search" role="combobox" aria-expanded="true" aria-controls="busca-lista" aria-autocomplete="list" autocomplete="off" aria-describedby="busca-msg" placeholder="Personagem, time, Arma… ou “isagi x rin”, “kaiser → nagi”"><button type="button" class="x1-mini busca-x" aria-label="Fechar busca">Esc</button></div><ul id="busca-lista" role="listbox" aria-label="Resultados"></ul><p id="busca-msg" class="busca-msg" aria-live="polite"></p>';
    document.body.appendChild(dlg);
    inp = dlg.querySelector('input'); ul = dlg.querySelector('ul'); msg = dlg.querySelector('.busca-msg');
    inp.addEventListener('input', atualizar);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!res.length) return; ativo = (ativo + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; desenhar(); }
      else if (e.key === 'Enter') { e.preventDefault(); executar(res[ativo]); }
      else if (e.key === 'Escape') { e.preventDefault(); dlg.close(); }
    });
    ul.addEventListener('mousedown', function (e) { var li = e.target.closest('li'); if (li) { e.preventDefault(); executar(res[+li.dataset.i]); } });
    dlg.querySelector('.busca-x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (opener && opener.focus) opener.focus(); });
  }
  function abrir() {
    if (!dlg) montar();
    if (dlg.open) return;
    opener = document.activeElement; inp.value = ''; dlg.showModal(); inp.focus(); atualizar();
    if (!todos) BL.personagens().then(function (l) { todos = l; if (dlg.open) atualizar(); }).catch(function () {});
  }
  btn.addEventListener('click', abrir);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); abrir(); }
  });
  BL.abrirBusca = abrir;

})();

/* =====================================================================
   TINTA & EGO · LOTE 1 · Menu "Mapa do Blue Lock" (tela cheia, <dialog> nativo).
   Monta-se a partir dos links que já existem no header (menus Jogos/Explorar). Sem JS, os <details> continuam.
   ===================================================================== */
(function () {
  'use strict';
  var nav = document.querySelector('header.top nav ul'); if (!nav || !window.HTMLDialogElement || document.querySelector('.mapa')) return;
  var aqui = location.pathname.split('/').pop() || 'index.html';
  var limpo = function (a) { var c = a.cloneNode(true); [].forEach.call(c.querySelectorAll('.dd-selo,[aria-hidden]'), function (x) { x.remove(); }); return c.textContent.trim(); };
  var grupos = [{ t: 'Principal', itens: [['index.html', 'Personagens', '212 fichas'], ['duelo.html', 'Duelo x1', 'jogo'], ['jogos.html', 'Tudo no site', 'hub']] }];
  var vistos = { 'index.html': 1, 'duelo.html': 1, 'jogos.html': 1 };
  [].forEach.call(document.querySelectorAll('nav .nav-dd'), function (dd) {
    var g = { t: dd.querySelector('summary').textContent.trim(), itens: [] };
    [].forEach.call(dd.querySelectorAll('.nav-dd-m a'), function (a) {
      var h = a.getAttribute('href'), k = h.split('/').pop(); if (vistos[k]) return; vistos[k] = 1;
      g.itens.push([h, limpo(a), '', !!a.querySelector('[data-dd-selo]')]);
    });
    if (g.itens.length) grupos.push(g);
  });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var n = 0, pos = 0, gAtual = '';
  var d = document.createElement('dialog'); d.className = 'mapa'; d.setAttribute('aria-labelledby', 'mapa-t');
  d.innerHTML = '<div class="mapa-in"><nav class="mapa-nav" aria-labelledby="mapa-t"><h2 id="mapa-t" class="sr-only">Mapa do Blue Lock: todas as seções</h2>' +
    '<button type="button" class="mapa-btn mapa-x mapa-x-m">Fechar</button>' +
    grupos.map(function (g) {
      return '<section class="mapa-g"><h3 class="mapa-gt">' + esc(g.t) + '</h3><ol class="mapa-lista" style="counter-reset:v ' + n + '">' +
        g.itens.map(function (i) {
          n++; var cur = i[0].split('/').pop() === aqui; if (cur && !pos) { pos = n; gAtual = g.t; }
          return '<li><a href="' + esc(i[0]) + '"' + (cur ? ' aria-current="page"' : '') + '><span class="v-n">' + esc(i[1]) + (i[3] ? '<span class="dd-selo" data-dd-selo hidden></span>' : '') + '</span>' + (i[2] ? '<span class="v-s">' + esc(i[2]) + '</span>' : '') + '</a></li>';
        }).join('') + '</ol></section>';
    }).join('') + '</nav><aside class="mapa-lado" aria-label="Dicas"><button type="button" class="mapa-btn mapa-x">Fechar</button><h3 aria-hidden="true">Mapa</h3>' +
    '<p><kbd>Ctrl</kbd> + <kbd>K</kbd> busca qualquer personagem, time ou Arma. Digite <kbd>f l o w</kbd> em qualquer página para despertar.</p></aside></div>';
  document.body.appendChild(d);
  document.documentElement.classList.add('has-mapa');
  /* copia o selo do desafio já calculado no header */
  var seloH = document.querySelector('.top [data-dd-selo]');
  [].forEach.call(d.querySelectorAll('[data-dd-selo]'), function (s) { if (seloH && !seloH.hidden) { s.textContent = seloH.textContent; s.className = seloH.className; s.setAttribute('aria-label', seloH.getAttribute('aria-label') || ''); s.hidden = false; } });
  var li = document.createElement('li');
  li.innerHTML = '<button type="button" class="mapa-btn" aria-haspopup="dialog" aria-label="Menu: mapa do site">Menu</button>';
  nav.appendChild(li);
  var opener = li.firstChild;
  opener.addEventListener('click', function () {
    [].forEach.call(document.querySelectorAll('.nav-dd details[open]'), function (x) { x.open = false; });
    d.showModal(); var c = d.querySelector('[aria-current]') || d.querySelector('.mapa-lista a'); if (c) c.focus();
  });
  [].forEach.call(d.querySelectorAll('.mapa-x'), function (b) { b.addEventListener('click', function () { d.close(); }); });
  d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  d.addEventListener('close', function () { opener.focus(); });
  window.BL_MAPA = { grupos: grupos, total: n, pos: pos, grupo: gAtual };
})();
