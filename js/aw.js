/* AWWWARDS 10: recursos inspirados em 10 referências. Script clássico, melhoria progressiva. Fonte: /workspace/awww/aw.js */
(function () {
  'use strict';
  var d = document, H = d.documentElement, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  function rm() { return H.getAttribute('data-mov') === 'reduzir' || matchMedia('(prefers-reduced-motion: reduce)').matches; }
  var toque = matchMedia('(hover: none), (pointer: coarse)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function anunciar(t) { if (window.BL && BL.anunciar) BL.anunciar(t); }

  /* ---------- 5 · Sprocket: medidor circular */
  function gauge(pct, txt, rot) {
    var r = 42, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
    return '<figure class="aw-gauge" style="--c:' + c.toFixed(1) + ';--o:' + (c * (1 - p)).toFixed(1) + '"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="g0" cx="50" cy="50" r="' + r + '"/><circle class="g1" cx="50" cy="50" r="' + r + '" pathLength="' + c.toFixed(1) + '"/></svg><figcaption><b>' + esc(txt) + '</b><span>' + esc(rot) + '</span></figcaption></figure>';
  }
  /* Sala: ranking da Temporada */
  function salaGauge() {
    var m = $('.sala [data-monitor="progresso"]'); if (!m) return;
    var f = function () { var r = $('.m-rank', m); if (!r || $('.aw-gauge', m)) return; var n = parseInt(r.textContent.replace(/\D/g, ''), 10); if (!n) return;
      var pc = (300 - n) / 299; r.insertAdjacentHTML('afterend', gauge(pc, Math.round(pc * 100) + '%', 'do caminho do #300 ao #1')); };
    f(); new MutationObserver(f).observe(m, { childList: true, subtree: true });
  }
  /* Duelo: domínio do vencedor */
  function dueloGauge() {
    var x1 = $('.x1'); if (!x1) return;
    new MutationObserver(function () {
      $$('.x1-campeao').forEach(function (c) {
        if ($('.aw-gauge', c)) return; var b = $('.x1-placar-final b', c); if (!b) return;
        var g = b.textContent.split('×').map(function (v) { return parseInt(v, 10) || 0; }), t = g[0] + g[1], w = Math.max(g[0], g[1]);
        var pc = t ? w / t : 0.5; b.parentNode.insertAdjacentHTML('afterend', gauge(pc, Math.round(pc * 100) + '%', 'dos gols foram do vencedor'));
      });
    }).observe(x1, { childList: true, subtree: true });
  }

  /* ---------- 3 · United in Football: números que contam + profundidade */
  function contar(el) {
    if (el.dataset.awc) return; el.dataset.awc = 1;
    var txt = el.textContent, m = /(\d[\d.]*)/.exec(txt); if (!m || rm()) return;
    var alvo = parseInt(m[1].replace(/\./g, ''), 10); if (!(alvo > 1)) return;
    var t0 = 0, dur = 1100, pre = txt.slice(0, m.index), pos = txt.slice(m.index + m[1].length);
    el.setAttribute('aria-label', txt.trim());
    function q(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + Math.round(alvo * e) + pos; if (k < 1) requestAnimationFrame(q); else el.removeAttribute('aria-label'); }
    requestAnimationFrame(q);
  }
  function contadores() {
    var sel = '.temporada .tp-num, .temporada .tp-info b, .temporada .tp-card-n, .hub .capitulo b, .aw-num';
    if (!d.querySelector('.hub')) return;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); contar(e.target); } }); }, { threshold: 0.4 }) : null;
    function olhar() { $$(sel).forEach(function (el) { if (el.dataset.awo) return; el.dataset.awo = 1; io ? io.observe(el) : contar(el); }); }
    olhar(); var app = $('#tp-app'); if (app) new MutationObserver(olhar).observe(app, { childList: true });
    H.classList.add('aw-gigante');
    if (rm()) return;
    var hs = $$('.hub .duelo-h'), tick = false;
    addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false; var y = scrollY; hs.forEach(function (h) { h.style.setProperty('--aw-y', Math.min(y, 600) * 0.25 + 'px'); }); }); }, { passive: true });
  }

  /* ---------- 2 · Immortals: card que vira com pentágono + zoom ao abrir */
  var mapa = null;
  function dados() { if (mapa || !window.BL || !BL.personagens) return; BL.personagens().then(function (L) { mapa = {}; L.forEach(function (p) { mapa[p.url] = p; }); }).catch(function () {}); }
  function verso(p) {
    var M = window.BLX1; if (!p || !M || !M.atributos || !M.radarSVG) return '<p class="aw-v-sem">Abra a ficha para ver os atributos.</p>';
    var c = M.cinco(M.atributos(p));
    return M.radarSVG([{ v: c }], 'Atributos de ' + esc(p.nome)) + '<p class="aw-v-arma">' + esc((p.armas || [])[0] || '') + '</p>';
  }
  function cardFlip(href, img, nome, navegar, origem) {
    var p = mapa && mapa[href], ov = d.createElement('div');
    ov.className = 'aw-zoom'; ov.innerHTML = '<div class="aw-flip"><div class="aw-face aw-frente"><img src="' + esc(img) + '" alt=""><b>' + esc(nome) + '</b></div><div class="aw-face aw-verso"><h2>' + esc(nome) + '</h2>' + verso(p) + '</div></div>' +
      (navegar ? '' : '<div class="aw-zoom-bt"><a class="btn" href="' + esc(href) + '">Abrir ficha →</a> <button type="button" class="btn btn-2 aw-fechar">Fechar</button></div>');
    if (!navegar) { ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Card de ' + nome); }
    d.body.appendChild(ov);
    var f = $('.aw-flip', ov);
    if (origem && !rm()) { var r = origem.getBoundingClientRect(), fr = f.getBoundingClientRect(); f.style.transform = 'translate(' + (r.left + r.width / 2 - fr.left - fr.width / 2) + 'px,' + (r.top + r.height / 2 - fr.top - fr.height / 2) + 'px) scale(' + (r.width / fr.width) + ')'; void f.offsetWidth; }
    requestAnimationFrame(function () { ov.classList.add('on'); f.style.transform = ''; });
    if (navegar) { setTimeout(function () { location.href = href; }, rm() ? 0 : 750); return; }
    var fechar = function () { ov.remove(); d.removeEventListener('keydown', k); if (origem) origem.focus(); };
    var k = function (e) { if (e.key === 'Escape') fechar(); if (e.key === 'Tab') { var fs = $$('a,button', ov); if (e.shiftKey && d.activeElement === fs[0]) { e.preventDefault(); fs[fs.length - 1].focus(); } else if (!e.shiftKey && d.activeElement === fs[fs.length - 1]) { e.preventDefault(); fs[0].focus(); } } };
    d.addEventListener('keydown', k); $('.aw-fechar', ov).addEventListener('click', fechar); ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    setTimeout(function () { $('.aw-zoom-bt a', ov).focus(); }, 50);
  }
  function cards() {
    dados();
    var grade = $('.grupo') && d.querySelector('form.arquivo');
    if (grade) d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.card'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button || rm()) return;
      e.preventDefault(); var im = $('img', a); cardFlip(a.getAttribute('href'), im ? im.currentSrc || im.src : '', ($('h4', a) || a).textContent, true, a);
    });
    var anel = $('.anel-h'); if (!anel) return;
    anel.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.anel-c'); if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || rm()) return;
      e.preventDefault(); cardFlip(a.getAttribute('href'), $('img', a).src, a.getAttribute('data-nome'), true, a);
    });
    var ctas = $('.anel-ctas', anel); if (!ctas || $('.aw-virar', ctas)) return;
    var b = d.createElement('button'); b.type = 'button'; b.className = 'btn btn-2 aw-virar'; b.textContent = 'Virar card ⟲'; ctas.appendChild(b);
    b.addEventListener('click', function () { var c = $('.anel-c.on', anel) || $('.anel-c', anel); cardFlip(c.getAttribute('href'), $('img', c).src, c.getAttribute('data-nome'), false, b); });
  }

  /* ---------- 1 · Ponpon: câmera quadro a quadro  ·  8 · MANGA-SAN: onomatopeia na troca  ·  7 · Hybrid4: webtoon */
  var SFX = ['DOON', 'BAM', 'ZUN', 'GOGOGO', 'PÁ', 'VUSH'];
  function sfx(alvo, txt) {
    if (rm()) return; var s = d.createElement('span'); s.className = 'aw-sfx'; s.setAttribute('aria-hidden', 'true'); s.textContent = txt;
    alvo.appendChild(s); setTimeout(function () { s.remove(); }, 900);
  }
  function camera() {
    var cap = $('.mg-cap'), ctrl = cap && $('.mg-ctrl', cap); if (!ctrl) return;
    var pags = $$('.mg-pag', cap), qs = []; pags.forEach(function (p, i) { $$('.mg-q', p).forEach(function (q, j) { qs.push([i, j]); }); });
    var b = d.createElement('button'); b.type = 'button'; b.className = 'aw-cam-bt'; b.textContent = '🎥 Câmera'; b.title = 'Ler quadro a quadro (setas, Esc para sair)';
    ctrl.appendChild(b);
    var w = d.createElement('button'); w.type = 'button'; w.className = 'aw-web-bt'; w.setAttribute('aria-pressed', 'false'); w.textContent = '📱 Webtoon'; w.title = 'Leitura vertical contínua, quadro após quadro';
    ctrl.appendChild(w);
    var webOn = false; try { webOn = localStorage.getItem('bl-webtoon') === '1'; } catch (e) {}
    function web(on, salvar) {
      webOn = on; cap.classList.toggle('aw-webtoon', on); w.setAttribute('aria-pressed', on);
      var bm = $('.mg-modo', cap); if (on && bm && bm.getAttribute('aria-pressed') !== 'true') bm.click();
      if (salvar) { try { on ? localStorage.setItem('bl-webtoon', '1') : localStorage.removeItem('bl-webtoon'); } catch (e) {} anunciar(on ? 'Modo webtoon ligado' : 'Modo webtoon desligado'); }
    }
    w.addEventListener('click', function () { web(!webOn, true); });
    if (webOn) setTimeout(function () { web(true, false); }, 0);
    var dlg, palco, cl, info, k = 0, volta;
    function abrir() {
      volta = d.activeElement;
      dlg = d.createElement('div'); dlg.className = 'aw-cam'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Câmera: leitura quadro a quadro');
      dlg.innerHTML = '<div class="aw-cam-v"><div class="aw-cam-p"></div></div><div class="aw-cam-ui"><button type="button" class="btn btn-2 aw-c-ant" aria-label="Quadro anterior">←</button><p class="aw-c-info" aria-live="polite"></p><button type="button" class="btn btn-2 aw-c-seg" aria-label="Próximo quadro">→</button><button type="button" class="btn aw-c-x">Sair (Esc)</button></div>';
      d.body.appendChild(dlg); H.classList.add('aw-cam-on'); palco = $('.aw-cam-p', dlg); info = $('.aw-c-info', dlg);
      $('.aw-c-ant', dlg).onclick = function () { ir(k - 1); }; $('.aw-c-seg', dlg).onclick = function () { ir(k + 1); }; $('.aw-c-x', dlg).onclick = fechar;
      d.addEventListener('keydown', tecla); ir(0, true); $('.aw-c-seg', dlg).focus();
    }
    function fechar() { d.removeEventListener('keydown', tecla); dlg.remove(); H.classList.remove('aw-cam-on'); cl = null; if (volta) volta.focus(); }
    function tecla(e) {
      if (e.key === 'Escape') { e.preventDefault(); fechar(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); ir(k + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); ir(k - 1); }
      else if (e.key === 'Tab') { var fs = $$('button', dlg); if (e.shiftKey && d.activeElement === fs[0]) { e.preventDefault(); fs[fs.length - 1].focus(); } else if (!e.shiftKey && d.activeElement === fs[fs.length - 1]) { e.preventDefault(); fs[0].focus(); } }
    }
    function ir(n, ini) {
      n = Math.max(0, Math.min(qs.length - 1, n)); var mudouPag = !cl || +cl.dataset.i !== qs[n][0]; k = n;
      if (mudouPag) {
        palco.innerHTML = ''; cl = pags[qs[n][0]].cloneNode(true); cl.hidden = false; cl.removeAttribute('tabindex'); cl.dataset.i = qs[n][0];
        $$('[id]', cl).forEach(function (e) { e.removeAttribute('id'); }); $$('a', cl).forEach(function (a) { a.tabIndex = -1; });
        cl.setAttribute('aria-hidden', 'false'); palco.appendChild(cl); palco.classList.add('sem-t'); palco.style.transform = 'none';
      }
      var q = $$('.mg-q', cl)[qs[n][1]];
      $$('.mg-q', cl).forEach(function (x) { x.classList.toggle('aw-foco', x === q); });
      var V = $('.aw-cam-v', dlg).getBoundingClientRect(), pr = palco.getBoundingClientRect(), qr = q.getBoundingClientRect();
      var cur = palco.style.transform === 'none' ? null : 1;
      if (cur) { palco.classList.add('sem-t'); var old = palco.style.transform; palco.style.transform = 'none'; pr = palco.getBoundingClientRect(); qr = q.getBoundingClientRect(); palco.style.transform = old; void palco.offsetWidth; }
      var s = Math.min(V.width * 0.92 / qr.width, V.height * 0.88 / qr.height, 3);
      var cx = qr.left - pr.left + qr.width / 2, cy = qr.top - pr.top + qr.height / 2;
      var tx = V.width / 2 - cx * s, ty = V.height / 2 - cy * s;
      if (!rm()) palco.classList.remove('sem-t');
      requestAnimationFrame(function () { palco.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')'; });
      var tt = $('figcaption', q); info.textContent = 'Quadro ' + (n + 1) + ' de ' + qs.length + ' · página ' + (qs[n][0] + 1) + (tt ? ' — ' + tt.textContent.trim().slice(0, 160) : '');
      if (!ini) { var sf = $('.mg-sfx', q); sfx(dlg, sf ? sf.textContent : SFX[n % SFX.length]); }
    }
    b.addEventListener('click', abrir);
    /* 8 · onomatopeia também na troca de página normal */
    var livro = $('.mg-livro', cap);
    if (livro) new MutationObserver(function (m) { if (m.some(function (x) { return x.attributeName === 'class' && livro.classList.contains('mg-vira'); })) { var v = pags.filter(function (p) { return !p.hidden; })[0], sf = v && $('.mg-sfx', v); sfx(livro, sf ? sf.textContent : 'VUSH'); } }).observe(livro, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- 4 · Dembélé: pênalti no 404 */
  function penalti() {
    var s = $('.aw-pen'); if (!s) return; s.hidden = false;
    var gk = $('.gk', s), bola = $('.bola', s), res = $('.aw-pen-res', s), de = $('.aw-pen-de-novo', s), bts = $$('[data-c]', s), gol = 0, n = 0, ocup = false;
    var X = [70, 150, 230];
    function chutar(c) {
      if (ocup || n >= 5) return; ocup = true; var g = Math.floor(Math.random() * 3); n++;
      gk.style.transform = 'translateX(' + (X[g] - 150) + 'px)'; bola.style.transform = 'translate(' + (X[c] - 150) + 'px,-78px) scale(.7)';
      var ok = g !== c; if (ok) gol++;
      setTimeout(function () {
        res.textContent = (ok ? 'GOL! ' : 'Defendeu! ') + 'Placar: ' + gol + ' de ' + n + (n >= 5 ? (gol >= 4 ? ' · Ego de artilheiro.' : gol >= 3 ? ' · Passou na seleção.' : ' · Eliminado. Treine e volte.') : '');
        if (ok) sfx(s, 'GOOOL'); s.classList.toggle('aw-gol-ok', ok);
        setTimeout(function () { gk.style.transform = ''; bola.style.transform = ''; ocup = false; if (n >= 5) { de.hidden = false; bts.forEach(function (b) { b.disabled = true; }); de.focus(); } }, rm() ? 200 : 700);
      }, rm() ? 0 : 450);
    }
    bts.forEach(function (b) { b.addEventListener('click', function () { chutar(+b.dataset.c); }); });
    d.addEventListener('keydown', function (e) { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || !(e.target === d.body || s.contains(e.target))) return; var m = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2 }[e.key]; if (m != null) { e.preventDefault(); chutar(m); } });
    de.addEventListener('click', function () { gol = n = 0; de.hidden = true; bts.forEach(function (b) { b.disabled = false; }); res.textContent = 'Placar: 0 de 0'; bts[1].focus(); });
  }


  /* ---------- 4b · Dembélé: storytelling horizontal (trilha das cenas na Narrativa) */
  function trilha() {
    var palco = $('.nr-palco'), nar = $('#nar'); if (!palco || !nar) return;
    var box = d.createElement('section'); box.className = 'aw-trilha'; box.setAttribute('aria-labelledby', 'aw-tr-t');
    box.innerHTML = '<h2 class="aw-tr-h" id="aw-tr-t">Sua trilha</h2><ol class="aw-tr-l" tabindex="0" aria-label="Cenas que você já passou, da primeira à atual"></ol>';
    var gr = $('.nr-grade', nar); nar.insertBefore(box, gr || nar.firstChild);
    var ol = $('ol', box), T = [];
    function att() {
      var t = $('#nr-t', palco); if (!t) return; var x = t.textContent.trim(); if (!x || T[T.length - 1] === x) return;
      var i = T.indexOf(x); if (i >= 0) T = T.slice(0, i + 1); else T.push(x);
      ol.innerHTML = T.map(function (c, k) { return '<li' + (k === T.length - 1 ? ' aria-current="step"' : '') + '><span>' + ('0' + (k + 1)).slice(-2) + '</span>' + esc(c) + '</li>'; }).join('');
      var u = ol.lastChild; if (u) ol.scrollTo({ left: ol.scrollWidth, behavior: rm() ? 'auto' : 'smooth' });
    }
    att(); new MutationObserver(att).observe(palco, { childList: true });
  }

  /* ---------- 6 · Ankoku: navegação por pontos nas seções da home */
  function pontos() {
    var anel = $('.anel-h'); if (!anel) return;
    var secs = [[anel, 'Abertura'], [$('.sala'), 'Sala de controle'], [$('.abertura'), 'O projeto']].filter(function (x) { return x[0]; });
    H.classList.add('aw-secoes');
    var nav = d.createElement('nav'); nav.className = 'aw-dots'; nav.setAttribute('aria-label', 'Seções da página');
    nav.innerHTML = secs.map(function (x, i) { x[0].id = x[0].id || 'aw-s' + i; return '<a href="#' + x[0].id + '" aria-label="' + x[1] + '"><span>' + ('0' + (i + 1)).slice(-2) + ' ' + x[1] + '</span></a>'; }).join('');
    d.body.appendChild(nav);
    var as = $$('a', nav);
    as.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); secs[i][0].scrollIntoView({ behavior: rm() ? 'auto' : 'smooth' }); }); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var i = secs.map(function (x) { return x[0]; }).indexOf(e.target); as.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); } }); }, { threshold: 0.45 });
      secs.forEach(function (x) { io.observe(x[0]); });
    }
  }

  /* ---------- 9 · Moves You: olhos que seguem o mouse e piscam */
  function olhos() {
    var leg = $('.anel-leg'); if (!leg || $('.aw-olhos', leg)) return;
    leg.insertAdjacentHTML('afterbegin', '<svg class="aw-olhos" viewBox="0 0 120 40" aria-hidden="true" focusable="false"><g class="ol"><path class="pal" d="M4 20 Q30 0 56 20 Q30 40 4 20Z"/><circle class="iris" cx="30" cy="20" r="8"/><circle class="pup" cx="30" cy="20" r="3.5"/></g><g class="ol"><path class="pal" d="M64 20 Q90 0 116 20 Q90 40 64 20Z"/><circle class="iris" cx="90" cy="20" r="8"/><circle class="pup" cx="90" cy="20" r="3.5"/></g></svg>');
    var sv = $('.aw-olhos', leg); if (toque || rm()) return;
    var ir = $$('.iris,.pup', sv);
    addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return; var r = sv.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), a = Math.atan2(dy, dx), m = Math.min(1, Math.hypot(dx, dy) / 300);
      var tx = (Math.cos(a) * 9 * m).toFixed(1), ty = (Math.sin(a) * 5 * m).toFixed(1); ir.forEach(function (c) { c.style.transform = 'translate(' + tx + 'px,' + ty + 'px)'; });
    }, { passive: true });
    (function pisca() { setTimeout(function () { sv.classList.add('pisca'); setTimeout(function () { sv.classList.remove('pisca'); pisca(); }, 160); }, 2500 + Math.random() * 3500); })();
  }

  function ini() { [salaGauge, dueloGauge, contadores, cards, camera, penalti, trilha, pontos, olhos].forEach(function (f) { try { f(); } catch (e) { if (window.console) console.warn('aw', f.name, e); } }); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ini); else ini();
})();
