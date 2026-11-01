/* Silhueta do dia (rodada 1, #6): o personagem secreto aparece em tinta chapada e se revela a cada erro.
   Calendário próprio (offset diferente do modo Pistas), fuso de Brasília. Script clássico, file://. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); }, app = $('#sil'); if (!app || !window.BL) return;
  var MAX = 6, INICIO = '2026-11-01', RAIO = [0, 14, 24, 36, 50, 66, 150];
  function hoje() { return new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10); }
  function hs(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function ler(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var esc = BL.esc, qs = new URLSearchParams(location.search), treino = qs.get('treino');
  BL.personagens().then(function (todos) {
    var pool = todos.filter(function (p) { return p.img && p.fases && p.fases.length; }), por = {};
    todos.forEach(function (p) { por[p.id] = p; });
    var dia = hoje(), n = Math.max(1, Math.floor((Date.parse(dia) - Date.parse(INICIO)) / 864e5) + 1);
    var sec = pool[hs(treino ? 'sil-t-' + treino : 'silhueta-' + dia + '-v1') % pool.length];
    var CH = treino ? null : 'bl-sil-' + dia, st = (CH && ler(CH, null)) || { p: [] };
    var img = $('.sil-cor'), base = $('.sil-base'), msg = $('.sil-status'), lista = $('.sil-palpites'), inp = $('#sil-busca');
    img.src = base.src = sec.img;
    function venceu() { return st.p.indexOf(sec.id) >= 0; }
    function acabou() { return venceu() || st.p.length >= MAX; }
    function erros() { return st.p.filter(function (id) { return id !== sec.id; }).length; }
    function pistas() {
      var e = erros(), out = [];
      if (e >= 2) out.push('Posição: ' + (sec.posicao || '—'));
      if (e >= 3) out.push('Primeira fase: ' + sec.fases[0].fase + ' (' + sec.fases[0].time + ')');
      if (e >= 4) out.push('Começa com: ' + sec.nome.charAt(0));
      return out;
    }
    function render(anunciar) {
      var e = erros(), fim = acabou();
      app.style.setProperty('--sil-b', (fim ? 0 : [9, 7, 5, 3.5, 2, 1][Math.min(e, 5)]) + 'px'); app.style.setProperty('--sil-r', (fim ? 150 : RAIO[Math.min(e, MAX)]) + '%');
      app.classList.toggle('sil-fim', fim);
      img.alt = fim ? 'Ilustração de ' + sec.nome : '';
      msg.textContent = fim ? (venceu() ? 'Acertou! Era ' + sec.nome + ', em ' + st.p.length + ' de ' + MAX + ' tentativas.' : 'Não foi dessa vez. Era ' + sec.nome + '.')
        : 'Silhueta do personagem secreto, tentativa ' + (st.p.length + 1) + ' de ' + MAX + '.';
      lista.innerHTML = st.p.map(function (id) { var p = por[id]; return '<li class="' + (id === sec.id ? 'ok' : 'erro') + '">' + (id === sec.id ? '✓ ' : '✗ ') + esc(p ? p.nome : id) + '</li>'; }).join('');
      $('.sil-pistas').innerHTML = pistas().map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      $('.sil-form').hidden = fim; $('.sil-fim-box').hidden = !fim;
      if (fim) $('.sil-ficha').href = sec.url;
      if (anunciar) BL.anunciar(msg.textContent);
    }
    function emojis() { return st.p.map(function (id) { return id === sec.id ? '🟦' : '⬛'; }).join(''); }
    function palpite(p) {
      if (acabou() || st.p.indexOf(p.id) >= 0) { BL.anunciar(p.nome + ' já foi tentado'); return; }
      st.p.push(p.id); if (CH) gravar(CH, st);
      inp.value = '';
      if (acabou() && !treino) {
        var s = ler('bl-sil-stats', { jogos: 0, vitorias: 0 }); s.jogos++; if (venceu()) s.vitorias++; gravar('bl-sil-stats', s);
        if (window.blEv) blEv('silhueta', { ok: venceu(), erros: erros() });
      }
      render(true);
    }
    BL.combobox(inp, $('#sil-busca-lista'), { fonte: function () { return todos; }, sub: function (p) { return p.posicao || ''; }, escolher: palpite, abrirNoFoco: false });
    $('.sil-compartilhar').addEventListener('click', function (e) {
      var t = 'Blue Lock · Silhueta do dia ' + (treino ? '(treino)' : '#' + n) + ' ' + (venceu() ? st.p.length : 'X') + '/' + MAX + '\n' + emojis() + '\n' + BL.urlPublica('silhueta.html', '');
      BL.copiar(t, e.currentTarget, 'Resultado copiado');
    });
    $('.sil-treino').addEventListener('click', function () { location.href = 'silhueta.html?treino=' + Math.random().toString(36).slice(2, 7); });
    $('.sil-n').textContent = treino ? 'Treino' : '#' + n;
    render(false);
  });
})();
