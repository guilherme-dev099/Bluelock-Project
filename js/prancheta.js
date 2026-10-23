/* "Prancheta do Ego" (prancheta.html?f=433&e=gagamaru,chigiri,…): monte seu 11, veja a química real (vínculos das fichas) e desafie outro 11
   numa série de 5 x1 setoriais com semente. Química, Geral e força são estimados pelo site. */
(function () {
  'use strict';
  var BL = window.BL, M = window.BLX1, T = BL && BL.TIMES, raiz = document.querySelector('.pr');
  if (!BL || !M || !T || !BL.grafo || !raiz) return;
  var esc = BL.esc, $ = function (s) { return raiz.querySelector(s); }, FORM = T.FORM;
  var fmt = function (x) { return String(Math.round(x * 10) / 10).replace('.', ','); };
  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    var jog = todos.filter(function (p) { return p.jogador; });
    var adj = BL.grafo(todos).adj;
    var qs = new URLSearchParams(location.search);
    var f = FORM[qs.get('f')] ? qs.get('f') : '433';
    var problemas = [];
    if (qs.get('f') && !FORM[qs.get('f')]) problemas.push('formação “' + qs.get('f') + '” não existe (usamos 4-3-3)');
    var esc11 = parseIds(qs.get('e'), problemas);
    var vaga = -1, linhasAntes = {};
    raiz.classList.add('pronto'); BL.avisoVersao(raiz);
    if (problemas.length) BL.avisoUrl(raiz, 'Ajustamos este link: ' + problemas.join('; ') + '.');
    /* lê a escalação do link: ignora ids desconhecidos, de staff e repetidos (e conta o que ignorou) */
    function parseIds(s, prob) {
      var vistos = {}, ruim = 0, staff = 0, rep = 0;
      var l = (s || '').split(',').slice(0, 11).map(function (id) {
        if (!id || id === '-') return null;
        if (!por[id]) { ruim++; return null; }
        if (!por[id].jogador) { staff++; return null; }
        if (vistos[id]) { rep++; return null; }
        vistos[id] = 1; return por[id];
      });
      while (l.length < 11) l.push(null);
      if (prob) {
        if (ruim) prob.push(ruim + (ruim > 1 ? ' nomes que não existem' : ' nome que não existe') + ' nas fichas');
        if (staff) prob.push(staff + (staff > 1 ? ' membros' : ' membro') + ' da comissão (só jogadores entram em campo)');
        if (rep) prob.push(rep + (rep > 1 ? ' jogadores repetidos' : ' jogador repetido'));
        if (ruim || staff || rep) prob.push('as vagas ficaram livres');
      }
      return l;
    }
    var ids = function (l) { return l.map(function (p) { return p ? p.id : '-'; }).join(','); };
    var semente = qs.get('seed') || null, vsLink = qs.get('vs') || '';
    var url = function (comSerie) { return '?f=' + f + '&e=' + ids(esc11) + (comSerie !== false && semente ? '&seed=' + encodeURIComponent(semente) + (vsLink ? '&vs=' + encodeURIComponent(vsLink) : '') : '') + (BL.versao() ? '&v=' + BL.versao() : ''); };
    var curtoN = function (p) { return BL.sobrenome(p); };
    function grupoDe(re, fase) { return jog.filter(function (p) { return p.fases.some(function (x) { return x.fase === fase && re.test(x.time); }); }); }
    var PRESETS = {
      dados: { rot: 'Montar com os dados', lista: function () { return jog; } },
      'time-z': { rot: 'Time Z', lista: function () { return grupoDe(/^Time Z\b/, '1ª Seleção'); } },
      eleven: { rot: 'Blue Lock Eleven', lista: function () { return grupoDe(/Blue Lock Eleven/, 'Blue Lock × Sub-20'); } },
      bastard: { rot: 'Bastard München', lista: function () { return grupoDe(/Bastard München/, 'Neo Egoist League'); } }
    };

    function render(anim) {
      var F = FORM[f], campo = $('.pr-vagas'), svg = $('.linhas-quimica');
      [].forEach.call(raiz.querySelectorAll('.pr-f input'), function (r) { r.checked = r.value === f; });
      campo.innerHTML = F.v.map(function (v, i) {
        var p = esc11[i], n = p ? T.nota(p, v) : 0;
        return '<li style="left:' + F.xy[i][0] + '%;top:' + F.xy[i][1] + '%"><button type="button" class="vaga' + (p ? ' cheia' : '') + (n === 2 ? ' fora' : '') + '" data-vaga="' + i + '" aria-haspopup="dialog" aria-label="' + v + ', ' + (p ? esc(p.nome) + (n === 2 ? ', fora de posição' : '') : 'vazio') + '">' +
          (p ? '<img src="' + esc(BL.thumb(p)) + '" alt="" width="40" height="40">' : '<span class="vaga-mais" aria-hidden="true">+</span>') + '<span class="vaga-v">' + v + '</span>' + (p ? '<span class="vaga-n">' + esc(curtoN(p)) + '</span>' : '') + '</button></li>';
      }).join('');
      var q = T.quimica(esc11.map(function (p) { return p && p.id; }), adj), pos = {};
      esc11.forEach(function (p, i) { if (p) pos[p.id] = F.xy[i]; });
      var agora = {};
      svg.innerHTML = q.pares.map(function (x) {
        var k = x.a < x.b ? x.a + x.b : x.b + x.a; agora[k] = 1;
        return '<line x1="' + pos[x.a][0] + '" y1="' + pos[x.a][1] + '" x2="' + pos[x.b][0] + '" y2="' + pos[x.b][1] + '" style="--w:' + x.w + '"' + (anim && !linhasAntes[k] ? ' class="nova"' : '') + '></line>';
      }).join('');
      linhasAntes = agora;
      var cheios = esc11.filter(Boolean), media = cheios.length ? cheios.reduce(function (s, p) { return s + T.ovr(p); }, 0) / cheios.length : 0;
      var base = {}; cheios.forEach(function (p) { var fx = p.fases.filter(function (x) { return x.fase === 'Neo Egoist League'; })[0]; var c = fx && fx.times[0] ? fx.times[0] : 'sem clube na NEL'; base[c] = (base[c] || 0) + 1; });
      $('.pr-painel-num').innerHTML = '<li><b>' + fmt(q.total) + '</b> química estimada</li><li><b>' + (cheios.length ? Math.round(media) : '—') + '</b> Geral médio estimado</li><li><b>' + cheios.length + '/11</b> escalados</li>';
      $('.pr-base').innerHTML = Object.keys(base).sort(function (a, b) { return base[b] - base[a]; }).map(function (c) { return '<li>' + esc(c) + ' <b>' + base[c] + '</b></li>'; }).join('') || '<li>—</li>';
      $('.pr-quim').innerHTML = q.pares.length ? q.pares.sort(function (a, b) { return b.w - a.w; }).map(function (x) {
        return '<li><b>' + esc(curtoN(por[x.a])) + ' ↔ ' + esc(curtoN(por[x.b])) + '</b> <small>+' + fmt(x.w) + '</small>: ' + x.lacos.map(function (l) { return esc(BL.lacoTxt(l)); }).join('; ') + '</li>';
      }).join('') : '<li class="vazio">Nenhum vínculo entre os escalados ainda.</li>';
      $('.pr-escal').innerHTML = F.v.map(function (v, i) { var p = esc11[i]; return '<li><b>' + v + '</b> ' + (p ? esc(p.nome) + (T.nota(p, v) === 2 ? ' <small>(fora de posição)</small>' : '') : '<span class="vazio">vazio</span>') + '</li>'; }).join('');
      $('[data-acao="desafiar"]').disabled = cheios.length < 11;
      $('.pr-desafio-msg').textContent = cheios.length < 11 ? 'Complete os 11 para desafiar.' : '';
      try { history.replaceState(null, '', url()); } catch (e) {}
    }
    /* ----- escolha da vaga (dialog nativo: foco preso e volta à vaga) ----- */
    var dlg = $('.pr-dlg'), inp = $('#pr-busca');
    var cand = function () {
      var v = FORM[f].v[vaga], usados = esc11.map(function (p, i) { return p && i !== vaga ? p.id : null; });
      return jog.filter(function (p) { return usados.indexOf(p.id) < 0; }).sort(function (a, b) { return T.nota(a, v) - T.nota(b, v) || T.ovr(b) - T.ovr(a) || a.nome.localeCompare(b.nome); });
    };
    BL.combobox(inp, $('#pr-busca-lista'), { fonte: cand, abrirNoFoco: true, limite: 80,
      sub: function (p) { var v = FORM[f].v[vaga], n = T.nota(p, v); return ((p.posicoes || [])[0] || 'sem posição') + (n === 2 ? ' · fora de posição' : n === 1 ? ' · posição secundária' : ''); },
      extra: function (p) { return '<em title="Geral estimado">' + T.ovr(p) + '</em>'; },
      escolher: function (p) { colocar(vaga, p); dlg.close(); } });
    function abrir(i) {
      vaga = i; var v = FORM[f].v[i];
      $('#pr-dlg-t').textContent = 'Escolher ' + T.NOME[v] + ' (' + v + ')';
      $('[data-acao="esvaziar"]').hidden = !esc11[i];
      dlg.showModal(); inp.value = ''; inp.focus();
    }
    dlg.addEventListener('close', function () { var b = raiz.querySelector('.vaga[data-vaga="' + vaga + '"]'); if (b) b.focus(); });
    function colocar(i, p) {
      var antes = T.quimica(esc11.map(function (x) { return x && x.id; }), adj).total;
      esc11[i] = p; semente = null; $('.pr-res').hidden = true; render(true);
      var depois = T.quimica(esc11.map(function (x) { return x && x.id; }), adj).total;
      if (p) {
        var lacos = []; esc11.forEach(function (o) { if (o && o !== p && adj[p.id][o.id]) adj[p.id][o.id].forEach(function (l) { var t = l.time; if (lacos.indexOf(t) < 0) lacos.push(t); }); });
        BL.anunciar(p.nome + ' entrou como ' + FORM[f].v[i] + (T.nota(p, FORM[f].v[i]) === 2 ? ', fora de posição' : '') + '. Química ' + (depois >= antes ? '+' : '') + fmt(depois - antes) + (lacos.length ? ': ' + lacos.join(', ') : '') + '.');
      } else BL.anunciar('Vaga esvaziada. Química ' + fmt(depois) + '.');
    }
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vaga]'); if (b) { abrir(+b.dataset.vaga); return; }
      b = e.target.closest('[data-acao],[data-preset]'); if (!b) return;
      if (b.dataset.preset) {
        var P = PRESETS[b.dataset.preset]; esc11 = T.escalar(P.lista(), f); semente = null; $('.pr-res').hidden = true; render(true);
        BL.anunciar(P.rot + ': ' + esc11.filter(Boolean).length + ' escalados. Química estimada ' + fmt(T.quimica(esc11.map(function (x) { return x && x.id; }), adj).total) + '.');
      }
      var a = b.dataset.acao;
      if (a === 'esvaziar') { colocar(vaga, null); dlg.close(); }
      if (a === 'fechar') dlg.close();
      if (a === 'limpar') { esc11 = new Array(11).fill(null); semente = null; $('.pr-res').hidden = true; render(); BL.anunciar('Prancheta limpa'); }
      if (a === 'copiar') BL.copiar(BL.urlPublica('prancheta.html', url(false)), b);
      if (a === 'copiar-serie') BL.copiar(BL.urlPublica('prancheta.html', url()), b);
      if (a === 'desafiar') desafiar();
      if (a === 'revanche') desafiar(true);
    });
    raiz.addEventListener('change', function (e) {
      if (e.target.name !== 'f') return;
      var antigo = FORM[f].v, novo = FORM[e.target.value].v, l = esc11.filter(Boolean);
      f = e.target.value;
      /* reaproveita os escalados: cada um vai para a vaga mais compatível da nova formação */
      esc11 = l.length ? T.escalar(l, f) : new Array(11).fill(null); semente = null; $('.pr-res').hidden = true; render(true);
      BL.anunciar('Formação ' + FORM[f].rot);
      void antigo; void novo;
    });
    /* ----- Desafiar: série de 5 x1 setoriais ----- */
    if (vsLink) $('#pr-vs').value = vsLink;
    function rival() {
      var vs = $('#pr-vs').value.trim(); vsLink = '';
      if (vs) {
        try { var u = new URL(vs, location.href), f2 = FORM[u.searchParams.get('f')] ? u.searchParams.get('f') : '433', e2 = parseIds(u.searchParams.get('e')); if (e2.filter(Boolean).length === 11) { vsLink = vs; return { nome: 'Time do link', l: e2, f: f2 }; } } catch (x) {}
        var m = 'O link do amigo é inválido ou não tem 11 jogadores válidos; a série foi contra um 11 sorteado.';
        BL.avisoUrl($('.pr-desafio'), m); BL.anunciar(m);
      }
      var rnd = M.rng(semente + ':rival'), meus = esc11.map(function (p) { return p.id; });
      var pool = jog.filter(function (p) { return meus.indexOf(p.id) < 0; }).map(function (p) { return { p: p, k: rnd() }; }).sort(function (a, b) { return a.k - b.k; }).slice(0, 26).map(function (x) { return x.p; });
      var fs = Object.keys(FORM), f2 = fs[Math.floor(rnd() * fs.length)];
      return { nome: '11 sorteado', l: T.escalar(pool, f2), f: f2 };
    }
    function desafiar(nova, foco) {
      if (esc11.filter(Boolean).length < 11) return;
      if (!semente || nova) semente = M.novaSemente();
      var R = rival(), s = T.serie(esc11, R.l.filter(Boolean), semente), va = s.filter(function (x) { return x.venc === 0; }).length;
      var box = $('.pr-res'), v = BL.versao() ? '&v=' + BL.versao() : '';
      box.hidden = false;
      box.innerHTML = '<h2 tabindex="-1">' + (va >= 3 ? '🏆 Seu 11 vence a série por ' : 'Derrota na série por ') + va + ' × ' + (5 - va) + '</h2>' +
        '<p class="pr-rival">Contra: <b>' + esc(R.nome) + '</b> (' + esc(FORM[R.f].rot) + '): ' + R.l.filter(Boolean).map(function (p) { return esc(curtoN(p)); }).join(', ') + '</p>' +
        '<ol class="pr-serie">' + s.map(function (x) {
          var link = 'duelo.html?a=' + x.a.id + '&b=' + x.b.id + '&seed=' + encodeURIComponent(x.s) + v + '&auto=1';
          return '<li class="' + (x.venc === 0 ? 'ok' : 'nao') + '"><span class="pr-s-rot">' + esc(x.rot) + '</span> <a href="' + esc(link) + '" aria-label="' + esc(x.a.nome + ' ' + x.g[0] + ' a ' + x.g[1] + ' ' + x.b.nome + '. ' + (x.venc === 0 ? 'Vitória sua' : 'Vitória do rival') + '. Abre o x1.') + '"><b>' + esc(curtoN(x.a)) + '</b> ' + x.g[0] + ' × ' + x.g[1] + ' <b>' + esc(curtoN(x.b)) + '</b>' + (x.ouro ? ' <small>(gol de ouro)</small>' : '') + '</a> <span aria-hidden="true">' + (x.venc === 0 ? '✓' : '✗') + '</span></li>';
        }).join('') + '</ol><p class="cp-aviso">Série simulada pelo site com atributos estimados (não oficiais). Semente <code>' + esc(semente) + '</code>.</p>' +
        '<div class="x1-botoes"><button type="button" class="btn btn-2" data-acao="revanche">↻ Nova série</button><button type="button" class="btn btn-2" data-acao="copiar-serie">Copiar link da série</button></div>';
      try { history.replaceState(null, '', url()); } catch (e) {}
      if (foco !== false) box.querySelector('h2').focus();
      if (BL.voz && BL.voz.on) BL.voz.falar((va >= 3 ? 'Seu time vence a série por ' : 'Seu time perde a série por ') + va + ' a ' + (5 - va));
      BL.anunciar((va >= 3 ? 'Vitória' : 'Derrota') + ' na série por ' + va + ' a ' + (5 - va) + '.');
    }
    /* sem escalação no link: abre com o 11 "Com os dados" (todos na posição da ficha); "Limpar" persiste porque grava e=-,-,… */
    if (!qs.has('e')) esc11 = T.escalar(PRESETS.dados.lista(), f);
    /* ?com=<id> (link "Escalar na Prancheta" das fichas): o personagem entra na vaga mais compatível do 11 */
    var com = por[qs.get('com')];
    if (qs.get('com') && (!com || !com.jogador)) BL.avisoUrl(raiz, 'Só jogadores entram em campo: “' + qs.get('com') + '” não é um jogador das fichas.');
    else if (com && esc11.indexOf(com) < 0) {
      var V = FORM[f].v, best = 0;
      V.forEach(function (v, i) { var a = T.nota(com, v), b = T.nota(com, V[best]); var oa = esc11[i] ? T.ovr(esc11[i]) : -1, ob = esc11[best] ? T.ovr(esc11[best]) : -1; if (a < b || (a === b && oa < ob)) best = i; });
      esc11[best] = com;
      setTimeout(function () { BL.anunciar(com.nome + ' entrou como ' + V[best] + '.'); }, 400);
    }
    render();
    /* link de série (?seed=…): refaz a mesma série sem roubar o foco */
    if (semente && esc11.filter(Boolean).length === 11) desafiar(false, false);
  }).catch(function (e) { console.warn('Prancheta indisponível:', e); });
})();
