/* "Quem é o egoísta?" — desafio diário (egoista.html). Um personagem secreto por dia (fuso de São Paulo), igual para todos,
   escolhido de forma determinística entre os jogadores com dados suficientes. Todas as pistas comparam campos das fichas. */
(function () {
  'use strict';
  var BL = window.BL, raiz = document.querySelector('.dd');
  if (!BL || !raiz || !BL.combobox) return;
  var esc = BL.esc, norm = BL.norm, MAX = 8, INICIO = '2026-10-23';
  var $ = function (s) { return raiz.querySelector(s); };
  var CATN = { protagonistas: 'Protagonista', bl: 'Blue Lock', sub20: 'Sub-20', nel: 'NEL', selecoes: 'Seleção estrangeira', staff: 'Staff', outros: 'Outros' };
  var LINHA = [[/^goleiro|keeper/, 'gol'], [/^zagueiro|^defensor|center back/, 'defesa'], [/^lateral|^ala|side back|wing back/, 'defesa'], [/^volante/, 'meio'], [/^meia/, 'meio'], [/^ponta|winger/, 'ataque'], [/^atacante|^centroavante|striker|forward/, 'ataque']];
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var fase = function (p, n) { var f = p.fases.filter(function (x) { return x.fase === n; })[0]; return f && f.times[0] ? f.times[0] : null; };
  var pos0 = function (p) { return (p.posicoes || [])[0] || ''; };
  var linha = function (pos) { pos = norm(pos); for (var i = 0; i < LINHA.length; i++) if (LINHA[i][0].test(pos)) return LINHA[i][1]; return null; };
  /* B6: "—" contra "—" (os dois sem registro) é neutro, não "igual" */
  function cmpFase(a, b) { return !a && !b ? 'na' : (a === b ? 'ok' : 'nao'); }
  function comparar(g, s) {
    var ka = {}; (g.armas || []).forEach(function (a) { ka[BL.chaveArma(a)] = 1; });
    var pg = pos0(g), ps = pos0(s);
    return {
      cat: g.categoria === s.categoria ? 'ok' : 'nao',
      pos: norm(pg) === norm(ps) ? 'ok' : (linha(pg) && linha(pg) === linha(ps) ? 'perto' : 'nao'),
      nel: cmpFase(fase(g, 'Neo Egoist League'), fase(s, 'Neo Egoist League')),
      sel1: cmpFase(fase(g, '1ª Seleção'), fase(s, '1ª Seleção')),
      rk: !g.rankingFinal || !s.rankingFinal ? 'na' : g.rankingFinal === s.rankingFinal ? 'ok' : (s.rankingFinal < g.rankingFinal ? 'melhor' : 'pior'),
      armas: (s.armas || []).filter(function (a) { return ka[BL.chaveArma(a)]; }).length
    };
  }
  function hoje() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  var ler = function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  var gravar = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  BL.personagens().then(function (todos) {
    var pool = todos.filter(function (p) { return p.jogador && pos0(p) && (p.rankingFinal || fase(p, 'Neo Egoist League') || fase(p, '1ª Seleção')); })
                    .sort(function (a, b) { return a.id < b.id ? -1 : 1; });                 // ordem estável
    var por = {}; pool.forEach(function (p) { por[p.id] = p; });
    var qs = new URLSearchParams(location.search), treino = qs.get('treino');
    /* B1: calendário fixo (js/desafio-calendario.js), só cresce no fim: dias passados e o de hoje nunca mudam */
    var CAL = window.BL_DESAFIO && BL_DESAFIO.ids && BL_DESAFIO.ids.length ? BL_DESAFIO : null;
    if (CAL) INICIO = CAL.inicio;
    var dia = hoje(), n = Math.floor((Date.parse(dia) - Date.parse(INICIO)) / 864e5) + 1;
    function doDia(k) {
      if (!CAL) return pool[hash('bl-' + dia) % pool.length];
      for (var t = 0; t < CAL.ids.length; t++) { var id = CAL.ids[(((k - 1 + t) % CAL.ids.length) + CAL.ids.length) % CAL.ids.length]; if (por[id]) return por[id]; }
      return pool[0];
    }
    var secreto = treino ? pool[hash('treino-' + treino) % pool.length] : doDia(n);
    var chave = treino ? null : 'bl-dd-' + dia;
    var palpites = (chave ? ler(chave, []) : []).filter(function (id) { return por[id]; });
    var tbody = $('.dd-grade tbody'), fim = $('.dd-fim'), status = $('.dd-status'), inp = $('#dd-palpite');
    $('.dd-n').textContent = treino ? 'treino' : n;
    $('.dd-pool').textContent = pool.length;
    if (treino) { $('.dd-modo').hidden = false; document.title = 'Treino · Quem é o egoísta? | Blue Lock'; }
    raiz.classList.add('pronto');

    function celula(cls, rot, txt, sr, i) {
      return '<td class="' + cls + '" data-rot="' + rot + '" style="--i:' + i + '">' + txt + (sr ? ' <span class="sr-only">(' + sr + ')</span>' : '') + '</td>';
    }
    var SR = { ok: 'igual', nao: 'diferente', perto: 'mesma linha', na: 'os dois sem registro' };
    var ICO = { ok: '🟦', nao: '⬛', perto: '🟨', na: '⬜' };
    function linhaHtml(g, nova) {
      var c = comparar(g, secreto), nel = fase(g, 'Neo Egoist League'), s1 = fase(g, '1ª Seleção');
      var rkTxt = g.rankingFinal ? '#' + g.rankingFinal + (c.rk === 'melhor' ? ' <span aria-hidden="true">⬆</span>' : c.rk === 'pior' ? ' <span aria-hidden="true">⬇</span>' : '') : '—';
      var rkSr = { ok: 'igual', melhor: 'o secreto tem ranking melhor', pior: 'o secreto tem ranking pior', na: 'sem comparação' }[c.rk];
      var acertou = g.id === secreto.id;
      return '<tr class="' + (nova ? 'nova' : '') + (acertou ? ' certo' : '') + '"><th scope="row"><img src="' + esc(BL.thumb(g)) + '" alt="" width="36" height="36"> ' + esc(g.nome) + '</th>' +
        celula(c.cat, 'Categoria', esc(CATN[g.categoria] || g.categoria), SR[c.cat], 1) +
        celula(c.pos, 'Posição', esc(pos0(g)), SR[c.pos], 2) +
        celula(c.nel, 'Clube NEL', esc(nel || '—'), SR[c.nel], 3) +
        celula(c.sel1, '1ª Seleção', esc(s1 || '—'), SR[c.sel1], 4) +
        celula(c.rk === 'ok' ? 'ok' : (c.rk === 'na' ? 'na' : 'rk-dir'), 'Ranking', rkTxt, rkSr, 5) +
        celula(acertou ? 'ok' : (c.armas ? 'perto' : 'nao'), 'Armas em comum', String(c.armas), c.armas === 1 ? '1 Arma em comum' : c.armas + ' Armas em comum', 6) + '</tr>';
    }
    function frase(g) {
      if (g.id === secreto.id) return g.nome + ': acertou!';
      var c = comparar(g, secreto);
      return g.nome + ': categoria ' + SR[c.cat] + ', posição ' + SR[c.pos] + ', clube na NEL ' + SR[c.nel] + ', time na 1ª Seleção ' + SR[c.sel1] +
        ', ranking: ' + { ok: 'igual', melhor: 'o secreto é melhor', pior: 'o secreto é pior', na: 'sem comparação' }[c.rk] + ', ' + c.armas + (c.armas === 1 ? ' Arma' : ' Armas') + ' em comum. ' +
        (MAX - palpites.length) + ' tentativas restantes.';
    }
    function emojis() {
      return palpites.map(function (id) {
        var g = por[id], c = comparar(g, secreto);
        if (id === secreto.id) return '🟦🟦🟦🟦🟦🟦';
        return ICO[c.cat] + ICO[c.pos] + ICO[c.nel] + ICO[c.sel1] + ({ ok: '🟦', melhor: '⬆️', pior: '⬇️', na: '⬜' })[c.rk] + (c.armas ? '🟨' : '⬛');
      }).join('\n');
    }
    var albumNova = false;
    var venceu = function () { return palpites.indexOf(secreto.id) >= 0; };
    var acabou = function () { return venceu() || palpites.length >= MAX; };
    function stats() { return ler('bl-dd-stats', { jogos: 0, vitorias: 0, seq: 0, melhor: 0, dist: [0, 0, 0, 0, 0, 0, 0, 0], ultimoDia: null, ultimaVitoria: null }); }
    function registrar() {
      if (treino) return;
      var s = stats(); if (s.ultimoDia === dia) return;
      s.jogos++; s.ultimoDia = dia;
      if (venceu()) {
        var ontem = new Date(Date.parse(dia) - 864e5).toISOString().slice(0, 10);
        s.vitorias++; s.seq = s.ultimaVitoria === ontem ? s.seq + 1 : 1; s.melhor = Math.max(s.melhor, s.seq); s.ultimaVitoria = dia;
        s.dist[palpites.length - 1]++;
      } else s.seq = 0;
      gravar('bl-dd-stats', s);
    }
    function mostrarFim(foco) {
      var s = stats(), ok = venceu(), maxD = Math.max.apply(null, s.dist.concat([1]));
      var p = secreto;
      fim.innerHTML = '<h2 tabindex="-1">' + (ok ? '🏆 Acertou em ' + palpites.length + ' de ' + MAX + '!' : 'Não foi dessa vez. O egoísta era…') + '</h2>' +
        '<div class="dd-rev"><img src="' + esc(p.img) + '" alt="" width="480" height="552"><div><p class="cat-tag">' + esc(CATN[p.categoria]) + '</p><h3><a href="' + esc(p.url) + '">' + esc(p.nome) + '</a></h3>' +
        '<p>' + esc(pos0(p)) + (fase(p, 'Neo Egoist League') ? ' · ' + esc(fase(p, 'Neo Egoist League')) + ' (NEL)' : '') + (p.rankingFinal ? ' · ranking #' + p.rankingFinal : '') + '</p>' +
        '<div class="x1-botoes"><button type="button" class="btn" data-acao="compartilhar">Compartilhar resultado</button><a class="btn btn-2" href="' + esc(p.url) + '">Ver ficha</a><a class="btn btn-2" href="duelo.html?a=' + esc(p.id) + '">⚔ Desafiar no x1</a><a class="btn btn-2" href="egoista.html?treino=' + Math.random().toString(36).slice(2, 7) + '">Modo treino</a></div>' +
        (albumNova ? '<p class="album-nova">🃏 Figurinha nova no <a href="album.html">Álbum do Ego</a>: ' + esc(p.nome) + '</p>' : '') +
        '<pre class="dd-emojis" aria-hidden="true">' + esc(emojis()) + '</pre></div></div>' +
        (treino ? '<p class="dd-prox">Modo treino: não conta nas estatísticas. <a href="egoista.html">Voltar ao desafio do dia</a></p>' :
        '<h3 class="dd-est-t">Suas estatísticas (neste navegador)</h3><ul class="dd-est"><li><b>' + s.jogos + '</b> jogos</li><li><b>' + (s.jogos ? Math.round(s.vitorias / s.jogos * 100) : 0) + '%</b> vitórias</li><li><b>' + s.seq + '</b> sequência</li><li><b>' + s.melhor + '</b> melhor sequência</li></ul>' +
        '<ol class="dd-dist" aria-label="Vitórias por número de tentativas">' + s.dist.map(function (v, i) { return '<li><span>' + (i + 1) + '</span><i style="--v:' + Math.round(v / maxD * 100) + '%"' + (ok && palpites.length === i + 1 ? ' class="hoje"' : '') + '></i><b>' + v + '</b><span class="sr-only"> vitórias em ' + (i + 1) + '</span></li>'; }).join('') + '</ol>' +
        '<p class="dd-prox">Novo egoísta à meia-noite (horário de Brasília). <span class="dd-cont"></span></p>');
      fim.hidden = false; inp.disabled = true; $('.dd-busca').hidden = true;
      status.textContent = ok ? 'Resolvido!' : 'Fim das tentativas.';
      if (foco) fim.querySelector('h2').focus();
      contagem();
    }
    var tCont;
    function contagem() {
      var el = fim.querySelector('.dd-cont'); if (!el) return;
      if (!treino && hoje() !== dia) { el.innerHTML = 'Novo desafio disponível · <button type="button" class="btn btn-2" data-acao="recarregar">Recarregar</button>'; return; }
      var agora = new Date(), sp = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      var falta = (24 * 3600) - (sp.getHours() * 3600 + sp.getMinutes() * 60 + sp.getSeconds());
      var h = Math.floor(falta / 3600), m = Math.floor(falta % 3600 / 60);
      el.textContent = 'Faltam ' + h + ' h ' + m + ' min.';
      clearTimeout(tCont); tCont = setTimeout(contagem, 30000);
    }
    function atualizarStatus() {
      if (!acabou()) status.textContent = 'Tentativa ' + (palpites.length + 1) + ' de ' + MAX + '.';
    }
    function palpitar(g) {
      if (acabou() || palpites.indexOf(g.id) >= 0) return;
      palpites.push(g.id); if (chave) gravar(chave, palpites);
      tbody.insertAdjacentHTML('beforeend', linhaHtml(g, !BL.reduce));
      BL.anunciar(frase(g));
      if (acabou()) { registrar(); if (venceu() && !treino && window.BL_ALBUM) albumNova = BL_ALBUM.ganhar(secreto.id, 'desafio', true); setTimeout(function () { mostrarFim(true); }, BL.reduce ? 0 : 700); }
      else { atualizarStatus(); inp.focus(); }
    }
    if (!treino) setInterval(function () {
      if (hoje() !== dia && !raiz.querySelector('.dd-virou')) {
        status.insertAdjacentHTML('beforebegin', '<p class="dd-virou" role="status">Já é outro dia em São Paulo: novo desafio disponível. <button type="button" class="btn btn-2" data-acao="recarregar">Recarregar</button></p>');
      }
    }, 30000);
    tbody.innerHTML = palpites.map(function (id) { return linhaHtml(por[id], false); }).join('');
    atualizarStatus();
    if (acabou()) mostrarFim(false);

    BL.combobox(inp, $('#dd-lista'), {
      fonte: function () { return pool; },
      filtro: function (p) { return palpites.indexOf(p.id) < 0; },
      sub: function (p) { return pos0(p) + (fase(p, 'Neo Egoist League') ? ' · ' + fase(p, 'Neo Egoist League') : ''); },
      escolher: palpitar, limite: 40
    });
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return;
      if (b.dataset.acao === 'compartilhar') {
        var txt = 'Blue Lock · Quem é o egoísta? ' + (treino ? '(treino)' : '#' + n) + ' ' + (venceu() ? palpites.length : 'X') + '/' + MAX + '\n' + emojis() + '\n' + BL.urlPublica('egoista.html', '');
        BL.copiar(txt, b, 'Resultado copiado');
        BL.anunciar(venceu() ? 'Resultado copiado: acertou em ' + palpites.length + ' de ' + MAX : 'Resultado copiado: não acertou');
      }
      if (b.dataset.acao === 'recarregar') location.reload();
      if (b.dataset.acao === 'treino') location.href = 'egoista.html?treino=' + Math.random().toString(36).slice(2, 7);
    });
  }).catch(function (e) { console.warn('Desafio indisponível:', e); });
})();
