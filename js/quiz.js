/* P5 Quiz "Qual é a sua Arma?": pontua só pela interseção respostas × Armas das fichas — quiz.html */
(function () {
  'use strict';
  var BL = window.BL, form = document.querySelector('.quiz'), res = document.querySelector('.quiz-res');
  if (!BL || !form || !res) return;
  var esc = BL.esc, sets = [].slice.call(form.querySelectorAll('fieldset')), prog = form.querySelector('.quiz-prog'), btn = form.querySelector('[type=submit]');
  btn.hidden = false;
  function respondidas() { return sets.filter(function (f) { return f.querySelector('input:checked'); }).length; }
  function progresso() { var n = respondidas(); prog.textContent = n + ' de ' + sets.length + ' respondidas'; btn.disabled = n < sets.length; }
  form.addEventListener('change', progresso); progresso();
  BL.personagens().then(function (dados) {
    var jogadores = dados.filter(function (p) { return p.jogador && p.armas.length; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (respondidas() < sets.length) { prog.textContent = 'Responda todas as perguntas.'; return; }
      var escolhas = sets.map(function (f) { var i = f.querySelector('input:checked'); return { texto: i.nextElementSibling.textContent, termos: i.dataset.termos.split('|') }; });
      var ranking = jogadores.map(function (p) {
        var chaves = p.armas.map(function (a) { return { k: BL.chaveArma(a), a: a }; }), bate = [], armas = [];
        escolhas.forEach(function (c) {
          var hit = chaves.filter(function (x) { return c.termos.some(function (t) { return x.k.indexOf(t) >= 0; }); });
          if (hit.length) { bate.push(c.texto); hit.forEach(function (h) { if (armas.indexOf(h.a) < 0) armas.push(h.a); }); }
        });
        return { p: p, pontos: bate.length * 10 + armas.length, bate: bate, armas: armas };
      }).sort(function (a, b) { return b.pontos - a.pontos || (a.p.rankingFinal || 999) - (b.p.rankingFinal || 999); });
      var top = ranking[0], seg = ranking[1], p = top.p;
      var url = new URL(p.url, location.href).href;
      res.innerHTML = '<h2 tabindex="-1">Sua Arma combina com <a href="' + esc(p.url) + '">' + esc(p.nome) + '</a></h2>' +
        '<div class="quiz-card"><img src="' + esc(p.img) + '" alt="" width="480" height="552"><div>' +
        (top.bate.length ? '<p>Você escolheu <strong>' + top.bate.map(esc).join('</strong>, <strong>') + '</strong>. Na ficha de ' + esc(p.nome) + ' estão: ' + top.armas.map(function (a) { return '<span class="chip">' + esc(a) + '</span>'; }).join(' ') + '.</p>'
          : '<p>Nenhuma resposta coincidiu com as Armas das fichas; este é o primeiro do ranking entre os empatados.</p>') +
        (seg && seg.pontos ? '<p class="quiz-seg">Em 2º: <a href="' + esc(seg.p.url) + '">' + esc(seg.p.nome) + '</a></p>' : '') +
        '<p class="quiz-acoes"><a class="btn" href="' + esc(p.url) + '">Ver ficha</a> <a class="btn btn-2" href="duelo.html?a=' + esc(p.id) + '">⚔ x1 contra ' + esc(BL.sobrenome(p)) + '</a> <button type="button" class="btn btn-2 quiz-share">Compartilhar</button> <button type="button" class="btn btn-2 quiz-reset">Refazer</button></p>' +
        '<p class="nota">O quiz só cruza suas respostas com as Armas listadas nas fichas; não atribui personalidade.</p></div></div>';
      res.hidden = false;
      res.querySelector('h2').focus();
      res.querySelector('.quiz-reset').onclick = function () { form.reset(); res.hidden = true; progresso(); sets[0].querySelector('input').focus(); };
      res.querySelector('.quiz-share').onclick = function (ev) {
        var b = ev.currentTarget, txt = 'Minha Arma no Blue Lock combina com ' + p.nome + ': ' + url;
        var ok = function () { b.textContent = 'Copiado ✓'; BL.anunciar('Resultado copiado'); };
        if (navigator.share) navigator.share({ title: 'Qual é a sua Arma?', text: txt }).catch(function () {});
        else if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, function () { prompt('Copie:', txt); });
        else prompt('Copie:', txt);
      };
    });
  }).catch(function (e) { console.warn('Quiz indisponível:', e); });
})();
