/* Duelo x1: escolha dois personagens e veja um mano a mano lance a lance — duelo.html?a=isagi&b=rin&seed=k3x9
   O motor (atributos estimados + simulação com semente) fica em js/x1-motor.js (window.BLX1). */
(function () {
  'use strict';
  var BL = window.BL, M = window.BLX1, raiz = document.querySelector('.x1');
  if (!BL || !M || !raiz) return;
  var esc = BL.esc, norm = BL.norm, ATR = M.ATR, GOLS = M.GOLS, LANCES = M.LANCES, timeAtual = M.timeAtual;
  var $ = function (s, el) { return (el || raiz).querySelector(s); };

  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    var qs = new URLSearchParams(location.search);
    var staff = $('#x1-staff'), puro = $('#x1-puro'), narrarTudo = $('#x1-narrar');
    staff.checked = qs.get('staff') === '1' || [qs.get('a'), qs.get('b')].some(function (id) { return por[id] && !por[id].jogador; });
    if (puro) puro.checked = qs.get('puro') === '1';
    var atributos = function (p) { return M.atributos(p, puro && puro.checked); };
    var lista = function () { return todos.filter(function (p) { return staff.checked || p.jogador; }); };
    var sel = { a: por[qs.get('a')] || por.isagi, b: por[qs.get('b')] || null };
    if (!sel.b || sel.b === sel.a) sel.b = sel.a.id === 'rin' ? por.isagi : por.rin;
    var semente = qs.get('seed') || null;
    /* R4: nome curto desambiguado (Rin × Sae, gêmeos Wanima…) */
    var nome = function (p) { return M.curto(p, p === sel.a ? sel.b : sel.a); };
    raiz.classList.add('pronto');
    BL.avisoVersao(raiz);
    var elite = $('.x1-elite');
    if (elite) elite.textContent = Object.keys(M.ELITE).map(function (id) { return por[id] ? por[id].nome + ' (+' + M.ELITE[id] + ')' : null; }).filter(Boolean).join(', ');

    function cartao(lado) {
      var p = sel[lado], s = atributos(p), o = sel[lado === 'a' ? 'b' : 'a'], so = atributos(o);
      var el = $('.x1-pick[data-lado="' + lado + '"] .x1-card');
      el.innerHTML = '<div class="x1-foto"><img src="' + esc(p.img) + '" alt="" width="480" height="552"><span class="x1-ovr" title="Geral estimado pelo site (não oficial)"><span class="sr-only">Geral estimado </span>' + s.ovr + '</span></div>' +
        '<h2><a href="' + esc(p.url) + '">' + esc(p.nome) + '</a></h2><p class="pos">' + esc((p.posicoes && p.posicoes[0]) || p.posicao || (p.jogador ? 'Jogador' : 'Staff')) + (timeAtual(p) ? ' · ' + esc(timeAtual(p)) : '') + '</p>' +
        '<ul class="x1-atr" aria-label="Atributos de jogo estimados pelo site, não oficiais">' + ATR.map(function (a) {
          var k = a[0], cls = s[k] > so[k] ? ' class="mais"' : '';
          return '<li' + cls + '><span>' + a[1] + '</span><i style="--v:' + s[k] + '%"></i><b>' + s[k] + '</b></li>';
        }).join('') + '</ul><p class="x1-nota-atr">Atributos de jogo <b>estimados pelo site</b> · não oficiais' + (!(puro && puro.checked) && M.ELITE[p.id] ? ' · inclui ajuste de fã +' + M.ELITE[p.id] : '') + '</p>' +
        ((p.armas || []).length ? '<p class="x1-armas">' + p.armas.slice(0, 4).map(function (x) { return '<span class="chip">' + esc(x.replace(/\s*\([^)]*\)/, '')) + '</span>'; }).join(' ') + '</p>' : '');
      $('#x1-busca-' + lado).value = '';
      $('#x1-busca-' + lado).placeholder = nome(p) + ' · trocar…';
    }
    function ficha() {
      var A = sel.a, B = sel.b, ka = {}, kb = {};
      A.armas.forEach(function (x) { ka[BL.chaveArma(x)] = x; }); B.armas.forEach(function (x) { kb[BL.chaveArma(x)] = x; });
      var comum = Object.keys(ka).filter(function (k) { return k in kb; }).map(function (k) { return ka[k]; });
      var ul = function (l) { return l.length ? l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li class="vazio">Nenhuma</li>'; };
      var linhas = BL.FASES.map(function (fase) {
        var fa = A.fases.filter(function (x) { return x.fase === fase; })[0], fb = B.fases.filter(function (x) { return x.fase === fase; })[0];
        return fa || fb ? '<tr><th scope="row">' + esc(fase) + '</th><td>' + (fa ? esc(fa.time) : '—') + '</td><td>' + (fb ? esc(fb.time) : '—') + '</td></tr>' : '';
      }).join('');
      $('.x1-ficha-corpo').innerHTML = '<div class="armas"><div class="col comum"><h4>Armas em comum</h4><ul>' + ul(comum) + '</ul></div></div>' +
        (linhas ? '<table class="traj"><thead><tr><th scope="col">Fase</th><th scope="col">' + esc(A.nome) + '</th><th scope="col">' + esc(B.nome) + '</th></tr></thead><tbody>' + linhas + '</tbody></table>' : '');
    }
    function url(comSemente) {
      return '?a=' + sel.a.id + '&b=' + sel.b.id + (staff.checked ? '&staff=1' : '') + (puro && puro.checked ? '&puro=1' : '') + (comSemente && semente ? '&seed=' + encodeURIComponent(semente) + (BL.versao() ? '&v=' + BL.versao() : '') : '');
    }
    function render() {
      cartao('a'); cartao('b'); ficha();
      try { history.replaceState(null, '', url(true)); } catch (e) {}
      document.title = nome(sel.a) + ' × ' + nome(sel.b) + ' | Duelo x1 | Blue Lock';
    }
    function mudou() { semente = null; BL.transicao(render); }
    function escolher(lado, p) {
      var outro = lado === 'a' ? 'b' : 'a';
      if (sel[outro].id === p.id) sel[outro] = sel[lado];
      sel[lado] = p; mudou(); BL.anunciar(nome(sel.a) + ' contra ' + nome(sel.b));
    }

    /* busca com fotos: BL.combobox compartilhado (miniaturas 112px) */
    ['a', 'b'].forEach(function (lado) {
      BL.combobox($('#x1-busca-' + lado), $('#x1-lista-' + lado), {
        fonte: lista, prefixo: 'x1-op-' + lado + '-', abrirNoFoco: true, blurAoEscolher: true,
        sub: function (p) { return ((p.posicoes && p.posicoes[0]) || (p.jogador ? '' : 'Staff')) + (timeAtual(p) ? ' · ' + timeAtual(p) : ''); },
        extra: function (p) { return '<em title="Geral estimado">' + atributos(p).ovr + '</em>'; },
        escolher: function (p) { escolher(lado, p); }
      });
    });

    var sortear = function () {
      var l = lista().filter(function (p) { return p.id !== sel.a.id && p.id !== sel.b.id; });
      return l[Math.floor(Math.random() * l.length)];
    };
    staff.addEventListener('change', function () {
      if (!staff.checked) ['a', 'b'].forEach(function (k) { if (!sel[k].jogador) sel[k] = sortear(); });
      semente = null; render();
    });
    if (puro) puro.addEventListener('change', function () { render(); BL.anunciar(puro.checked ? 'Modo puro: sem ajuste de fã' : 'Ajuste de fã ligado'); });

    /* ---------- partida ---------- */
    var arena = $('.x1-arena'), fim = $('.x1-final'), escolha = $('.x1-escolha'), log = $('.x1-log'), timer = null, rapido = false, pausado = false, jogo = null, fila = [];
    var pausaBtn = $('[data-acao="pausar"]');
    /* R2: movimento reduzido tira animação, não acelera o ritmo */
    var espera = function () { return rapido ? 420 : 1050; };
    function lutador(j) {
      return '<img src="' + esc(j.p.img) + '" alt="" width="480" height="552"><h3>' + esc(j.p.nome) + '</h3><p class="x1-flow" hidden>⚡ FLOW</p>';
    }
    function setPausa(on, msg) {
      pausado = on;
      if (pausaBtn) { pausaBtn.setAttribute('aria-pressed', String(on)); pausaBtn.textContent = on ? '▶ Retomar' : '❚❚ Pausar'; }
      clearTimeout(timer);
      if (!on && jogo && fim.hidden) timer = setTimeout(passo, 250);
      arena.classList.toggle('pausado', on);
      if (msg !== false) BL.anunciar(on ? 'Partida pausada' : 'Partida retomada');
    }
    function comecar(nova) {
      if (!semente || nova) semente = M.novaSemente();
      jogo = M.simular(sel.a, sel.b, semente, { puro: puro && puro.checked }); fila = jogo.ev.slice();
      try { history.replaceState(null, '', url(true)); } catch (e) {}
      escolha.hidden = true; fim.hidden = true; arena.hidden = false; $('.x1-ctrl').hidden = false;
      setPausa(false, false); clearTimeout(timer);
      $('.x1-lut.a').innerHTML = lutador(jogo.J[0]); $('.x1-lut.b').innerHTML = lutador(jogo.J[1]);
      $('.x1-pl-a').innerHTML = '<img src="' + esc(BL.thumb(sel.a)) + '" alt="">' + esc(nome(sel.a));
      $('.x1-pl-b').innerHTML = esc(nome(sel.b)) + '<img src="' + esc(BL.thumb(sel.b)) + '" alt="">';
      $('.x1-ga').textContent = '0'; $('.x1-gb').textContent = '0';
      $('.x1-n').textContent = 'Apito inicial'; $('.x1-acao').innerHTML = '<span class="x1-rot">Primeiro a ' + GOLS + ' gols</span>';
      $('.x1-campo').dataset.bola = '';
      log.innerHTML = ''; log.removeAttribute('aria-busy');
      $('.x1-arena h2').focus();
      BL.anunciar('Começa o x1: ' + sel.a.nome + ' contra ' + sel.b.nome + '. Espaço pausa.');
      timer = setTimeout(passo, espera());
    }
    /* R3: log em ordem cronológica (o CSS mostra o mais novo no topo) e sem região viva */
    function linha(txt, cls) { var li = document.createElement('li'); li.className = cls || ''; li.textContent = txt; log.appendChild(li); }
    var lutEl = function (i) { return $('.x1-lut.' + (i ? 'b' : 'a')); };
    function aplicar(e, silencioso) {
      var campo = $('.x1-campo'), falar = !silencioso;
      ['a', 'b'].forEach(function (k) { $('.x1-lut.' + k).classList.remove('ganhou', 'perdeu'); });
      if (e.t === 'lance') {
        $('.x1-n').textContent = (e.ouro ? 'Gol de ouro · ' : '') + 'Lance ' + e.n + (e.ouro ? '' : ' de ' + LANCES);
        campo.dataset.bola = e.quem ? 'b' : 'a';
        $('.x1-acao').innerHTML = '<span class="x1-rot">' + esc(nome(jogo.J[e.quem].p)) + ' parte para cima</span>';
        lutEl(e.quem).classList.add('ataca'); lutEl(1 - e.quem).classList.remove('ataca');
      } else if (e.t === 'duelo') {
        var a = e.quem === 0 ? e.va : e.vd, b = e.quem === 0 ? e.vd : e.va;
        $('.x1-acao').innerHTML = '<span class="x1-rot">' + esc(e.rot) + '</span><div class="x1-forca"><b>' + a + '</b><span><i class="fa" style="--v:' + a + '%"></i><i class="fb" style="--v:' + b + '%"></i></span><b>' + b + '</b></div>';
        lutEl(e.venceu).classList.add('ganhou'); lutEl(1 - e.venceu).classList.add('perdeu');
        campo.dataset.bola = e.venceu ? 'b' : 'a';
      } else if (e.t === 'flow') {
        lutEl(e.lado).querySelector('.x1-flow').hidden = false; lutEl(e.lado).classList.add('em-flow');
        linha(e.txt, 'flow'); if (falar) BL.anunciar(e.txt);
      } else if (e.t === 'gol') {
        $('.x1-ga').textContent = e.placar[0]; $('.x1-gb').textContent = e.placar[1];
        if (!silencioso) {
          var g = $(e.lado ? '.x1-gb' : '.x1-ga'); g.classList.remove('pop'); void g.offsetWidth; g.classList.add('pop');
          campo.classList.remove('golaco'); void campo.offsetWidth; campo.classList.add('golaco');
        }
        lutEl(e.lado).classList.add('ganhou');
        linha(e.txt, 'gol ' + (e.lado ? 'b' : 'a')); if (falar) BL.anunciar(e.txt + ' Placar: ' + nome(jogo.J[0].p) + ' ' + e.placar[0] + ', ' + nome(jogo.J[1].p) + ' ' + e.placar[1] + '.');
      } else if (e.t === 'narra' || e.t === 'ouro') {
        linha(e.txt, e.t === 'ouro' ? 'ouro' : (e.lado == null ? '' : (e.lado ? 'b' : 'a')));
        if (falar && (e.t === 'ouro' || (narrarTudo && narrarTudo.checked))) BL.anunciar(e.txt);
      }
    }
    function passo() {
      if (pausado) return;
      var e = fila.shift();
      if (!e) return final();
      aplicar(e);
      timer = setTimeout(passo, e.t === 'gol' ? espera() * 1.8 : (e.t === 'lance' ? espera() * 0.6 : espera()));
    }
    function pular() {
      clearTimeout(timer); pausado = false;
      log.setAttribute('aria-busy', 'true');
      while (fila.length) aplicar(fila.shift(), true);
      log.removeAttribute('aria-busy');
      final();
    }
    function final() {
      clearTimeout(timer);
      var J = jogo.J, w = J[jogo.venc];
      var linhaSt = function (rot, k) { return '<tr><td>' + J[0].st[k] + '</td><th scope="row">' + rot + '</th><td>' + J[1].st[k] + '</td></tr>'; };
      var extra = (jogo.penalti ? ' · decidido no pênalti' : (jogo.ouro ? ' · gol de ouro' : ''));
      fim.innerHTML = '<h2 tabindex="-1">🏆 ' + esc(w.p.nome) + ' vence o x1!</h2>' +
        '<div class="x1-campeao ' + (jogo.venc ? 'b' : 'a') + '"><img src="' + esc(w.p.img) + '" alt="" width="480" height="552"><div><p class="x1-placar-final"><span>' + esc(nome(J[0].p)) + '</span> <b>' + J[0].g + ' × ' + J[1].g + '</b> <span>' + esc(nome(J[1].p)) + '</span></p>' +
        '<p>' + esc(jogo.frase) + ' <small>(' + jogo.lances + ' lances' + extra + ')</small></p>' +
        '<table class="x1-est"><caption class="sr-only">Estatísticas do x1</caption><thead><tr><th scope="col">' + esc(nome(J[0].p)) + '</th><th></th><th scope="col">' + esc(nome(J[1].p)) + '</th></tr></thead><tbody>' +
        '<tr><td>' + J[0].g + '</td><th scope="row">Gols</th><td>' + J[1].g + '</td></tr>' + linhaSt('Chutes', 'chutes') + linhaSt('Duelos vencidos no ataque', 'dribles') + linhaSt('Desarmes', 'desarmes') + linhaSt('Defesas / bloqueios', 'defesas') +
        '<tr><td>' + (J[0].acordou ? '⚡' : '—') + '</td><th scope="row">Despertar do ego</th><td>' + (J[1].acordou ? '⚡' : '—') + '</td></tr></tbody></table>' +
        '<p class="x1-semente">Partida nº <code>' + esc(semente) + '</code> · simulada pelo site; o link reproduz exatamente este jogo.</p>' +
        '<div class="x1-botoes"><button type="button" class="btn" data-acao="revanche">↻ Revanche</button><button type="button" class="btn btn-2" data-acao="replay">▶ Rever este jogo</button><button type="button" class="btn btn-2" data-acao="figurinha">🖼 Gerar figurinha</button><button type="button" class="btn btn-2" data-acao="copiar-jogo">Copiar link do replay</button><button type="button" class="btn btn-2" data-acao="trocar-pers">Trocar personagens</button></div>' +
        '<div class="x1-telao" hidden></div></div></div>';
      fim.hidden = false; $('.x1-ctrl').hidden = true;
      $('.x1-n').textContent = 'Fim de jogo';
      fim.querySelector('h2').focus();
      var nova = window.BL_ALBUM ? BL_ALBUM.ganhar(J[1 - jogo.venc].p.id, 'x1', true) : false;
      if (nova) fim.querySelector('.x1-semente').insertAdjacentHTML('beforebegin', '<p class="album-nova">🃏 Figurinha nova no <a href="album.html">Álbum do Ego</a>: ' + esc(J[1 - jogo.venc].p.nome) + '</p>');
      BL.anunciar(w.p.nome + ' vence por ' + J[jogo.venc].g + ' a ' + J[1 - jogo.venc].g + extra.replace(' · ', ', ') + '.' + (nova ? ' Figurinha nova no álbum: ' + J[1 - jogo.venc].p.nome + '.' : ''));
    }
    function voltar() { clearTimeout(timer); setPausa(false, false); fila = []; jogo = null; arena.hidden = true; fim.hidden = true; escolha.hidden = false; render(); $('.x1-comecar').focus(); }
    var linkJogo = function () { return BL.urlPublica('duelo.html', url(true) + '&auto=1'); };

    /* ---------- Telão de Replays: figurinha 1080×1350 ---------- */
    function carregar(src) {
      return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; });
    }
    function quebrar(g, txt, max) {
      var pal = txt.split(' '), out = [], l = '';
      pal.forEach(function (w) { var t = l ? l + ' ' + w : w; if (g.measureText(t).width > max && l) { out.push(l); l = w; } else l = t; });
      if (l) out.push(l); return out;
    }
    function figurinha(btn) {
      var box = $('.x1-telao', fim), J = jogo.J, w = J[jogo.venc];
      var altTxt = 'Figurinha do x1: ' + nome(J[0].p) + ' ' + J[0].g + ' a ' + J[1].g + ' ' + nome(J[1].p) + (jogo.ouro ? ', gol de ouro' : '') + '. ' + w.p.nome + ' vence.';
      var link = linkJogo();
      box.hidden = false;
      if (location.protocol === 'file:') {
        /* em file:// o canvas com imagens locais fica "contaminado" e não exporta PNG: cartão HTML para print */
        box.innerHTML = '<figure class="figurinha" aria-label="' + esc(altTxt) + '"><p class="fg-top">DUELO <span>x1</span> · BLUE LOCK</p><div class="fg-fotos">' +
          [0, 1].map(function (i) { return '<div class="fg-j ' + (i ? 'b' : 'a') + (jogo.venc === i ? ' venc' : '') + '"><img src="' + esc(J[i].p.img) + '" alt=""><b>' + esc(nome(J[i].p)) + (J[i].acordou ? ' ⚡' : '') + '</b></div>'; }).join('') +
          '</div><p class="fg-placar">' + J[0].g + ' × ' + J[1].g + '</p><p class="fg-venc">🏆 ' + esc(w.p.nome) + (jogo.ouro ? ' · gol de ouro' : '') + '</p><p class="fg-frase">' + esc(jogo.frase) + '</p><p class="fg-url">' + esc(link) + '</p></figure>' +
          '<p class="x1-telao-nota">Aberto como arquivo local, o navegador não deixa gerar o PNG. Tire um print do cartão ou use o site publicado. <button type="button" class="btn btn-2" data-acao="copiar-jogo">Copiar link do replay</button></p>';
        BL.anunciar('Figurinha pronta na tela'); return;
      }
      btn.disabled = true; box.innerHTML = '<p class="x1-telao-nota">Montando a figurinha…</p>';
      var c = document.createElement('canvas'); c.width = 1080; c.height = 1350; var g = c.getContext('2d');
      var grad = g.createLinearGradient(0, 0, 1080, 1350); grad.addColorStop(0, '#0b1d3f'); grad.addColorStop(.55, '#05070d'); grad.addColorStop(1, '#1a0b17');
      g.fillStyle = grad; g.fillRect(0, 0, 1080, 1350);
      g.strokeStyle = '#1e6bff'; g.lineWidth = 6; g.strokeRect(24, 24, 1032, 1302);
      Promise.all([carregar(J[0].p.img), carregar(J[1].p.img)]).then(function (im) {
        g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = 'italic 900 64px system-ui, Arial, sans-serif';
        g.fillText('DUELO ', 470, 120); g.fillStyle = '#2f7bff'; g.fillText('x1', 640, 120);
        g.font = '700 30px system-ui, Arial, sans-serif'; g.fillStyle = '#8fb0ff'; g.fillText('BLUE LOCK · FÃ-SITE', 540, 165);
        [0, 1].forEach(function (i) {
          var x = i ? 580 : 60, y = 200, cor = jogo.venc === i ? '#ffd166' : (i ? '#ff4d6d' : '#2f7bff');
          g.fillStyle = '#13254d'; g.fillRect(x, y, 440, 506);
          if (im[i]) g.drawImage(im[i], 0, 0, im[i].naturalWidth, im[i].naturalHeight, x, y, 440, 506);
          if (jogo.venc !== i) { g.fillStyle = 'rgba(5,7,13,.45)'; g.fillRect(x, y, 440, 506); }
          g.lineWidth = 10; g.strokeStyle = cor; g.strokeRect(x, y, 440, 506);
          g.fillStyle = '#fff'; g.font = 'italic 900 58px system-ui, Arial, sans-serif'; g.fillText(nome(J[i].p) + (J[i].acordou ? ' ⚡' : ''), x + 220, 790);
        });
        g.font = 'italic 900 200px system-ui, Arial, sans-serif'; g.fillStyle = '#7fb0ff'; g.fillText(String(J[0].g), 380, 1010);
        g.fillStyle = '#a9b4cc'; g.font = '900 120px system-ui, Arial, sans-serif'; g.fillText('×', 540, 990);
        g.font = 'italic 900 200px system-ui, Arial, sans-serif'; g.fillStyle = '#ff8fa3'; g.fillText(String(J[1].g), 700, 1010);
        g.fillStyle = '#ffd166'; g.font = 'italic 900 52px system-ui, Arial, sans-serif';
        g.fillText('🏆 ' + nome(w.p) + ' vence' + (jogo.penalti ? ' no pênalti' : (jogo.ouro ? ' no gol de ouro' : '')) + '!', 540, 1100);
        g.fillStyle = '#e6ecff'; g.font = '500 36px system-ui, Arial, sans-serif';
        quebrar(g, jogo.frase, 900).slice(0, 2).forEach(function (l, k) { g.fillText(l, 540, 1165 + k * 46); });
        g.fillStyle = '#8a97b5'; g.font = '500 24px system-ui, Arial, sans-serif';
        g.fillText('Simulação de fã · atributos estimados, não oficiais', 540, 1265);
        g.fillStyle = '#8fb0ff'; g.font = '600 22px ui-monospace, monospace';
        g.fillText(link.replace(/^https?:\/\//, '').slice(0, 86), 540, 1300);
        c.toBlob(function (blob) {
          btn.disabled = false;
          if (!blob) { box.innerHTML = '<p class="x1-telao-nota">Não foi possível gerar o PNG neste navegador.</p>'; return; }
          if (box._url) URL.revokeObjectURL(box._url);
          var u = URL.createObjectURL(blob); box._url = u; var arq = 'x1-' + sel.a.id + '-' + sel.b.id + '-' + semente + '.png';
          var file = null; try { file = new File([blob], arq, { type: 'image/png' }); } catch (x) {}
          var podeShare = file && navigator.canShare && navigator.canShare({ files: [file] });
          box.innerHTML = '<img class="x1-fig" src="' + u + '" alt="' + esc(altTxt) + '" width="1080" height="1350"><div class="x1-botoes"><a class="btn" href="' + u + '" download="' + esc(arq) + '">⬇ Baixar PNG</a>' +
            (podeShare ? '<button type="button" class="btn btn-2" data-acao="compartilhar-fig">Compartilhar</button>' : '') + '<button type="button" class="btn btn-2" data-acao="copiar-jogo">Copiar link do replay</button></div>';
          box._file = file; box._alt = altTxt;
          var dl = box.querySelector('a[download]'); if (dl) dl.focus();
          BL.anunciar('Figurinha pronta. Use Baixar PNG.');
        }, 'image/png');
      });
    }

    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return;
      var a = b.dataset.acao;
      if (a === 'sortear') { sel.a = sortear(); sel.b = sortear(); if (sel.b === sel.a) sel.b = sortear(); mudou(); BL.anunciar(nome(sel.a) + ' contra ' + nome(sel.b)); }
      if (a === 'sortear-a' || a === 'sortear-b') escolher(a.slice(-1), sortear());
      if (a === 'inverter') { var t = sel.a; sel.a = sel.b; sel.b = t; mudou(); }
      if (a === 'comecar') comecar(false);
      if (a === 'revanche') comecar(true);
      if (a === 'replay') comecar(false);
      if (a === 'pular') pular();
      if (a === 'pausar') setPausa(!pausado);
      if (a === 'veloc') { rapido = !rapido; b.setAttribute('aria-pressed', String(rapido)); b.textContent = rapido ? '⏩ 2×' : '▶ 1×'; }
      if (a === 'trocar-pers') voltar();
      if (a === 'figurinha') figurinha(b);
      if (a === 'compartilhar-fig') { var bx = $('.x1-telao', fim); navigator.share({ files: [bx._file], title: 'Duelo x1 · Blue Lock', text: bx._alt + ' ' + linkJogo() }).catch(function () {}); }
      if (a === 'copiar') BL.copiar(BL.urlPublica('duelo.html', url(false)), b);
      if (a === 'copiar-jogo') BL.copiar(linkJogo(), b, 'Link do replay copiado');
    });
    /* espaço pausa quando o foco está na arena (fora de botões) */
    arena.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Spacebar') && !e.target.closest('button,a,input,summary') && jogo && fim.hidden) { e.preventDefault(); setPausa(!pausado); }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && jogo && fim.hidden && !arena.hidden && !pausado) setPausa(true, false); });
    render();
    if (qs.get('auto') === '1') comecar(false);
  }).catch(function (e) { console.warn('Duelo indisponível:', e); });
})();
