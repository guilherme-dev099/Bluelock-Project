/* Ideias Blue Lock: painel de leitura (Aa), atalhos (?), navegação/ comparação/ spoiler/ glossário nas fichas. Script clássico. */
(function () {
  'use strict';
  var h = document.documentElement, $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function anunciar(t) { if (window.BL && BL.anunciar) BL.anunciar(t); }
  function ler() { try { return JSON.parse(localStorage.getItem('bl-leitura') || '{}'); } catch (e) { return {}; } }
  function gravar(o) { try { localStorage.setItem('bl-leitura', JSON.stringify(o)); } catch (e) {} }
  function digitando(e) { var t = e.target; return e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))); }

  /* ---- #8 painel de leitura */
  var nav = $('header.top nav ul');
  var OPC = [
    { k: 'texto', rot: 'Tamanho do texto', v: [['', '100%'], ['lg', '115%'], ['xl', '130%']] },
    { k: 'textura', rot: 'Textura de papel', v: [['', 'Ligada'], ['off', 'Desligada']] },
    { k: 'mov', rot: 'Movimento', v: [['', 'Do sistema'], ['reduzir', 'Reduzir']] },
    { k: 'corpo', rot: 'Fonte do texto', v: [['', 'Padrão'], ['larga', 'Mais espaçada']] },
    { k: 'atalhos', rot: 'Atalhos de uma tecla', v: [['', 'Ligados'], ['off', 'Desligados']] }
  ];
  if (nav && !$('.leitura-btn')) {
    var li = document.createElement('li'); li.className = 'leitura-li';
    li.innerHTML = '<button type="button" class="leitura-btn" aria-expanded="false" aria-controls="leitura-p" aria-label="Ajustes de leitura" title="Ajustes de leitura">Aa</button>' +
      '<div class="leitura-p" id="leitura-p" hidden><p class="leitura-t">Ajustes de leitura</p>' + OPC.map(function (o) {
        return '<fieldset><legend>' + o.rot + '</legend>' + o.v.map(function (v) {
          return '<label><input type="radio" name="lt-' + o.k + '" value="' + v[0] + '"> ' + v[1] + '</label>';
        }).join('') + '</fieldset>';
      }).join('') + '<p class="leitura-nota">Fica salvo neste navegador.</p></div>';
    var mapa = $('.mapa-li', nav); nav.insertBefore(li, mapa || null);
    var btn = $('.leitura-btn', li), pn = $('.leitura-p', li), est = ler();
    OPC.forEach(function (o) { var r = $('input[name="lt-' + o.k + '"][value="' + (est[o.k] || '') + '"]', pn); if (r) r.checked = true; });
    pn.addEventListener('change', function (e) {
      var k = e.target.name.slice(3), v = e.target.value, o = ler();
      if (v) { o[k] = v; h.setAttribute('data-' + k, v); } else { delete o[k]; h.removeAttribute('data-' + k); }
      if (k === 'mov' && window.BL) BL.reduce = v === 'reduzir' || matchMedia('(prefers-reduced-motion: reduce)').matches;
      gravar(o); anunciar('Ajuste salvo');
    });
    function abrir(sim) { pn.hidden = !sim; btn.setAttribute('aria-expanded', sim); if (sim) { var c = $('input:checked', pn) || $('input', pn); c && c.focus(); } }
    btn.addEventListener('click', function () { abrir(pn.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pn.hidden) { abrir(false); btn.focus(); } });
    document.addEventListener('click', function (e) { if (!pn.hidden && !li.contains(e.target)) abrir(false); });
  }

  /* ---- #10 atalhos */
  var atalhos = [['Ctrl + K', 'Buscar no site'], ['?', 'Mostrar esta lista']];
  var mapaT = {};
  function atalho(tecla, desc, fn) { mapaT[tecla] = fn; atalhos.push([tecla.toUpperCase().replace('ARROWLEFT', '←').replace('ARROWRIGHT', '→'), desc]); }
  function porAcao(a) { return $('[data-acao="' + a + '"]'); }
  function ligar(tecla, acao, desc) {
    var b = porAcao(acao); if (!b) return;
    b.setAttribute('aria-keyshortcuts', tecla.toUpperCase());
    atalho(tecla, desc, function () { var x = porAcao(acao); if (x && !x.disabled && x.offsetParent) x.click(); });
  }
  ligar('s', 'sortear', 'Sortear dupla'); ligar('j', 'comecar', 'Começar o x1');
  ligar('p', 'pausar', 'Pausar / continuar'); ligar('r', 'revanche', 'Revanche'); ligar('n', 'pular', 'Pular para o resultado');

  /* ---- fichas */
  var ficha = $('section.char'), pnav = $('.char .pn');
  var id = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (ficha && pnav) {
    var prev = pnav.querySelector('a:first-child'), next = pnav.querySelector('a:last-child');
    var ordem = window.BL_ORDEM || [];
    pnav.setAttribute('role', 'navigation'); pnav.setAttribute('aria-label', 'Outras fichas');
    if (!$('.pn-aleat', pnav) && next) {
      var al = document.createElement('a'); al.className = 'pn-aleat'; al.href = '#'; al.textContent = '🎲 Ficha aleatória';
      pnav.insertBefore(al, next);
      al.addEventListener('click', function (e) {
        var lst = ordem.length ? ordem : null;
        if (!lst && window.BL && BL.personagens) { e.preventDefault(); BL.personagens().then(function (ps) { ir(ps.map(function (p) { return p.id; })); }); return; }
        e.preventDefault(); ir(lst);
      });
    }
    function ir(l) { var c = l.filter(function (x) { return x !== id; }); if (c.length) location.href = c[Math.floor(Math.random() * c.length)] + '.html'; }
    if (prev) atalho('ArrowLeft', 'Ficha anterior', function () { prev.click(); });
    if (next) atalho('ArrowRight', 'Próxima ficha', function () { next.click(); });
    atalho('a', 'Ficha aleatória', function () { var x = $('.pn-aleat'); x && x.click(); });

    /* #4 Comparar com… */
    var cmp = $('.char .cmp');
    if (cmp && cmp.querySelector('a[href^="duelo.html?a="]') && window.BL && BL.personagens && !$('.cmp-com')) {
      BL.personagens().then(function (ps) {
        var eu = null, op = ps.filter(function (p) { if (p.id === id) eu = p; return p.jogador && p.id !== id; })
          .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); });
        if (!eu || !op.length) return;
        var f = document.createElement('form'); f.className = 'cmp-com'; f.action = 'duelo.html'; f.method = 'get';
        f.innerHTML = '<input type="hidden" name="a" value="' + esc(id) + '"><label for="cmp-b">Comparar ' + esc(eu.nome.split(' ')[0]) + ' com…</label>' +
          '<select id="cmp-b" name="b">' + op.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + '</option>'; }).join('') + '</select>' +
          '<button type="submit" class="btn">⚔ Duelar</button>';
        var rad = $('.char section.radar'); (rad || cmp).parentNode.insertBefore(f, rad ? rad.nextSibling : cmp);
        if (window.BLX1) {} // pentágono já vem gerado na ficha
      });
    }

    /* #11 imprimir */
    if (cmp && !$('.btn-imprimir')) {
      var bi = document.createElement('button'); bi.type = 'button'; bi.className = 'btn-imprimir'; bi.textContent = '🖨 Imprimir pôster';
      bi.addEventListener('click', function () { window.print(); }); cmp.appendChild(bi);
    }

    /* #14 spoiler: fases depois da 3ª Seleção */
    var fases = document.querySelectorAll('.char ol.phases li'), spo = [];
    var SP = /Blue Lock × Sub-20|Neo Egoist League|Atual|Japão Sub-20|U-20/;
    Array.prototype.forEach.call(fases, function (l) { var b = l.querySelector('b'); if (b && SP.test(b.textContent)) spo.push(l); });
    if (spo.length) {
      var ol = $('.char ol.phases'), sb = document.createElement('button');
      sb.type = 'button'; sb.className = 'spoiler-btn';
      var on = ler().spoiler === 'anime';
      function aplicar() {
        spo.forEach(function (l) { l.hidden = on; });
        sb.setAttribute('aria-pressed', on); sb.textContent = on ? '👁 Mostrar ' + spo.length + ' fase(s) com spoiler' : '🙈 Ocultar fases com spoiler (pós 3ª Seleção)';
      }
      sb.addEventListener('click', function () { on = !on; var o = ler(); if (on) o.spoiler = 'anime'; else delete o.spoiler; gravar(o); aplicar(); anunciar(on ? 'Fases com spoiler ocultas' : 'Todas as fases visíveis'); });
      ol.parentNode.insertBefore(sb, ol.nextSibling); aplicar();
    }

    /* #5 glossário inline: primeira ocorrência de cada termo em .desc e dd */
    var G = window.BL_GLOSS || [];
    if (G.length) {
      var usados = {}, n = 0;
      var alvos = document.querySelectorAll('.char .desc, .char .info dl dd, .char .cj-estilo');
      var termos = G.slice().sort(function (a, b) { return b.t.length - a.t.length; });
      Array.prototype.forEach.call(alvos, function (el) {
        var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], x;
        while ((x = w.nextNode())) nodes.push(x);
        nodes.forEach(function (tn) {
          for (var i = 0; i < termos.length; i++) {
            var g = termos[i]; if (usados[g.id]) continue;
            var re = new RegExp('(^|[^\\wÀ-ú])(' + g.t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\wÀ-ú])');
            var m = re.exec(tn.nodeValue); if (!m) continue;
            usados[g.id] = 1; n++;
            var ini = m.index + m[1].length, depois = tn.splitText(ini); depois.nodeValue = depois.nodeValue.slice(m[2].length);
            var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'termo'; bt.textContent = m[2];
            bt.setAttribute('aria-expanded', 'false'); bt.setAttribute('aria-controls', 'tp-' + g.id); bt.dataset.g = i;
            tn.parentNode.insertBefore(bt, depois); tn = depois; i = -1;
          }
        });
      });
      if (n) {
        var pop = document.createElement('div'); pop.className = 'termo-pop'; pop.hidden = true; pop.setAttribute('role', 'note');
        document.body.appendChild(pop); var aberto = null;
        function fechar(foco) { if (!aberto) return; pop.hidden = true; aberto.setAttribute('aria-expanded', 'false'); if (foco) aberto.focus(); aberto = null; }
        document.addEventListener('click', function (e) {
          var b = e.target.closest && e.target.closest('button.termo');
          if (!b) { if (aberto && !pop.contains(e.target)) fechar(); return; }
          if (aberto === b) return fechar();
          fechar(); var g = termos[+b.dataset.g]; pop.id = 'tp-' + g.id;
          pop.innerHTML = '<p><b>' + esc(g.t) + '</b> ' + esc(g.d) + '</p><a href="glossario.html#g-' + esc(g.id) + '">Ver no glossário →</a>';
          var r = b.getBoundingClientRect(); pop.hidden = false;
          var lw = Math.min(320, innerWidth - 24);
          pop.style.left = Math.max(12, Math.min(r.left + scrollX, scrollX + innerWidth - lw - 12)) + 'px'; pop.style.top = (r.bottom + scrollY + 8) + 'px';
          b.setAttribute('aria-expanded', 'true'); aberto = b;
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(true); });
      }
    }
  }

  /* ---- folha de atalhos */
  var dlg = null;
  function folha() {
    if (!window.HTMLDialogElement) return;
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'atalhos-dlg'; dlg.setAttribute('aria-labelledby', 'at-t');
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = '<h2 id="at-t">Atalhos de teclado</h2><dl>' + atalhos.map(function (a) { return '<dt><kbd>' + esc(a[0]) + '</kbd></dt><dd>' + esc(a[1]) + '</dd>'; }).join('') +
      '</dl><p>Atalhos de uma tecla podem ser desligados no botão Aa.</p><form method="dialog"><button class="btn">Fechar</button></form>';
    dlg.showModal();
  }
  document.addEventListener('keydown', function (e) {
    if (digitando(e) || e.defaultPrevented) return;
    if (e.key === '?') { e.preventDefault(); folha(); return; }
    if (h.getAttribute('data-atalhos') === 'off' || (dlg && dlg.open) || document.querySelector('dialog[open]')) return;
    var fn = mapaT[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (fn) { e.preventDefault(); fn(); }
  });
})();
