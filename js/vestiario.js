/* Vestiário: memória das fases. Distribua os personagens entre os times em que jogaram (dados das fichas, só fases "seguras").
   Caminho principal: um <select> por cartão (teclado/toque). Arrastar é só um atalho (WCAG 2.5.7). Modo diário (dia de São Paulo) e livre. */
(function () {
  'use strict';
  var BL = window.BL, M = window.BLX1; if (!BL || !BL.grafo) return;
  var raiz = document.querySelector('.vst'); if (!raiz) return;
  var esc = BL.esc, $ = function (s) { return raiz.querySelector(s); };
  var TEMAS = {
    sel1: { fase: '1ª Seleção', rot: '1ª Seleção', perg: 'Em qual time da <b>1ª Seleção</b> cada um jogou?' },
    nel: { fase: 'Neo Egoist League', rot: 'Neo Egoist League', perg: 'Por qual clube da <b>Neo Egoist League</b> cada um jogou?' },
    sub20: { fase: 'Atual', filtro: /Sub-20$/, rot: 'Seleções Sub-20 (situação atual)', perg: 'Em qual <b>seleção Sub-20</b> cada um está (situação atual nas fichas)?' }
  };
  var ORDEM_T = ['sel1', 'nel', 'sub20'];
  var hoje = function () { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); };
  var nDia = function (d) { return Math.round((Date.parse(d + 'T12:00:00Z') - Date.parse('2026-10-23T12:00:00Z')) / 864e5) + 1; };
  function rngDe(seed) { if (M && M.rng) return M.rng(seed); var a = 0; for (var i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) | 0; return function () { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; }
  function embaralhar(l, r) { l = l.slice(); for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = l[i]; l[i] = l[j]; l[j] = t; } return l; }
  var ler = function () { try { return JSON.parse(localStorage.getItem('bl-vestiario') || '{}'); } catch (e) { return {}; } };
  var gravar = function (o) { try { localStorage.setItem('bl-vestiario', JSON.stringify(o)); } catch (e) {} };

  BL.personagens().then(function (todos) {
    var por = {}; todos.forEach(function (p) { por[p.id] = p; });
    var G = BL.grafo(todos).grupos;
    function grupos(tema) {
      var T = TEMAS[tema];
      return Object.keys(G).filter(function (k) { var t = k.split('|'); return t[0] === T.fase && G[k].length >= 3 && (!T.filtro || T.filtro.test(t[1])); }).sort();
    }
    var qs = new URLSearchParams(location.search);
    var modo = qs.get('seed') ? 'livre' : 'dia', dia = hoje(), tema, seed, rodada, conferido = false;
    function montar() {
      var r = rngDe('vest:' + seed + ':' + tema), gs = embaralhar(grupos(tema), r).slice(0, 3).sort();
      var cartas = [].concat.apply([], gs.map(function (k) { return embaralhar(G[k], r).slice(0, 3).map(function (id) { return { id: id, certo: k.split('|')[1] }; }); }));
      rodada = { times: gs.map(function (k) { return k.split('|')[1]; }), cartas: embaralhar(cartas, r) };
    }
    function iniciar(m, t, s) {
      modo = m; conferido = false;
      if (m === 'dia') { tema = ORDEM_T[(nDia(dia) - 1 + 300) % ORDEM_T.length]; seed = 'dia-' + dia; }
      else { tema = TEMAS[t] ? t : 'sel1'; seed = s || (M ? M.novaSemente() : String(Date.now())); }
      montar(); desenhar();
      try { history.replaceState(null, '', m === 'dia' ? location.pathname.split('/').pop() : '?t=' + tema + '&seed=' + seed); } catch (e) {}
      var salvo = ler().dia;
      if (m === 'dia' && salvo && salvo.d === dia && salvo.resp) { rodada.cartas.forEach(function (c) { mover(c.id, salvo.resp[c.id] || ''); }); conferir(true); }
    }
    function desenhar() {
      var T = TEMAS[tema];
      $('.vs-modo').innerHTML = modo === 'dia' ? 'Vestiário do dia <b>#' + nDia(dia) + '</b> · tema: ' + esc(T.rot) : 'Modo livre · tema: ' + esc(T.rot);
      $('.vs-perg').innerHTML = T.perg + ' Use o menu de cada cartão' + (matchMedia('(pointer:fine)').matches ? ' ou arraste até o vestiário' : '') + '.';
      $('.vs-temas').hidden = modo === 'dia';
      [].forEach.call(raiz.querySelectorAll('input[name=vs-tema]'), function (i) { i.checked = i.value === tema; });
      var ops = '<option value="">Escolha o time…</option>' + rodada.times.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('');
      $('.vs-banco ul').innerHTML = rodada.cartas.map(function (c) {
        var p = por[c.id], sid = 'vs-s-' + c.id;
        return '<li class="vs-carta" draggable="true" data-id="' + esc(c.id) + '"><img src="' + esc(BL.thumb(p)) + '" alt="" width="56" height="56" draggable="false"><span class="vs-nome">' + esc(p.nome) + '</span>' +
          '<label class="sr-only" for="' + sid + '">Time de ' + esc(p.nome) + '</label><select id="' + sid + '">' + ops + '</select><span class="vs-res" aria-live="off"></span></li>';
      }).join('');
      $('.vs-salas').innerHTML = rodada.times.map(function (t, i) {
        return '<section class="vs-sala" data-time="' + esc(t) + '" aria-labelledby="vs-h-' + i + '"><h3 id="vs-h-' + i + '"><span aria-hidden="true">🚪</span> ' + esc(t) + ' <small class="vs-cnt">0</small></h3><ul aria-label="No vestiário ' + esc(t) + '"></ul></section>';
      }).join('');
      $('.vs-placar').textContent = ''; $('[data-acao=conferir]').disabled = false; $('.vs-fim').hidden = true;
      contar();
    }
    function carta(id) { return raiz.querySelector('.vs-carta[data-id="' + id + '"]'); }
    function mover(id, time) {
      var li = carta(id); if (!li) return;
      var foco = li.contains(document.activeElement) ? document.activeElement : null;
      var sel = li.querySelector('select'); sel.value = time;
      var dest = time ? raiz.querySelector('.vs-sala[data-time="' + CSS.escape(time) + '"] ul') : $('.vs-banco ul');
      if (dest && li.parentNode !== dest) dest.appendChild(li);
      if (foco) foco.focus();
      contar();
    }
    function contar() {
      [].forEach.call(raiz.querySelectorAll('.vs-sala'), function (s) { s.querySelector('.vs-cnt').textContent = s.querySelectorAll('.vs-carta').length; });
      var falta = $('.vs-banco ul').children.length;
      $('.vs-banco h3 small').textContent = falta ? falta + ' sem time' : 'todos escolhidos';
      $('.vs-banco').classList.toggle('vazio', !falta);
    }
    raiz.addEventListener('change', function (e) {
      if (e.target.matches('.vs-carta select')) { var li = e.target.closest('.vs-carta'); mover(li.dataset.id, e.target.value); BL.anunciar(por[li.dataset.id].nome + (e.target.value ? ' foi para ' + e.target.value : ' voltou para o banco')); }
      if (e.target.name === 'vs-tema') iniciar('livre', e.target.value);
    });
    /* arrastar (atalho com mouse) */
    var arrastando = null;
    raiz.addEventListener('dragstart', function (e) { var li = e.target.closest && e.target.closest('.vs-carta'); if (!li || conferido) { e.preventDefault(); return; } arrastando = li.dataset.id; e.dataTransfer.setData('text/plain', arrastando); e.dataTransfer.effectAllowed = 'move'; li.classList.add('arrastando'); });
    raiz.addEventListener('dragend', function (e) { var li = e.target.closest && e.target.closest('.vs-carta'); if (li) li.classList.remove('arrastando'); arrastando = null; [].forEach.call(raiz.querySelectorAll('.alvo'), function (x) { x.classList.remove('alvo'); }); });
    raiz.addEventListener('dragover', function (e) { var z = e.target.closest('.vs-sala, .vs-banco'); if (z && arrastando) { e.preventDefault(); z.classList.add('alvo'); } });
    raiz.addEventListener('dragleave', function (e) { var z = e.target.closest('.vs-sala, .vs-banco'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('alvo'); });
    raiz.addEventListener('drop', function (e) {
      var z = e.target.closest('.vs-sala, .vs-banco'); if (!z || !arrastando) return; e.preventDefault(); z.classList.remove('alvo');
      mover(arrastando, z.dataset.time || '');
    });
    function conferir(restaurado) {
      conferido = true; var ok = 0, resp = {};
      rodada.cartas.forEach(function (c) {
        var li = carta(c.id), sel = li.querySelector('select'), v = sel.value, p = por[c.id];
        resp[c.id] = v; sel.disabled = true; li.draggable = false;
        var certo = v === c.certo; if (certo) ok++;
        li.classList.add(certo ? 'certo' : 'errado');
        li.querySelector('.vs-res').innerHTML = certo ? '✓ Certo' : '✗ ' + (v ? 'Não: ' : 'Sem resposta: ') + 'era <b>' + esc(c.certo) + '</b> · <a href="' + esc(p.url) + '">ficha</a>';
      });
      var n = rodada.cartas.length;
      $('.vs-placar').textContent = ok + ' de ' + n + ' certos' + (ok === n ? ' — vestiário perfeito! 🏆' : '.');
      $('[data-acao=conferir]').disabled = true;
      var fim = $('.vs-fim'); fim.hidden = false;
      var est = ler(), nota = '';
      if (modo === 'dia' && !restaurado) {
        est.jogos = (est.jogos || 0) + 1; if (ok === n) est.perfeitos = (est.perfeitos || 0) + 1;
        est.dia = { d: dia, ok: ok, n: n, resp: resp }; gravar(est);
        if (ok === n && window.BL_ALBUM) { var fig = rodada.cartas[0].id; if (BL_ALBUM.ganhar(fig, 'vestiário', true)) nota = '<p class="album-nova">🃏 Figurinha nova no <a href="album.html">Álbum do Ego</a>: ' + esc(por[fig].nome) + '</p>'; }
      }
      fim.innerHTML = '<h2 tabindex="-1">' + esc($('.vs-placar').textContent) + '</h2>' + nota +
        (modo === 'dia' ? '<p>' + (restaurado ? 'Você já jogou o vestiário de hoje. ' : '') + 'Novo vestiário amanhã (meia-noite de São Paulo). Seus vestiários diários: ' + (est.jogos || 0) + ' · perfeitos: ' + (est.perfeitos || 0) + '.</p>' : '') +
        '<div class="x1-botoes">' + (modo === 'dia' ? '' : '<button type="button" class="btn" data-acao="nova">↻ Nova rodada</button>') + '<button type="button" class="btn btn-2" data-acao="livre">🎲 Modo livre</button>' + (modo === 'livre' ? '<a class="btn btn-2" href="vestiario.html">Vestiário do dia</a>' : '') + '<button type="button" class="btn btn-2" data-acao="copiar">Copiar resultado</button></div>';
      if (!restaurado) { fim.querySelector('h2').focus(); BL.anunciar($('.vs-placar').textContent); }
    }
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acao]'); if (!b) return; var a = b.dataset.acao;
      if (a === 'conferir') {
        var falta = $('.vs-banco ul').children.length;
        if (falta && !b.dataset.confirmar) { b.dataset.confirmar = '1'; $('.vs-placar').textContent = falta + (falta === 1 ? ' cartão ainda está' : ' cartões ainda estão') + ' sem time. Clique de novo para conferir assim mesmo.'; BL.anunciar($('.vs-placar').textContent); return; }
        delete b.dataset.confirmar; conferir(false);
      }
      if (a === 'nova') { iniciar('livre', tema); $('.vs-modo').focus(); }
      if (a === 'livre') { iniciar('livre', modo === 'dia' ? ORDEM_T[(ORDEM_T.indexOf(tema) + 1) % 3] : tema); $('.vs-modo').focus(); }
      if (a === 'copiar') {
        var marcas = rodada.cartas.map(function (c) { return carta(c.id).classList.contains('certo') ? '🟦' : '🟥'; }).join('');
        BL.copiar('Vestiário Blue Lock ' + (modo === 'dia' ? '#' + nDia(dia) : '(livre)') + ' · ' + TEMAS[tema].rot + ': ' + $('.vs-placar').textContent + '\n' + marcas + '\n' + BL.urlPublica('vestiario.html', modo === 'dia' ? '' : '?t=' + tema + '&seed=' + seed), b, 'Resultado copiado');
      }
    });
    $('.vs-temas').innerHTML = '<legend>Tema</legend>' + ORDEM_T.map(function (t) { return '<label class="cp-op"><input type="radio" name="vs-tema" value="' + t + '"> <span>' + esc(TEMAS[t].rot) + '</span></label>'; }).join('');
    if (modo === 'livre') iniciar('livre', qs.get('t'), qs.get('seed')); else iniciar('dia');
    /* virou o dia com a página aberta */
    setInterval(function () { if (modo === 'dia' && hoje() !== dia) { dia = hoje(); iniciar('dia'); } }, 60000);
  }).catch(function (e) { console.warn('Vestiário indisponível:', e); });
})();
