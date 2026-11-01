/* Modo Mangá: paginação, teclado (←/→), swipe, sentido japonês, progresso em localStorage 'bl-manga'. Script clássico. */
(function () {
  'use strict';
  var h = document.documentElement, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var K = 'bl-manga';
  function ler() { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } }
  function gravar(o) { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} }
  function anunciar(t) { if (window.BL && BL.anunciar) BL.anunciar(t); }
  function reduz() { return h.getAttribute('data-mov') === 'reduzir' || matchMedia('(prefers-reduced-motion: reduce)').matches; }
  var est = ler(); est.lidos = est.lidos || {};

  /* ---- índice */
  var lista = $('.mg-lista');
  if (lista) {
    var itens = $$('.mg-item', lista), n = 0;
    itens.forEach(function (li) { if (est.lidos[li.dataset.cap]) { n++; $('.mg-lido', li).hidden = false; li.classList.add('lido'); } });
    var pr = $('.mg-prog'); if (pr) pr.textContent = n ? n + ' de ' + itens.length + ' capítulos lidos.' : '';
    var c = $('.mg-continuar');
    if (c && est.ult && est.ult.cap) { c.href = est.ult.cap + '.html' + (est.ult.pag ? '#p' + (est.ult.pag + 1) : ''); c.textContent = 'Continuar lendo'; }
    return;
  }

  var cap = $('.mg-cap'); if (!cap) return;
  var slug = cap.dataset.cap, livro = $('.mg-livro', cap), pags = $$('.mg-pag', livro), ctrl = $('.mg-ctrl', cap);
  var pos = $('.mg-pos', cap), bAnt = $('.mg-ant', cap), bSeg = $('.mg-seg', cap), bRtl = $('.mg-rtl', cap), bModo = $('.mg-modo', cap);
  var largo = matchMedia('(min-width: 1100px)');
  var atual = 0, rolar = est.modo === 'rolar', rtl = est.rtl === 1;

  /* spoiler */
  var gate = $('.mg-gate', cap);
  if (gate && h.getAttribute('data-spoiler') === 'anime' && !sessionStorage.getItem('bl-manga-spo')) {
    gate.hidden = false; livro.hidden = true;
    $('.mg-gate-btn', gate).addEventListener('click', function () {
      try { sessionStorage.setItem('bl-manga-spo', '1'); } catch (e) {}
      gate.hidden = true; livro.hidden = false; montar(); pags[0].focus();
    });
  } else montar();

  function passo() { return largo.matches && !rolar ? 2 : 1; }
  function mostrar(i, foco) {
    var p = passo(); i = Math.max(0, Math.min(i, pags.length - 1)); i -= i % p; atual = i;
    pags.forEach(function (pg, k) { var on = rolar || (k >= i && k < i + p); pg.hidden = !on; pg.classList.toggle('mg-dir', !rolar && p === 2 && k === i + 1); });
    if (!rolar) {
      var fimV = Math.min(i + p, pags.length);
      pos.textContent = 'Página ' + (i + 1) + (fimV - i > 1 ? '–' + fimV : '') + ' de ' + pags.length;
      bAnt.disabled = i === 0; bSeg.disabled = i + p >= pags.length && !$('.mg-prox', cap);
      if (!reduz()) { livro.classList.remove('mg-vira'); void livro.offsetWidth; livro.classList.add('mg-vira'); }
      if (foco) { pags[i].focus({ preventScroll: true }); livro.scrollIntoView({ block: 'start', behavior: reduz() ? 'auto' : 'smooth' }); }
      try { history.replaceState(null, '', '#p' + (i + 1)); } catch (e) {}
    } else pos.textContent = 'Lendo tudo em sequência';
    var o = ler(); o.lidos = o.lidos || {}; o.ult = { cap: slug, pag: i };
    if (rolar || i + p >= pags.length) if(!o.lidos[slug])window.blEv&&blEv('manga',{cap:slug});o.lidos[slug] = 1;
    gravar(o);
  }
  function ir(d) {
    var p = passo();
    if (rolar) return;
    if (d > 0 && atual + p >= pags.length) { var px = $('.mg-prox', cap); if (px) location.href = px.getAttribute('href'); return; }
    if (d < 0 && atual === 0) return;
    mostrar(atual + d * p, true); anunciar(pos.textContent);
  }
  function aplicarModo() {
    cap.classList.toggle('mg-rolar', rolar); cap.classList.toggle('mg-rtl-on', rtl);
    bModo.setAttribute('aria-pressed', rolar); bModo.textContent = rolar ? 'Ler por páginas' : 'Ler rolando';
    bRtl.setAttribute('aria-pressed', rtl); bAnt.hidden = bSeg.hidden = rolar;
  }
  function montar() {
    if (cap.dataset.pronto) return; cap.dataset.pronto = 1;
    h.classList.add('mg-js'); ctrl.hidden = false;
    pags.forEach(function (p) { p.tabIndex = -1; });
    var m = /^#p(\d+)$/.exec(location.hash), ini = m ? +m[1] - 1 : 0;
    aplicarModo(); mostrar(ini, false);
    bAnt.addEventListener('click', function () { ir(rtl ? 1 : -1); });
    bSeg.addEventListener('click', function () { ir(rtl ? -1 : 1); });
    bRtl.addEventListener('click', function () {
      rtl = !rtl; var o = ler(); if (rtl) o.rtl = 1; else delete o.rtl; gravar(o); aplicarModo();
      bAnt.setAttribute('aria-label', rtl ? 'Próxima página' : 'Página anterior'); bSeg.setAttribute('aria-label', rtl ? 'Página anterior' : 'Próxima página');
      anunciar(rtl ? 'Sentido japonês ligado: ← avança' : 'Sentido ocidental: → avança');
    });
    bModo.addEventListener('click', function () { rolar = !rolar; var o = ler(); if (rolar) o.modo = 'rolar'; else delete o.modo; gravar(o); aplicarModo(); mostrar(atual, false); });
    largo.addEventListener && largo.addEventListener('change', function () { mostrar(atual, false); });
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
      if (livro.hidden || rolar) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(rtl ? -1 : 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(rtl ? 1 : -1); }
    });
    var x0 = null, y0 = 0;
    livro.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
    livro.addEventListener('pointerup', function (e) {
      if (x0 === null) return; var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { var d = dx < 0 ? 1 : -1; ir(rtl ? -d : d); }
    });
    livro.addEventListener('pointercancel', function () { x0 = null; });
  }
})();
