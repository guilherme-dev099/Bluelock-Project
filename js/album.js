/* Álbum do Ego: 212 figurinhas (uma por ficha) + especiais. Ganha jogando (x1, Copa, desafio diário, carreira) e no pacote do dia.
   Tudo fica no navegador. Códigos de backup/troca usam window.BL_ORDEM (lista que só cresce no fim). Script clássico. */
(function () {
  'use strict';
  var BL = window.BL, A = window.BL_ALBUM, raiz = document.querySelector('.al');
  if (!BL || !A || !raiz) return;
  var esc = BL.esc, norm = BL.norm, $ = function (s) { return raiz.querySelector(s); };
  var ORDEM = window.BL_ORDEM || [], IDX = {}; ORDEM.forEach(function (id, i) { IDX[id] = i; });
  var CATS = [['', 'Todas'], ['protagonistas', 'Protagonistas'], ['bl', 'Blue Lock'], ['nel', 'NEL'], ['sub20', 'Sub-20'], ['selecoes', 'Seleções'], ['staff', 'Staff & mestres'], ['outros', 'Outros']];
  var NOME_ORIGEM = { x1: 'Duelo x1', copa: 'Copa do Ego', desafio: 'Desafio diário', carreira: 'Carreira', pacote: 'Pacote do dia', troca: 'Troca', backup: 'Backup', flow: 'Flow' };
  var todos = [], por = {}, filtro = { cat: '', ver: 'todas', q: '' };
  var hoje = function () { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var chk = function (s) { return (BLX1hash(s) % 1296).toString(36); };
  function BLX1hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  BL.personagens().then(function (l) {
    todos = l.slice().sort(function (a, b) { return a.ordem - b.ordem; }); todos.forEach(function (p, i) { p._n = i + 1; por[p.id] = p; });
    $('.al-filtros').innerHTML = '<fieldset class="chips al-cats"><legend class="sr-only">Categoria</legend>' + CATS.map(function (c) { return '<button type="button" class="al-chip" data-cat="' + c[0] + '" aria-pressed="' + (c[0] === '') + '">' + c[1] + '</button>'; }).join('') + '</fieldset>' +
      '<fieldset class="chips al-ver"><legend class="sr-only">Mostrar</legend>' + [['todas', 'Todas'], ['tenho', 'Tenho'], ['faltam', 'Faltam'], ['repetidas', 'Repetidas']].map(function (v) { return '<label class="cp-op"><input type="radio" name="ver" value="' + v[0] + '"' + (v[0] === 'todas' ? ' checked' : '') + '> <span>' + v[1] + '</span></label>'; }).join('') + '</fieldset>' +
      '<label class="sr-only" for="al-q">Filtrar por nome</label><input id="al-q" class="al-q" type="search" placeholder="Filtrar por nome…" autocomplete="off">';
    tudo();
  }).catch(function () { $('.al-grade').innerHTML = '<li>Não foi possível carregar as fichas.</li>'; });

  function tudo() { topo(); grade(); especiais(); pacoteBtn(); trocasSel(); historico(); }
  function topo() {
    var o = A.ler(), tem = todos.filter(function (p) { return o.ids[p.id]; }).length, rep = 0;
    todos.forEach(function (p) { if (o.ids[p.id] > 1) rep += o.ids[p.id] - 1; });
    var nesp = Object.keys(A.ESPECIAIS).filter(function (k) { return o.esp[k]; }).length;
    var pc = Math.floor(tem / todos.length * 100);
    $('.al-prog-l').innerHTML = '<b>' + tem + '</b> de ' + todos.length + ' figurinhas (' + pc + '%) · ' + rep + (rep === 1 ? ' repetida' : ' repetidas') + ' · ' + nesp + ' de ' + Object.keys(A.ESPECIAIS).length + ' especial';
    var pr = $('.al-prog'); pr.max = todos.length; pr.value = tem; pr.textContent = pc + '%';
    var cat = CATS.slice(1).map(function (c) { var l = todos.filter(function (p) { return p.categoria === c[0]; }), t = l.filter(function (p) { return o.ids[p.id]; }).length; return '<li' + (t === l.length ? ' class="completo"' : '') + '>' + c[1] + ' <b>' + t + '/' + l.length + '</b>' + (t === l.length ? ' ✓' : '') + '</li>'; });
    $('.al-cats-prog').innerHTML = cat.join('');
  }
  function fig(p, o, nova) {
    var n = o.ids[p.id] || 0;
    if (!n) return '<li class="fig falta"><span class="fig-n">#' + p._n + '</span><img src="' + esc(BL.thumb(p)) + '" alt="" width="80" height="80" loading="lazy"><span class="fig-nome">???</span><span class="sr-only">Figurinha ' + p._n + ': ainda não tenho</span></li>';
    return '<li class="fig' + (nova ? ' nova' : '') + '"><a href="' + esc(p.url) + '"><span class="fig-n">#' + p._n + '</span><img src="' + esc(BL.thumb(p)) + '" alt="" width="80" height="80" loading="lazy"><span class="fig-nome">' + esc(p.nome) + '</span>' + (n > 1 ? '<span class="fig-rep" aria-label="' + n + ' cópias">×' + n + '</span>' : '') + '</a></li>';
  }
  function grade() {
    var o = A.ler(), q = norm(filtro.q);
    var l = todos.filter(function (p) {
      var n = o.ids[p.id] || 0;
      if (filtro.cat && p.categoria !== filtro.cat) return false;
      if (filtro.ver === 'tenho' && !n) return false; if (filtro.ver === 'faltam' && n) return false; if (filtro.ver === 'repetidas' && n < 2) return false;
      if (q && !(n && norm(p.nome).indexOf(q) >= 0)) return false;
      return true;
    });
    $('.al-grade').innerHTML = l.map(function (p) { return fig(p, o); }).join('') || '<li class="al-vazio">Nenhuma figurinha neste filtro' + (q ? ' (o nome só aparece nas que você já tem)' : '') + '.</li>';
    $('.al-cont').textContent = l.length + (l.length === 1 ? ' figurinha' : ' figurinhas') + ' neste filtro';
  }
  function especiais() {
    var o = A.ler();
    $('.al-esp').innerHTML = Object.keys(A.ESPECIAIS).map(function (k) {
      var e = A.ESPECIAIS[k];
      return o.esp[k] ? '<li class="fig especial"><span class="fig-n">★</span><span class="fig-emoji" aria-hidden="true">' + e.emoji + '</span><span class="fig-nome">' + esc(e.nome) + '</span></li>'
        : '<li class="fig falta especial"><span class="fig-n">★</span><span class="fig-emoji" aria-hidden="true">?</span><span class="fig-nome">' + esc(e.dica) + '</span></li>';
    }).join('');
  }
  /* pacote do dia: 3 figurinhas sorteadas pela data (iguais para todo mundo no mesmo dia), uma vez por dia */
  function pacoteDe(dia) {
    var h = BLX1hash('pacote:' + dia), out = [];
    while (out.length < 3) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; var p = todos[h % todos.length]; if (out.indexOf(p) < 0) out.push(p); }
    return out;
  }
  function pacoteBtn() {
    var o = A.ler(), b = $('[data-acao="pacote"]'), ja = o.pacote === hoje();
    b.disabled = ja; b.textContent = ja ? '📦 Pacote de hoje já aberto (volte amanhã)' : '📦 Abrir o pacote do dia (3 figurinhas)';
  }
  function abrirPacote() {
    var o = A.ler(); if (o.pacote === hoje()) return;
    o.pacote = hoje(); A.gravar(o);
    var ps = pacoteDe(hoje()), novas = ps.map(function (p) { return A.ganhar(p.id, 'pacote', true); });
    var o2 = A.ler(), box = $('.al-pacote');
    box.hidden = false;
    box.innerHTML = '<h3 tabindex="-1">Pacote de ' + hoje().split('-').reverse().join('/') + '</h3><ul class="al-grade al-pac-grade">' + ps.map(function (p, i) { return fig(p, o2, novas[i]).replace('<li class="fig', '<li style="--i:' + i + '" class="fig'); }).join('') + '</ul><p>' + ps.map(function (p, i) { return esc(p.nome) + (novas[i] ? ' (nova!)' : ' (repetida)'); }).join(' · ') + '</p>';
    box.querySelector('h3').focus();
    BL.anunciar('Pacote aberto: ' + ps.map(function (p, i) { return p.nome + (novas[i] ? ', nova' : ', repetida'); }).join('; '));
    tudo();
  }
  function historico() {
    var o = A.ler();
    $('.al-log').innerHTML = o.log.slice(0, 8).map(function (x) {
      var p = por[x.id], e = A.ESPECIAIS[x.id];
      return '<li>' + (p ? '<a href="' + esc(p.url) + '">' + esc(p.nome) + '</a>' : (e ? e.emoji + ' ' + esc(e.nome) : esc(x.id))) + ' <small>' + esc(NOME_ORIGEM[x.o] || x.o) + ' · ' + new Date(x.t).toLocaleDateString('pt-BR') + '</small></li>';
    }).join('') || '<li>Nenhuma ainda. Jogue um <a href="duelo.html">Duelo x1</a>: quem você derrotar vira figurinha.</li>';
  }
  /* ---- códigos ---- */
  function codBackup() {
    var o = A.ler(), n = 0n;
    ORDEM.forEach(function (id, i) { if (o.ids[id]) n |= 1n << BigInt(i); });
    var corpo = n.toString(36) + (o.esp.flow ? '.f' : '');
    return 'BLA1.' + corpo + '.' + chk(corpo);
  }
  function lerBackup(c) {
    var m = String(c).trim().match(/^BLA1\.([0-9a-z]+)((?:\.f)?)\.([0-9a-z]+)$/i); if (!m) return null;
    var corpo = m[1].toLowerCase() + m[2].toLowerCase(); if (chk(corpo) !== m[3].toLowerCase()) return null;
    var n = 0n; for (var i = 0; i < m[1].length; i++) n = n * 36n + BigInt(parseInt(m[1][i], 36));
    var ids = []; ORDEM.forEach(function (id, i) { if ((n >> BigInt(i)) & 1n) ids.push(id); });
    return { ids: ids, flow: !!m[2] };
  }
  function trocasSel() {
    var o = A.ler(), s = $('#al-dar'), rep = todos.filter(function (p) { return o.ids[p.id] > 1 && p.id in IDX; });
    s.innerHTML = rep.length ? rep.map(function (p) { return '<option value="' + p.id + '">#' + p._n + ' ' + esc(p.nome) + ' (×' + o.ids[p.id] + ')</option>'; }).join('') : '<option value="">Você ainda não tem repetidas</option>';
    s.disabled = !rep.length; $('[data-acao="dar"]').disabled = !rep.length;
  }
  function msg(sel, t) { var p = $(sel); p.textContent = t; BL.anunciar(t); }
  raiz.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cat != null) { filtro.cat = b.dataset.cat; [].forEach.call(raiz.querySelectorAll('[data-cat]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); grade(); return; }
    var a = b.dataset.acao;
    if (a === 'pacote') abrirPacote();
    if (a === 'backup') { var c = codBackup(); $('#al-cod').value = c; BL.copiar(c, b, 'Código copiado'); }
    if (a === 'restaurar') {
      var r = lerBackup($('#al-rest').value);
      if (!r) return msg('.al-cod-msg', 'Código de backup inválido. Confira se copiou inteiro (começa com BLA1.).');
      var o = A.ler(), novas = 0; r.ids.forEach(function (id) { if (!o.ids[id]) { o.ids[id] = 1; novas++; } }); if (r.flow && !o.esp.flow) { o.esp.flow = 1; novas++; }
      A.gravar(o); $('#al-rest').value = ''; tudo(); msg('.al-cod-msg', 'Backup restaurado: ' + novas + (novas === 1 ? ' figurinha nova' : ' figurinhas novas') + ' (as que você já tinha foram mantidas).');
    }
    if (a === 'dar') {
      var id = $('#al-dar').value, o2 = A.ler(); if (!id || !(o2.ids[id] > 1)) return;
      o2.ids[id]--; A.gravar(o2);
      var corpo = (IDX[id]).toString(36) + '.' + (Date.now() % 1679616).toString(36) + Math.floor(Math.random() * 36).toString(36);
      var cod = 'BLT1.' + corpo + '.' + chk(corpo); $('#al-troca-cod').value = cod; BL.copiar(cod, b, 'Código de troca copiado');
      trocasSel(); topo(); grade(); msg('.al-troca-msg', 'Uma cópia de ' + por[id].nome + ' saiu do seu álbum. Mande o código para quem vai receber.');
    }
    if (a === 'resgatar') {
      var m = $('#al-resg').value.trim().match(/^BLT1\.(([0-9a-z]+)\.([0-9a-z]+))\.([0-9a-z]+)$/i);
      if (!m || chk(m[1].toLowerCase()) !== m[4].toLowerCase() || !ORDEM[parseInt(m[2], 36)]) return msg('.al-troca-msg', 'Código de troca inválido.');
      var o3 = A.ler(); o3.resg = o3.resg || [];
      if (o3.resg.indexOf(m[1].toLowerCase()) >= 0) return msg('.al-troca-msg', 'Este código já foi resgatado neste navegador.');
      o3.resg.push(m[1].toLowerCase()); A.gravar(o3);
      var pid = ORDEM[parseInt(m[2], 36)], nova = A.ganhar(pid, 'troca', true); $('#al-resg').value = '';
      tudo(); msg('.al-troca-msg', 'Recebida: ' + (por[pid] ? por[pid].nome : pid) + (nova ? ' (nova!)' : ' (repetida)') + '.');
    }
  });
  raiz.addEventListener('change', function (e) { if (e.target.name === 'ver') { filtro.ver = e.target.value; grade(); } });
  raiz.addEventListener('input', function (e) { if (e.target.id === 'al-q') { filtro.q = e.target.value; grade(); } });
  document.addEventListener('bl-album', function () { if (todos.length) tudo(); });
  addEventListener('storage', function (e) { if (e.key === 'bl-album' && todos.length) tudo(); });
})();
