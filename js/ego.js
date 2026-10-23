/* P4 "Despertar do Ego": modo Flow, easter egg f-l-o-w, telão de ranking e nomes de View Transition entre páginas */
(function () {
  'use strict';
  var BL = window.BL, html = document.documentElement, reduce = BL ? BL.reduce : false;
  var btn = document.querySelector('.flow-btn');
  function ler() { try { return !!localStorage.getItem('bl-flow'); } catch (e) { return false; } }
  function gravar(on) { try { on ? localStorage.setItem('bl-flow', '1') : localStorage.removeItem('bl-flow'); } catch (e) {} }
  function set(on) {
    html.toggleAttribute('data-flow', on);
    if (btn) { btn.setAttribute('aria-pressed', String(on)); btn.title = on ? 'Desativar modo Flow' : 'Ativar modo Flow'; }
    gravar(on);
  }
  if (btn) {
    btn.hidden = false;
    set(ler());
    btn.addEventListener('click', function () {
      var on = !html.hasAttribute('data-flow'); set(on);
      BL && BL.anunciar(on ? 'Modo Flow ativado' : 'Modo Flow desativado');
    });
    var buf = '';
    addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
      if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf === 'flow') { buf = ''; if (!html.hasAttribute('data-flow')) btn.click(); }
    });
  }

  /* 4c. Telão: contagem regressiva decorativa do ranking (o texto real fica na <dl>) */
  var info = document.querySelector('.info[data-rank]');
  var dd = [].slice.call(document.querySelectorAll('dt')).filter(function (d) { return /^Ranking/.test(d.textContent); })[0];
  var m = dd && dd.nextElementSibling.textContent.match(/(\d+)º \(início\).*?(\d+)º/);
  if (info && m && !reduce) {
    var ini = +m[1], fim = +m[2], t0 = performance.now(), dur = 1300, final = info.dataset.rank;
    info.classList.add('contando');
    var tick = function (t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      info.dataset.rank = '#' + Math.round(ini + (fim - ini) * e);
      if (k < 1) requestAnimationFrame(tick); else { info.dataset.rank = final; info.classList.remove('contando'); }
    };
    requestAnimationFrame(tick);
  }

  /* 4a. View Transitions entre páginas: a foto do card "voa" até a ficha (e volta) */
  function pagina(url) { try { return new URL(url).pathname.split('/').pop() || 'index.html'; } catch (e) { return ''; } }
  addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation) return;
    var nada = function () {}; e.viewTransition.ready.catch(nada); e.viewTransition.finished.catch(nada);
    var destino = pagina(e.activation.entry.url);
    var img = document.querySelector('a.card[href="' + destino + '"] img') || document.querySelector('.char > img');
    if (img) { img.style.viewTransitionName = 'foto'; }
  });
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var nada = function () {}; e.viewTransition.ready.catch(nada); e.viewTransition.finished.catch(nada);
    if (!window.navigation || !navigation.activation || !navigation.activation.from) return;
    var origem = pagina(navigation.activation.from.url);
    var img = document.querySelector('.char > img') || document.querySelector('a.card[href="' + origem + '"] img');
    if (img) {
      img.style.viewTransitionName = 'foto';
      var limpa = function () { img.style.viewTransitionName = ''; }; e.viewTransition.finished.then(limpa, limpa);
    }
  });
  addEventListener('pageshow', function () {
    [].forEach.call(document.querySelectorAll('img'), function (i) { if (i.style.viewTransitionName === 'foto') i.style.viewTransitionName = ''; });
  });
})();
