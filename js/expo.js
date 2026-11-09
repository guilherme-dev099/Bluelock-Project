/* Blue Lock — exposição. Movimento lento, nenhuma interface além do essencial. */
(function(){
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* revelação ao entrar na tela */
  var alvos = document.querySelectorAll('.rv,.rv-img,.pent');
  if ('IntersectionObserver' in window && !reduz) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } });
    }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
    alvos.forEach(function(el){ io.observe(el); });
  } else {
    alvos.forEach(function(el){ el.classList.add('vis'); });
  }
  /* comprimento do traço do pentágono */
  document.querySelectorAll('.pent .traco').forEach(function(p){
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch(e) {}
  });
  /* retratos da entrada: troca lenta, com pausa */
  var q = document.querySelector('.quadro[data-seq]');
  if (!q) return;
  var imgs = q.querySelectorAll('.pilha img'), nome = q.querySelector('[data-nome]'),
      num = q.querySelector('[data-num]'), fundo = document.querySelector('.nome-fundo'),
      bt = q.querySelector('.pausa'), i = 0, t = null, parado = reduz;
  function mostra(n){
    imgs[i].classList.remove('on'); i = (n + imgs.length) % imgs.length; imgs[i].classList.add('on');
    var im = imgs[i];
    if (nome) nome.textContent = im.getAttribute('data-nome');
    if (num) num.textContent = im.getAttribute('data-num');
    if (fundo) { fundo.style.opacity = 0; setTimeout(function(){ fundo.textContent = im.getAttribute('data-curto'); fundo.style.opacity = 1; }, 900); }
    var a=q.querySelector('a'); a.setAttribute('href', im.getAttribute('data-href')); a.setAttribute('aria-label', 'Ver a obra: ' + im.getAttribute('data-nome'));
  }
  function roda(){ clearInterval(t); if (!parado) t = setInterval(function(){ mostra(i + 1); }, 7000); }
  if (bt && !reduz) {
    bt.hidden = false;
    function rot(){ bt.textContent = parado ? 'Continuar' : 'Pausar'; bt.setAttribute('aria-pressed', parado ? 'true' : 'false'); }
    rot();
    bt.addEventListener('click', function(){ parado = !parado; rot(); roda(); });
  }
  document.addEventListener('visibilitychange', function(){ if (document.hidden) clearInterval(t); else roda(); });
  roda();
})();
