/* Sala de Controle do Ego (home). Script clássico; sem JS a página já mostra os monitores com links. */
(function () {
  'use strict';
  var sala = document.querySelector('.sala'); if (!sala) return;
  var h = document.documentElement, $ = function (s, r) { return (r || document).querySelector(s); };
  function ler(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function reduz() { return h.getAttribute('data-mov') === 'reduzir' || matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var dia; try { dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { dia = new Date().toISOString().slice(0, 10); }
  function hs(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  window.BL = window.BL || {}; BL.monitores = BL.monitores || [];
  function mon(id, render) { BL.monitores.push({ id: id, render: render }); }

  /* Desafio do dia */
  mon('desafio', function (el) {
    var feito = ler('bl-dd-feito') === dia, pal = ler('bl-dd-' + dia, []), st = ler('bl-dd-stats', {});
    var txt = feito ? 'Feito hoje ✓' : pal && pal.length ? 'Em andamento · ' + pal.length + ' palpite' + (pal.length > 1 ? 's' : '') : 'Pendente';
    $('.m-status', el).textContent = txt; el.classList.toggle('m-ok', feito);
    $('.m-det', el).textContent = st.jogos ? 'Sequência: ' + (st.seq || 0) + ' · melhor: ' + (st.melhor || 0) + ' · vitórias: ' + (st.vitorias || 0) + '/' + st.jogos : 'Adivinhe o egoísta do dia pelas pistas.';
    $('.m-cta', el).textContent = feito ? 'Ver resultado →' : pal && pal.length ? 'Continuar →' : 'Jogar agora →';
  });
  /* Continuar lendo */
  mon('lendo', function (el) {
    var m = ler('bl-manga', {}), n = Object.keys(m.lidos || {}).length, c = $('.m-cta', el);
    if (m.ult && m.ult.cap) {
      $('.m-status', el).textContent = 'Capítulo ' + parseInt(m.ult.cap.replace(/\D/g, ''), 10) + ' · página ' + ((m.ult.pag || 0) + 1);
      c.href = m.ult.cap + '.html' + (m.ult.pag ? '#p' + (m.ult.pag + 1) : ''); c.textContent = 'Continuar lendo →';
    }
    if (n) $('.m-det', el).textContent = n + ' capítulo' + (n > 1 ? 's' : '') + ' lido' + (n > 1 ? 's' : '') + '.';
  });
  /* Seu progresso (no lugar da Temporada, que ainda não existe) */
  mon('progresso', function (el) {
    var a = ler('bl-album', {}), fig = Object.keys(a.ids || {}).length, st = ler('bl-dd-stats', {}), m = ler('bl-manga', {}), lidos = Object.keys(m.lidos || {}).length;
    var ul = $('.m-nums', el); if (!ul) return;
    ul.innerHTML = '<li><b>' + fig + '</b> figurinhas</li><li><b>' + (st.vitorias || 0) + '</b> desafios vencidos</li><li><b>' + lidos + '</b> capítulos lidos</li>';
  });
  /* Ego fala (frases do site) */
  mon('ego', function (el) {
    var F = window.BL_FRASES || []; if (!F.length) return;
    $('.m-frase', el).textContent = '“' + F[hs('ego-' + dia) % F.length] + '”';
  });
  /* Último visto */
  mon('visto', function (el) {
    var v = ler('bl-visto', null); if (!v || !v.url || !/^[a-z0-9-]+\.html$/.test(v.url)) return;
    var c = $('.m-cta', el); c.href = v.url; c.textContent = 'Voltar para ' + v.nome + ' →';
    $('.m-status', el).textContent = v.nome;
    $('.m-det', el).textContent = 'A última ficha que você abriu.';
  });

  function rodar() { BL.monitores.forEach(function (m) { var el = sala.querySelector('[data-monitor="' + m.id + '"]'); if (el) try { m.render(el); } catch (e) {} }); }
  rodar();

  /* Em alta + mini-x1 (dependem dos dados) */
  if (!BL.personagens) return;
  BL.personagens().then(function (L) {
    var pool = L.filter(function (p) { return p.jogador; }); if (pool.length < 2) return;
    var A = pool[hs('alta-' + dia) % pool.length], B = pool[hs('rival-' + dia) % pool.length];
    if (B === A) B = pool[(pool.indexOf(A) + 1) % pool.length];
    var el = sala.querySelector('[data-monitor="alta"]');
    if (el) {
      $('.m-status', el).textContent = A.nome;
      $('.m-det', el).textContent = (A.posicao || '').split(',')[0] + (window.BLX1 && BLX1.timeAtual(A) ? ' · ' + BLX1.timeAtual(A) : '');
      var im = $('.m-foto', el); im.src = A.thumb || A.img; im.hidden = false;
      var c = $('.m-cta', el); c.href = A.url; c.textContent = 'Abrir a ficha →';
    }
    var x = sala.querySelector('[data-monitor="x1"]'); if (!x || !window.BLX1) return;
    var seed = 'sala-' + dia, r = BLX1.simular(A, B, seed), nA = BLX1.curto(A, B), nB = BLX1.curto(B, A);
    var linhas = r.ev.filter(function (e) { return e.txt; }), i = 0, g = [0, 0], tim = null;
    var pl = $('.m-placar', x), nar = $('.m-narra', x), bt = $('.m-pausa', x);
    $('.m-cta', x).href = 'duelo.html?a=' + encodeURIComponent(A.id) + '&b=' + encodeURIComponent(B.id) + '&seed=' + encodeURIComponent(seed) + '&auto=1';
    $('.m-cta', x).textContent = 'Assistir no Duelo →';
    function placar() { pl.textContent = nA + ' ' + g[0] + ' × ' + g[1] + ' ' + nB; }
    function passo() {
      if (i >= linhas.length) { parar(); g = [r.J[0].g, r.J[1].g]; placar(); bt.textContent = '↻ Rever'; return; }
      var e = linhas[i++]; nar.textContent = e.txt;
      if (e.t === 'gol' && e.placar) { g = e.placar.slice(); placar(); }
    }
    function parar() { clearInterval(tim); tim = null; bt.setAttribute('aria-pressed', 'true'); bt.textContent = '▶ Tocar'; }
    function tocar() { if (i >= linhas.length) { i = 0; g = [0, 0]; } tim = setInterval(passo, 2400); bt.setAttribute('aria-pressed', 'false'); bt.textContent = '❚❚ Pausar'; passo(); }
    bt.hidden = false; placar();
    bt.addEventListener('click', function () { tim ? parar() : tocar(); });
    if (reduz()) { g = [r.J[0].g, r.J[1].g]; placar(); nar.textContent = 'Resultado: ' + BLX1.curto(r.J[r.venc].p, r.J[1 - r.venc].p) + ' vence' + ' em ' + r.lances + ' lances. Toque para narrar.'; parar(); }
    else tocar();
  });
})();
