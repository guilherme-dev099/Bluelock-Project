/* P3 "Duelo de Egoístas": comparador 1×1 compartilhável — duelo.html?a=isagi&b=rin */
(function () {
  'use strict';
  var BL = window.BL, f = document.querySelector('.duelo-sel'), palco = document.querySelector('.duelo-palco');
  if (!BL || !f || !palco) return;
  var esc = BL.esc;
  /* fases em que "mesmo time" é seguro afirmar (2ª Seleção = grupos Red/White; 3ª = vários times "Blue Lock") */
  var SEGURAS = { '1ª Seleção': 1, 'Blue Lock × Sub-20': 1, 'Neo Egoist League': 1, 'Atual': 1 };
  BL.personagens().then(function (dados) {
    var por = {}; dados.forEach(function (p) { por[p.id] = p; });
    var qs = new URLSearchParams(location.search);
    f.a.value = por[qs.get('a')] ? qs.get('a') : 'isagi';
    f.b.value = por[qs.get('b')] ? qs.get('b') : (f.a.value === 'rin' ? 'isagi' : 'rin');
    [].forEach.call(f.querySelectorAll('[data-acao]'), function (b) { b.hidden = false; });

    function comparar(A, B) {
      var ka = {}, kb = {};
      A.armas.forEach(function (x) { ka[BL.chaveArma(x)] = x; }); B.armas.forEach(function (x) { kb[BL.chaveArma(x)] = x; });
      var comum = Object.keys(ka).filter(function (k) { return k in kb; }).map(function (k) { return ka[k]; });
      var soA = Object.keys(ka).filter(function (k) { return !(k in kb); }).map(function (k) { return ka[k]; });
      var soB = Object.keys(kb).filter(function (k) { return !(k in ka); }).map(function (k) { return kb[k]; });
      var linhas = BL.FASES.map(function (fase) {
        var fa = A.fases.filter(function (x) { return x.fase === fase; })[0], fb = B.fases.filter(function (x) { return x.fase === fase; })[0];
        var junto = !!(SEGURAS[fase] && fa && fb && fa.times.some(function (t) { return fb.times.indexOf(t) >= 0; }));
        return { fase: fase, fa: fa, fb: fb, junto: junto };
      }).filter(function (l) { return l.fa || l.fb; });
      return { comum: comum, soA: soA, soB: soB, linhas: linhas };
    }
    var pct = function (r) { return Math.max(2, (300 - r) / 299 * 100).toFixed(1) + '%'; };
    function barra(p) {
      if (!p.rankingFinal) return '<div class="rk rk-na"><span>Sem ranking do Blue Lock</span></div>';
      var s = BL.salto(p);
      return '<div class="rk" style="--ini:' + pct(p.rankingInicio) + ';--fim:' + pct(p.rankingFinal) + '" role="img" aria-label="Ranking: ' + esc(p.rankingTexto) + '">' +
        '<span class="rk-t">' + p.rankingInicio + 'º → ' + p.rankingFinal + 'º</span>' + (s ? '<b>+' + s + '</b>' : '') + '</div>' +
        '<p class="rk-txt">' + esc(p.rankingTexto) + '</p>';
    }
    var cel = function (x) { return x ? esc(x.time) + (x.numero ? ' <span class="num">nº ' + esc(x.numero) + '</span>' : '') : '<span class="nada">—</span>'; };
    var ul = function (l, cls, lbl) { return '<div class="col ' + cls + '"><h4>' + lbl + '</h4><ul>' + (l.length ? l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li class="vazio">Nenhuma</li>') + '</ul></div>'; };
    function lado(p, cls) {
      return '<div class="lado ' + cls + '"><img src="' + esc(p.img) + '" alt="" width="480" height="552" style="view-transition-name:duelo-' + cls + '">' +
        '<h2><a href="' + esc(p.url) + '">' + esc(p.nome) + '</a></h2><p class="pos">' + esc(p.posicao || '') + '</p>' + barra(p) + '</div>';
    }
    function render() {
      var A = por[f.a.value], B = por[f.b.value];
      if (A.id === B.id) { palco.innerHTML = '<p class="duelo-aviso">Escolha dois personagens diferentes.</p>' + lado(A, 'a'); return; }
      var c = comparar(A, B), juntos = c.linhas.filter(function (l) { return l.junto; });
      palco.innerHTML = lado(A, 'a') + '<div class="vs" aria-hidden="true">VS</div>' + lado(B, 'b') +
        '<section class="armas" aria-label="Armas"><h3>Armas</h3>' + ul(c.soA, 'so-a', 'Só ' + esc(BL.sobrenome(A))) + ul(c.comum, 'comum', 'Em comum') + ul(c.soB, 'so-b', 'Só ' + esc(BL.sobrenome(B))) + '</section>' +
        '<section class="traj-wrap"><h3>Trajetória lado a lado</h3>' +
        (juntos.length ? '<p class="juntos">Mesmo time em: ' + juntos.map(function (l) { return esc(l.fase) + ' (' + esc(l.fa.times.filter(function (t) { return l.fb.times.indexOf(t) >= 0; })[0]) + ')'; }).join(' · ') + '</p>' : '<p class="juntos">Nenhuma fase registrada no mesmo time (1ª Seleção, Sub-20, NEL ou atual).</p>') +
        '<table class="traj"><caption class="sr-only">Trajetória fase a fase de ' + esc(A.nome) + ' e ' + esc(B.nome) + '</caption>' +
        '<thead><tr><th scope="col">Fase</th><th scope="col">' + esc(A.nome) + '</th><th scope="col">' + esc(B.nome) + '</th></tr></thead><tbody>' +
        c.linhas.map(function (l) {
          return '<tr' + (l.junto ? ' class="junto"' : '') + '><th scope="row">' + esc(l.fase) + (l.junto ? ' <span class="tag">mesmo time</span>' : '') + '</th><td>' + cel(l.fa) + '</td><td>' + cel(l.fb) + '</td></tr>';
        }).join('') + '</tbody></table>' +
        (c.linhas.some(function (l) { return l.fase === '2ª Seleção'; }) ? '<p class="nota">Na 2ª Seleção as fichas só registram os grupos Red/White; isso não indica que jogaram juntos.</p>' : '') + '</section>';
      try { history.replaceState(null, '', '?a=' + A.id + '&b=' + B.id); } catch (e) {}
      document.title = A.nome + ' × ' + B.nome + ' | Duelo | Blue Lock';
    }
    var atualizar = function () { BL.transicao(render); BL.anunciar(por[f.a.value].nome + ' contra ' + por[f.b.value].nome); };
    f.addEventListener('change', atualizar);
    f.addEventListener('submit', function (e) { e.preventDefault(); atualizar(); });
    f.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return;
      var a = b.dataset.acao;
      if (a === 'trocar') { var t = f.a.value; f.a.value = f.b.value; f.b.value = t; }
      if (a === 'aleatorio') {
        var ids = dados.map(function (p) { return p.id; });
        var i = Math.floor(Math.random() * ids.length), j = Math.floor(Math.random() * (ids.length - 1)); if (j >= i) j++;
        f.a.value = ids[i]; f.b.value = ids[j];
      }
      if (a === 'copiar') {
        var url = location.href, ok = function () { b.textContent = 'Link copiado ✓'; BL.anunciar('Link copiado'); setTimeout(function () { b.textContent = 'Copiar link'; }, 2000); };
        var fallback = function () { var t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (x) { prompt('Copie o link:', url); } t.remove(); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(ok, fallback); else fallback();
        return;
      }
      atualizar();
    });
    render();
  }).catch(function (e) { console.warn('Duelo indisponível:', e); });
})();
