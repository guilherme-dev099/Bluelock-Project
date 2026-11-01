/* temporada.html: ranking, missões da semana, histórico e card da Seleção (script clássico) */
(function () {
  'use strict';
  var T = window.BL_TEMPORADA, D = window.BL_TEMP, app = document.getElementById('tp-app'); if (!T || !app) return;
  var esc = T.esc;
  function fmt(d) { return d.split('-').reverse().join('/'); }
  function render() {
    var dia = T.hoje(), q = T.quando(dia), s = T.estado(q), r = T.rank(s.pts), ms = T.missoes(q.n, q.semana);
    var prox = r > 1 ? T.ptsPara(r - 1) - s.pts : 0, sk = 's' + q.semana, cont = (s.sem[sk] || {});
    var pctT = Math.round((q.diaT / 28) * 100);
    var h = '<section class="tp-topo" aria-labelledby="tp-rank-t"><h2 id="tp-rank-t" class="sr-only">Seu ranking</h2>' +
      '<p class="tp-num" aria-describedby="tp-num-d"><span class="tp-hash" aria-hidden="true">#</span>' + r + '</p>' +
      '<div class="tp-info" id="tp-num-d"><p><b>' + s.pts + '</b> pontos de Ego · Temporada ' + q.n + '</p>' +
      '<p>Semana ' + q.semana + ' de 4 · dia ' + q.diaT + ' de 28 (' + fmt(q.ini) + ' a ' + fmt(q.fim) + ')</p>' +
      '<p><label for="tp-bar">Progresso da temporada</label> <meter id="tp-bar" min="0" max="100" value="' + pctT + '">' + pctT + '%</meter></p>' +
      '<p>' + (r > 1 ? 'Faltam <b>' + prox + '</b> Ego para chegar a #' + (r - 1) + '.' : 'Você é o nº 1 do Blue Lock nesta temporada.') + '</p></div></section>';
    h += '<h2 class="hub-sec">Missões da semana ' + q.semana + '</h2><ul class="tp-missoes">' + ms.map(function (m) {
      var feita = s.feitas[sk + ':' + m.id], v = Math.min(m.n, cont[m.ev + (m.c ? ':' + m.c : '')] || 0);
      return '<li class="tp-m' + (feita ? ' ok' : '') + '"><span class="tp-m-e" aria-hidden="true">' + m.e + '</span><div><b>' + esc(m.nome) + '</b><span>' + esc(m.desc) + '</span>' +
        '<span class="tp-m-p"><meter min="0" max="' + m.n + '" value="' + v + '" aria-label="Progresso">' + v + '/' + m.n + '</meter> ' + v + '/' + m.n + ' · +' + m.pts + ' Ego' + (feita ? ' · <b>cumprida ✓</b>' : '') + '</span></div>' +
        '<a class="btn btn-2" href="' + esc(m.href) + '">Ir</a></li>';
    }).join('') + '</ul><p class="tp-nota">Missões novas toda segunda-feira (horário de Brasília). Elas são iguais para todo mundo.</p>';
    h += '<h2 class="hub-sec">Histórico</h2>' + (s.log.length ? '<ol class="tp-log">' + s.log.slice(0, 20).map(function (l) { return '<li><span>' + fmt(l.d) + '</span> ' + esc(l.t) + ' <b>+' + l.p + '</b></li>'; }).join('') + '</ol>' : '<p>Nada ainda. Jogue qualquer jogo do site para ganhar Ego.</p>');
    h += '<h2 class="hub-sec">Seu card da Seleção</h2><p class="tp-nota">' + (q.semana === 4 ? 'Última semana: este é o card que fecha a sua temporada.' : 'Prévia: o card fecha no fim da temporada, em ' + fmt(q.fim) + '.') + '</p>' + card(q, s, r);
    var ant = []; for (var n = q.n - 1; n >= 1 && ant.length < 6; n--) { var e = T.estado({ n: n }); if (e.pts) ant.push('<li>Temporada ' + n + ': <b>#' + T.rank(e.pts) + '</b> · ' + e.pts + ' Ego</li>'); }
    if (ant.length) h += '<h2 class="hub-sec">Temporadas anteriores</h2><ul class="tp-ant">' + ant.join('') + '</ul>';
    app.innerHTML = h;
  }
  function card(q, s, r) {
    var V = T.vida(), tot = V.tot, top = Object.keys(D.pontos).map(function (k) { return [k, tot[k] || 0]; }).sort(function (a, b) { return b[1] - a[1]; })[0];
    var tit = r <= 1 ? 'Nº 1 do Blue Lock' : r <= 11 ? 'Titular do Blue Lock Eleven' : r <= 35 ? 'Convocado para a NEL' : r <= 100 ? 'Sobrevivente da 2ª Seleção' : r <= 200 ? 'Sobrevivente da 1ª Seleção' : 'Recém-chegado ao Blue Lock';
    return '<figure class="tp-card"><div class="tp-card-in"><p class="tp-card-t">Temporada ' + q.n + '</p><p class="tp-card-n">#' + r + '</p><p class="tp-card-s">' + tit + '</p>' +
      '<ul><li><b>' + s.pts + '</b> Ego</li><li><b>' + Object.keys(s.feitas).length + '</b> missões</li><li><b>' + Object.keys(V.fichas).length + '</b> fichas vistas</li></ul>' +
      (top && top[1] ? '<p class="tp-card-f">Especialidade: ' + esc(D.pontos[top[0]].nome) + '</p>' : '') + '</div><figcaption class="sr-only">Card da temporada ' + q.n + ': ranking ' + r + ', ' + tit + '.</figcaption></figure>' +
      '<p><button type="button" class="btn" id="tp-copiar">Copiar resultado</button> <button type="button" class="btn btn-2" onclick="print()">Imprimir card</button></p>';
  }
  render();
  document.addEventListener('bl-temporada', render);
  app.addEventListener('click', function (e) {
    if (e.target.id !== 'tp-copiar') return;
    var q = T.quando(T.hoje()), s = T.estado(q);
    var t = 'Blue Lock · Temporada Egoísta ' + q.n + ': #' + T.rank(s.pts) + ' com ' + s.pts + ' Ego\n' + (BL.urlPublica ? BL.urlPublica('temporada.html', '') : location.href);
    if (BL.copiar) BL.copiar(t, e.target, 'Copiado'); else if (navigator.clipboard) navigator.clipboard.writeText(t);
  });
})();
