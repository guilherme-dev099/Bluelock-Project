/* Meu Ego: painel do progresso salvo no navegador + backup por código (script clássico) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function J(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function chaves() { var l = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^bl-/.test(k)) l.push(k); } } catch (e) {} return l.sort(); }
  function n(o) { return !o ? 0 : Array.isArray(o) ? o.length : typeof o === 'object' ? Object.keys(o).length : 0; }
  function card(t, v, s) { return '<section class="me-card"><h2>' + t + '</h2><p class="me-v">' + v + '</p>' + (s ? '<p class="me-s">' + s + '</p>' : '') + '</section>'; }
  function painel(total, por) {
    var alb = J('bl-album'), dd = J('bl-dd-stats'), car = J('bl-carreira-rec'), ves = J('bl-vestiario');
    var nAlb = alb && alb.ids ? n(alb.ids) : 0;
    var h = card('Álbum do Ego', nAlb + ' / ' + total, '<meter min="0" max="' + total + '" value="' + nAlb + '">' + nAlb + '</meter> figurinhas diferentes');
    if (dd && dd.jogos) {
      var mx = Math.max.apply(null, dd.dist.concat([1]));
      h += card('Desafio do dia', dd.vitorias + ' / ' + dd.jogos + ' vitórias', 'Sequência atual ' + dd.seq + ' · melhor ' + dd.melhor +
        '<ol class="me-dist" aria-label="Acertos por tentativa">' + dd.dist.map(function (v, i) { return '<li><span>' + (i + 1) + 'ª</span><span class="me-bar" style="width:' + Math.round(v / mx * 100) + '%"></span><b>' + v + '</b></li>'; }).join('') + '</ol>');
    } else h += card('Desafio do dia', '—', '<a href="egoista.html">Jogue o desafio de hoje</a>');
    h += card('Sobreviva ao Blue Lock', car ? car.passos + ' de 10' : '—', car && por[car.j] ? 'Recorde com ' + esc(por[car.j].nome) : '<a href="carreira.html">Comece uma carreira</a>');
    h += card('Vestiário', ves && n(ves) ? n(ves) + ' registro(s)' : '—', '<a href="vestiario.html">Abrir o Vestiário</a>');
    h += card('Preferências', (localStorage.getItem('bl-flow') === '1' ? 'Flow ligado' : 'Flow desligado'), (localStorage.getItem('bl-voz-on') === '1' ? 'Narração ligada' : 'Narração desligada') + ' · ' + chaves().length + ' item(ns) salvos');
    $('#me-stats').innerHTML = h;
  }
  function iniciar(ps) { var por = {}; (ps || []).forEach(function (p) { por[p.id] = p; }); painel((ps || []).length || 212, por); }
  if (window.BL && BL.personagens) BL.personagens().then(iniciar, function () { iniciar([]); }); else iniciar([]);

  var msg = $('#me-msg'), cod = $('#me-cod');
  function aviso(t) { msg.textContent = t; }
  $('#me-exp').addEventListener('click', function () {
    var dados = {}; chaves().forEach(function (k) { dados[k] = localStorage.getItem(k); });
    cod.value = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, dados: dados }))));
    $('#me-copiar').hidden = false; cod.focus(); cod.select(); aviso('Código gerado com ' + Object.keys(dados).length + ' item(ns).');
  });
  $('#me-copiar').addEventListener('click', function () {
    cod.select();
    (navigator.clipboard ? navigator.clipboard.writeText(cod.value) : Promise.reject()).then(function () { aviso('Copiado!'); }, function () { try { document.execCommand('copy'); aviso('Copiado!'); } catch (e) { aviso('Selecione e copie o código.'); } });
  });
  $('#me-imp').addEventListener('click', function () {
    var o; try { o = JSON.parse(decodeURIComponent(escape(atob(cod.value.trim())))); } catch (e) { o = null; }
    if (!o || o.v !== 1 || !o.dados || typeof o.dados !== 'object') { aviso('Código inválido.'); return; }
    var ks = Object.keys(o.dados).filter(function (k) { return /^bl-/.test(k) && typeof o.dados[k] === 'string'; });
    var dl = $('#me-dlg'); $('#me-dlg-p').textContent = 'O código tem ' + ks.length + ' item(ns) e vai substituir o progresso atual deste navegador.';
    function aplicar() {
      chaves().forEach(function (k) { localStorage.removeItem(k); });
      ks.forEach(function (k) { localStorage.setItem(k, o.dados[k]); });
      aviso('Progresso importado.'); if (window.BL && BL.personagens) BL.personagens().then(iniciar);
    }
    if (dl.showModal) { dl.returnValue = ''; dl.showModal(); dl.addEventListener('close', function f() { dl.removeEventListener('close', f); if (dl.returnValue === 'ok') aplicar(); }); }
    else if (confirm($('#me-dlg-p').textContent)) aplicar();
  });
})();
