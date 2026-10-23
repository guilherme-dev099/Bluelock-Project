/* Liga NEL simulada: os 5 clubes da Neo Egoist League (elencos das fichas) em pontos corridos, ida e volta (10 rodadas, 20 jogos).
   Cada jogo = série de 5 x1 setoriais (BL.TIMES.serie, a mesma do "Desafiar" da Prancheta), com semente. Simulação do site, não a obra. */
(function () {
  'use strict';
  var BL = window.BL, M = window.BLX1; if (!BL || !M || !BL.TIMES) return;
  var raiz = document.querySelector('.lg'); if (!raiz) return;
  var esc = BL.esc, $ = function (s) { return raiz.querySelector(s); };
  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    /* elencos: fase "Neo Egoist League" → clube (só quem joga) */
    var clubes = {};
    todos.forEach(function (p) {
      if (!p.jogador) return;
      p.fases.forEach(function (f) { if (f.fase === 'Neo Egoist League' && f.times && f.times[0]) (clubes[f.times[0]] = clubes[f.times[0]] || []).push(p); });
    });
    var nomes = Object.keys(clubes).filter(function (c) { return clubes[c].length >= 5; }).sort();
    $('.lg-elencos').innerHTML = nomes.map(function (c) {
      return '<li><details><summary><b>' + esc(c) + '</b> <small>' + clubes[c].length + ' jogadores nas fichas</small></summary><ul>' + clubes[c].slice().sort(function (a, b) { return a.ordem - b.ordem; }).map(function (p) {
        return '<li><a href="' + esc(p.url) + '"><img src="' + esc(BL.thumb(p)) + '" alt="" width="32" height="32" loading="lazy">' + esc(p.nome) + '</a> <small>' + esc((p.posicoes || [])[0] || '') + '</small></li>';
      }).join('') + '</ul></details></li>';
    }).join('');
    /* tabela de jogos: método do círculo (5 clubes + folga), turno e returno */
    function calendario() {
      var t = nomes.concat([null]), n = t.length, rod = [];
      for (var r = 0; r < n - 1; r++) {
        var jogos = [];
        for (var i = 0; i < n / 2; i++) { var a = t[i], b = t[n - 1 - i]; if (a && b) jogos.push(r % 2 ? [b, a] : [a, b]); }
        rod.push(jogos); t.splice(1, 0, t.pop());
      }
      return rod.concat(rod.map(function (js) { return js.map(function (j) { return [j[1], j[0]]; }); }));
    }
    var qs = new URLSearchParams(location.search), seed = qs.get('seed'), temp = null, mostradas = 0, timer = null, pausado = false;
    function simular(sd) {
      var rods = calendario().map(function (js, r) {
        return js.map(function (j) {
          var s = BL.TIMES.serie(clubes[j[0]], clubes[j[1]], sd + ':lg:' + r + ':' + j[0] + ':' + j[1]);
          var va = s.filter(function (x) { return x.venc === 0; }).length;
          return { a: j[0], b: j[1], placar: [va, 5 - va], serie: s };
        });
      });
      return { seed: sd, rodadas: rods };
    }
    function tabela(n) {
      var tab = {}, art = {};
      nomes.forEach(function (c) { tab[c] = { c: c, p: 0, j: 0, v: 0, d: 0, xp: 0, xc: 0, gp: 0, gc: 0 }; });
      temp.rodadas.slice(0, n).forEach(function (js) {
        js.forEach(function (j) {
          var A = tab[j.a], B = tab[j.b]; A.j++; B.j++;
          A.xp += j.placar[0]; A.xc += j.placar[1]; B.xp += j.placar[1]; B.xc += j.placar[0];
          if (j.placar[0] > j.placar[1]) { A.v++; A.p += 3; B.d++; } else { B.v++; B.p += 3; A.d++; }
          j.serie.forEach(function (x) {
            A.gp += x.g[0]; A.gc += x.g[1]; B.gp += x.g[1]; B.gc += x.g[0];
            [[x.a, x.g[0], j.a], [x.b, x.g[1], j.b]].forEach(function (y) { var o = art[y[0].id] = art[y[0].id] || { p: y[0], c: y[2], g: 0, x1: 0 }; o.g += y[1]; o.x1++; });
          });
        });
      });
      var l = nomes.map(function (c) { return tab[c]; }).sort(function (x, y) { return y.p - x.p || (y.xp - y.xc) - (x.xp - x.xc) || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp || (x.c < y.c ? -1 : 1); });
      var a = Object.keys(art).map(function (k) { return art[k]; }).sort(function (x, y) { return y.g - x.g || x.x1 - y.x1 || x.p.ordem - y.p.ordem; });
      return { l: l, art: a };
    }
    var linkX1 = function (x) { return 'duelo.html?a=' + encodeURIComponent(x.a.id) + '&b=' + encodeURIComponent(x.b.id) + '&seed=' + encodeURIComponent(x.s) + '&v=' + BL.versao(); };
    function jogoHtml(j, r, i) {
      var va = j.placar[0], vb = j.placar[1];
      return '<li class="lg-jogo"><details><summary><span class="lg-c' + (va > vb ? ' venc' : '') + '">' + esc(j.a) + '</span> <b class="lg-pl">' + va + ' × ' + vb + '</b> <span class="lg-c' + (vb > va ? ' venc' : '') + '">' + esc(j.b) + '</span></summary>' +
        '<ol class="lg-serie">' + j.serie.map(function (x) {
          return '<li><small>' + esc(x.rot) + '</small> ' + esc(M.curto(x.a, x.b)) + ' <b>' + x.g[0] + ' × ' + x.g[1] + '</b> ' + esc(M.curto(x.b, x.a)) + (x.ouro ? (x.penalti ? ' <small>(pênalti)</small>' : ' <small>(gol de ouro)</small>') : '') +
            ' <span class="sr-only">— vitória de ' + esc(x.venc === 0 ? j.a : j.b) + '</span> <a href="' + esc(linkX1(x)) + '">ver o x1</a></li>';
        }).join('') + '</ol></details></li>';
    }
    function desenhar() {
      var T = tabela(mostradas), fimT = mostradas >= temp.rodadas.length;
      $('.lg-tab caption').textContent = mostradas ? (fimT ? 'Classificação final' : 'Classificação após a rodada ' + mostradas + ' de ' + temp.rodadas.length) : 'Classificação (antes da 1ª rodada)';
      $('.lg-tab tbody').innerHTML = T.l.map(function (x, i) {
        var sx = x.xp - x.xc;
        return '<tr' + (i === 0 && mostradas ? ' class="lider"' : '') + '><td>' + (i + 1) + '</td><th scope="row">' + esc(x.c) + '</th><td><b>' + x.p + '</b></td><td>' + x.j + '</td><td>' + x.v + '</td><td>' + x.d + '</td><td>' + x.xp + '–' + x.xc + '</td><td>' + (sx > 0 ? '+' : '') + sx + '</td><td>' + x.gp + '</td></tr>';
      }).join('');
      /* só acrescenta as rodadas novas (não fecha o que o usuário abriu nem tira o foco) */
      var ol = $('.lg-rodadas');
      if (ol.children.length > mostradas) ol.innerHTML = '';
      for (var r = ol.children.length; r < mostradas; r++) {
        var js = temp.rodadas[r];
        ol.insertAdjacentHTML('afterbegin', '<li><h3>Rodada ' + (r + 1) + (r === 4 ? ' <small>fim do turno</small>' : '') + '</h3><ul>' + js.map(function (j, i) { return jogoHtml(j, r, i); }).join('') + '</ul><p class="lg-folga">Folga: ' + esc(nomes.filter(function (c) { return !js.some(function (j) { return j.a === c || j.b === c; }); }).join(', ')) + '</p></li>');
      }
      $('.lg-art').innerHTML = T.art.slice(0, 10).map(function (o) {
        return '<li><a href="' + esc(o.p.url) + '"><img src="' + esc(BL.thumb(o.p)) + '" alt="" width="32" height="32" loading="lazy">' + esc(o.p.nome) + '</a> <small>' + esc(o.c) + '</small> <b>' + o.g + '</b> <span class="sr-only">gols em</span><small>(' + o.x1 + ' x1)</small></li>';
      }).join('') || '<li>Ainda sem gols.</li>';
      $('.lg-prog').textContent = 'Rodada ' + mostradas + ' de ' + temp.rodadas.length;
      return T;
    }
    function campeao(T) {
      var c = T.l[0], art = T.art[0], el = $('.lg-fim');
      var nova = window.BL_ALBUM && art ? BL_ALBUM.ganhar(art.p.id, 'liga', true) : false;
      el.innerHTML = '<h2 tabindex="-1">🏆 ' + esc(c.c) + ' é campeão da Liga NEL simulada</h2><p>' + c.p + ' pontos, ' + c.v + ' vitórias em ' + c.j + ' jogos · x1 vencidos ' + c.xp + '–' + c.xc + '. Artilheiro dos x1: <a href="' + esc(art.p.url) + '">' + esc(art.p.nome) + '</a> (' + esc(art.c) + '), ' + art.g + ' gols.</p>' +
        (nova ? '<p class="album-nova">🃏 Figurinha nova no <a href="album.html">Álbum do Ego</a>: ' + esc(art.p.nome) + ' (artilheiro)</p>' : '') +
        '<p class="cp-aviso">Liga simulada pelo site com atributos estimados (não oficiais); não é o resultado da obra. Temporada nº <code>' + esc(temp.seed) + '</code>: o link reproduz exatamente esta liga.</p>' +
        '<div class="x1-botoes"><button type="button" class="btn" data-acao="nova">↻ Nova temporada</button><button type="button" class="btn btn-2" data-acao="copiar">Copiar link da temporada</button></div>';
      el.hidden = false; $('.lg-ctrl').hidden = true;
      el.querySelector('h2').focus();
      BL.anunciar(c.c + ' é campeão da Liga NEL simulada com ' + c.p + ' pontos.');
      if (BL.voz) BL.voz.falar(c.c + ' é campeão da Liga NEL simulada, com ' + c.p + ' pontos. Artilheiro: ' + art.p.nome + ', ' + art.g + ' gols.');
    }
    function passo() {
      if (pausado) return;
      mostradas++; var T = desenhar();
      var lid = T.l[0], txt = 'Rodada ' + mostradas + ': ' + temp.rodadas[mostradas - 1].map(function (j) { return j.a + ' ' + j.placar[0] + ' a ' + j.placar[1] + ' ' + j.b; }).join('; ') + '. Líder: ' + lid.c + ', ' + lid.p + ' pontos.';
      if (mostradas >= temp.rodadas.length) { campeao(T); return; }
      BL.anunciar('Rodada ' + mostradas + '. Líder: ' + lid.c + ', ' + lid.p + ' pontos.');
      if (BL.voz && BL.voz.on) { BL.voz.falar(txt, function () { if (!pausado) { clearTimeout(timer); timer = setTimeout(passo, 400); } }); return; }
      timer = setTimeout(passo, 1600);
    }
    function setPausa(on) {
      pausado = on; clearTimeout(timer); if (on && BL.voz) BL.voz.cancel();
      var b = $('[data-acao="pausar"]'); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '▶ Retomar' : '❚❚ Pausar';
      if (!on && temp && mostradas < temp.rodadas.length) timer = setTimeout(passo, 300);
      BL.anunciar(on ? 'Liga pausada' : 'Liga retomada');
    }
    function pular() { clearTimeout(timer); pausado = false; if (BL.voz) BL.voz.cancel(); mostradas = temp.rodadas.length; campeao(desenhar()); }
    function comecar(sd, instantaneo) {
      seed = sd; temp = simular(sd); mostradas = 0; $('.lg-rodadas').innerHTML = ''; pausado = false; clearTimeout(timer);
      try { history.replaceState(null, '', '?seed=' + encodeURIComponent(sd) + '&v=' + BL.versao()); } catch (e) {}
      $('.lg-ini').hidden = true; $('.lg-temp').hidden = false; $('.lg-fim').hidden = true; $('.lg-ctrl').hidden = false;
      var b = $('[data-acao="pausar"]'); b.setAttribute('aria-pressed', 'false'); b.textContent = '❚❚ Pausar';
      desenhar(); $('#lg-t').focus();
      BL.anunciar('Começa a Liga NEL simulada: ' + nomes.length + ' clubes, ' + temp.rodadas.length + ' rodadas. Espaço pausa.');
      if (BL.voz) BL.voz.falar('Começa a Liga NEL simulada.');
      if (instantaneo) pular(); else timer = setTimeout(passo, 900);
    }
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return; var a = b.dataset.acao;
      if (a === 'comecar') comecar(M.novaSemente());
      if (a === 'pausar') setPausa(!pausado);
      if (a === 'pular') pular();
      if (a === 'nova') comecar(M.novaSemente());
      if (a === 'copiar') BL.copiar(BL.urlPublica('liga.html', '?seed=' + encodeURIComponent(seed) + '&v=' + BL.versao()), b);
    });
    raiz.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Spacebar') && temp && mostradas < temp.rodadas.length && !e.target.closest('button,a,input,summary,select')) { e.preventDefault(); setPausa(!pausado); }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && temp && mostradas < temp.rodadas.length && !pausado) setPausa(true); });
    $('.lg-n').textContent = nomes.length;
    if (seed) { BL.avisoVersao($('.lg-temp')); comecar(seed, true); }
  }).catch(function (e) { console.warn('Liga indisponível:', e); });
})();
