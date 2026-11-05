'use strict';
/* TOUR GUIADO
 * O Beto leva o cliente box a box na primeira visita.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== introdução guiada: o Beto leva o cliente box a box ========== */
let tourOn=false, tourStop=false, fimTour=false;
const TOUR_TXT={
  1:'Box 01: bananas. Prata, nanica e maçã. A campeã de giro.',
  2:'Box 02: citrus. Laranja, limão e tangerina.',
  3:'Box 03: maçã e pera. Gala, fuji e pera.',
  4:'Box 04: uvas e finas. Uva, morango, kiwi e pêssego.',
  5:'Box 05: tropicais. Manga, abacaxi, maracujá, mamão e coco.',
  6:'Box 06: melancia, melão, tomate e pimentão.',
  7:'Box 07: legumes e raízes. Batata, cebola, cenoura e alho.',
  8:'Box 08: verduras e folhas. Alface, repolho e couve.',
};
const TOUR_NOME={1:'BANANAS',2:'CITRUS',3:'MAÇÃ E PERA',4:'UVAS E FINAS',5:'TROPICAIS',6:'MELANCIA E LEGUMES',7:'LEGUMES E RAÍZES',8:'VERDURAS E FOLHAS'};
const tourCap=document.createElement('div'); tourCap.id='tourcap'; tourCap.className='hud-pill';   // estilo em css/loja.css (#tourcap)
const tourSkip=document.createElement('button'); tourSkip.textContent='Pular introdução ✕'; tourSkip.id='tourskip'; tourSkip.className='hud-pill';
document.body.append(tourCap,tourSkip);
const tourBtn=document.createElement('button'); tourBtn.textContent='▶ Tour dos boxes'; tourBtn.id='tourbtn'; tourBtn.className='hud-pill'; document.body.appendChild(tourBtn);
const tourWake=[], RT=p=>Promise.race([p,new Promise(r=>tourWake.push(r))]);   // "Pular" acorda qualquer espera
const wait=ms=>RT(new Promise(r=>setTimeout(r,ms)));
function lookAtPt(cx,cz,lx,lz,dur,pit){ const ty=Math.atan2(-(lx-cx),-(lz-cz)); let d=ty-yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); camAnim={t:0,dur,fx:camera.position.x,fz:camera.position.z,tx:cx,tz:cz,fy:yaw,ty:yaw+d,fp:pitch,tp:pit}; return wait(dur*1000+80); }
function walkBeto(path){ return RT(new Promise(res=>{ follow={api:vend}; vend.walkTo(path,()=>{ follow=null; res(); },5); })); }
const fala=t=>RT(vend.fala(t));
async function runTour(){
  if(tourOn||!vend.walkTo||!vend.fala) return;
  tourOn=true; tourStop=false; fimTour=false; tourSkip.style.display='block'; tourBtn.style.display='none'; try{ localStorage.setItem('ceasa_tour','1'); }catch(e){}
  const stop=()=>tourStop;
  try{
    // boas-vindas na entrada
    const bp=vend.pos(); await lookAtPt(0,16.2,bp.x,bp.z,.5,-.02); if(stop()) throw 0;
    tourCap.textContent='BEM-VINDO AO NEW CEASA'; tourCap.style.display='block';
    await fala('Fala, chefe! Eu sou o Beto. Vou te mostrar os boxes, bem rapidinho.'); if(stop()) throw 0;
    for(const [z,L,R] of [[6,1,5],[-2,2,6],[-10,3,7],[-18,4,8]]){
      tourCap.style.display='none';
      await walkBeto([[.4,Math.min(vend.pos().z,13)],[.4,z]]); if(stop()) throw 0;
      for(const [side,n] of [[-1,L],[1,R]]){
        tourCap.textContent='BOX 0'+n+' · '+TOUR_NOME[n]; tourCap.style.display='block';
        // Beto fica de frente pro box, a câmera atrás dele do outro lado do corredor (os dois + o banner no quadro)
        const mv=RT(new Promise(res=>vend.walkTo([[side*.7,z]],res,5)));
        await Promise.all([lookAtPt(-side*3.0,z+2.2,side*4.3,z,.8,.2),mv]); if(stop()) throw 0;
        await fala(TOUR_TXT[n]); if(stop()) throw 0;
      }
    }
    tourCap.textContent='CAIXARIA E XEPA';
    await walkBeto([[.4,-24]]); if(stop()) throw 0;
    await lookAtPt(2.2,-21.4,.4,-24,1.1,0); if(stop()) throw 0;
    await fala('No fundo, caixaria e xepa.'); if(stop()) throw 0;
    fimTour=true;
  }catch(e){ if(e!==0) console.warn('tour',e); }
  vend.fala(''); follow=null; camAnim=null; pitch=-.04; tourOn=false; tourCap.style.display='none'; tourSkip.style.display='none'; tourBtn.style.display='block';
  if(!stop()){ const p=vend.pos(); vend.walkTo([[.4,p.z],[.4,13],[2.1,13.8]],()=>{}); }
  if(fimTour&&vend.abrirCom) setTimeout(()=>vend.abrirCom('Agora me diz: quer que eu puxe da **sua última compra**, ou tem algo que você **procura hoje**? Se preferir, escolhe sozinho: aponta pra uma caixa e aperta **E**.',[
    {label:'🔁 Puxar a última compra',act:()=>ultimaCompra()},
    {label:'🔎 Procuro algo hoje',send:'o que vocês têm hoje?'},
    {label:'👆 Prefiro escolher sozinho',act:()=>{ vend.close(); vend.fala('Fechou! Aponta pra caixa e aperta E pra pôr no pedido. Q tira a última, F fecha o pedido. Se precisar, é só me chamar.'); }},
  ]),400);
}
tourSkip.onclick=()=>{ tourStop=true; vend.fala(''); camAnim=null; tourWake.splice(0).forEach(r=>r()); };
tourBtn.onclick=()=>runTour();
