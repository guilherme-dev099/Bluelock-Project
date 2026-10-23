/* Narrador por voz (Web Speech API, pt-BR) — script clássico, funciona em file:// (voz local do sistema).
   Desligado por padrão. BL.voz = { on, rate, disponivel, falar(txt, depois), pause(), resume(), cancel() }.
   Enquanto a voz está ligada, BL.anunciar fica em silêncio (dados.js) para não falar junto com o leitor de tela.
   Pausar cancela a fala em curso; "depois" de falas canceladas nunca é chamado (contador de geração). */
(function () {
  'use strict';
  var BL = window.BL; if (!BL) return;
  var ss = window.speechSynthesis, ok = !!(ss && window.SpeechSynthesisUtterance);
  var pref = {}; try { pref = JSON.parse(localStorage.getItem('bl-voz') || '{}'); } catch (e) {}
  var ligado = false; try { ligado = sessionStorage.getItem('bl-voz-on') === '1'; } catch (e) {}
  var voz = BL.voz = { on: ok && ligado, rate: pref.rate || 1.05, disponivel: ok, ger: 0 };
  function vozPt() {
    var vs = ss.getVoices() || [];
    return vs.filter(function (v) { return /^pt[-_]BR/i.test(v.lang); })[0] || vs.filter(function (v) { return /^pt/i.test(v.lang); })[0] || null;
  }
  voz.falar = function (txt, depois) {
    var g = voz.ger, feito = false, t = null;
    var fim = function () { if (feito) return; feito = true; clearTimeout(t); if (g === voz.ger && depois) depois(); };
    var limpo = String(txt || '').replace(/[\u{1F000}-\u{1FAFF}\u2190-\u2BFF\uFE0F]/gu, '').replace(/\s+/g, ' ').trim();
    if (!voz.on || !ok || !limpo) { if (depois) depois(); return false; }
    var u = new SpeechSynthesisUtterance(limpo);
    u.lang = 'pt-BR'; u.rate = voz.rate; var v = vozPt(); if (v) u.voice = v;
    u.onend = u.onerror = fim;
    /* salvaguarda: alguns sistemas não disparam onend (ou não têm voz) — o jogo nunca trava */
    t = setTimeout(fim, 1200 + limpo.length * 95 / voz.rate);
    ss.speak(u); return true;
  };
  voz.cancel = function () { voz.ger++; if (ok) ss.cancel(); };
  voz.pause = voz.cancel;            /* pausar = calar; ao retomar, segue do próximo lance */
  voz.resume = function () {};
  addEventListener('pagehide', function () { if (ok) ss.cancel(); });

  /* interruptor nos controles de partida/revelação */
  var ALVOS = '[data-narrador], .x1-ctrl, .ca-jogo .x1-botoes, .lg-ctrl';
  var botoes = [];
  function pintar() {
    botoes.forEach(function (b) {
      b.setAttribute('aria-pressed', String(voz.on));
      b.querySelector('.narr-txt').textContent = voz.on ? 'Narrador ligado' : 'Narrador';
    });
  }
  function alternar() {
    voz.on = !voz.on;
    try { sessionStorage.setItem('bl-voz-on', voz.on ? '1' : '0'); } catch (e) {}
    if (!voz.on) voz.cancel();
    pintar();
    if (voz.on) voz.falar('Narrador ligado.');
    else BL.anunciar('Narrador por voz desligado.');
  }
  [].forEach.call(document.querySelectorAll(ALVOS), function (alvo) {
    if (alvo.querySelector('.narr-btn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-2 narr-btn';
    b.innerHTML = '<span aria-hidden="true">🎙</span> <span class="narr-txt">Narrador</span>';
    if (!ok) { b.disabled = true; b.title = 'Este navegador não tem síntese de voz'; b.querySelector('.narr-txt').textContent = 'Narrador indisponível'; }
    else b.title = 'Narração em voz alta (pt-BR). Se você já usa leitor de tela, deixe desligado.';
    b.addEventListener('click', alternar);
    alvo.appendChild(b); botoes.push(b);
  });
  pintar();
  /* velocidade: Alt+↑ / Alt+↓ com a voz ligada */
  document.addEventListener('keydown', function (e) {
    if (!voz.on || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    voz.rate = Math.max(0.7, Math.min(1.8, Math.round((voz.rate + (e.key === 'ArrowUp' ? 0.15 : -0.15)) * 100) / 100));
    try { localStorage.setItem('bl-voz', JSON.stringify({ rate: voz.rate })); } catch (x) {}
    voz.cancel(); voz.falar('Velocidade ' + String(voz.rate).replace('.', ','));
  });
})();
