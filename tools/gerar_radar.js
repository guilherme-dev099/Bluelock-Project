// Injeta o pentágono de status (SVG estático) em cada ficha. Rodar: node tools/gerar_radar.js (idempotente)
const fs=require('fs'),path=require('path'),R=path.join(__dirname,'..');
global.window={BL:{norm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}};
eval(fs.readFileSync(path.join(R,'js/x1-motor.js'),'utf8'));
const M=window.BLX1, ps=JSON.parse(fs.readFileSync(path.join(R,'data/personagens.json'),'utf8'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
let n=0,falta=[];
for(const p of ps){
  const f=path.join(R,p.url); let h=fs.readFileSync(f,'utf8');
  h=h.replace(/<!--radar-->[\s\S]*?<!--\/radar-->/,'');
  if(!p.posicao&&!(p.armas||[]).length) falta.push(p.id);
  const v=M.cinco(M.atributos(p,false)), nm=esc(p.nome);
  const alt='Pentágono de status de '+nm+': '+M.EIXOS.map(e=>e[1]+' '+v[e[0]]).join(', ');
  const tab='<table class="radar-tab"><caption class="sr-only">Status de '+nm+' (0–99)</caption><tbody>'+M.EIXOS.map(e=>'<tr><th scope="row">'+e[1]+'</th><td>'+v[e[0]]+'</td></tr>').join('')+'</tbody></table>';
  const bloco='<!--radar--><section class="radar" aria-labelledby="rd-t-'+p.id+'"><h2 class="ph" id="rd-t-'+p.id+'">Pentágono de status</h2><div class="radar-corpo"><figure class="radar-fig">'+M.radarSVG([{v}],alt)+'</figure>'+tab+'</div><p class="cj-aviso">Valores 0–99 <b>estimados pelo site</b> a partir da ficha (ranking, posição e Armas), os mesmos do Duelo x1 · não oficiais.</p></section><!--/radar-->';
  if(h.includes('<!--como-jogar-->')) h=h.replace('<!--como-jogar-->',bloco+'<!--como-jogar-->');
  else if(h.includes('<p class="cmp">')) h=h.replace('<p class="cmp">',bloco+'<p class="cmp">');
  else {falta.push(p.id+'(sem âncora)');continue;}
  fs.writeFileSync(f,h); n++;
}
console.log('fichas com radar:',n,'| sem dados de posição/armas:',falta.join(', ')||'nenhuma');
