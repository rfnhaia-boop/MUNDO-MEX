/* Gerentes fotográficos (Google Flow): Nara (2º andar) e Téo (3º andar) viram sprites que olham pra câmera.
   O Ravi (1º andar) é trocado aqui só no modo dono; na visita quem troca é o visita.js. */
(function(){
const S=window.__SEDE; if(!S||!S.THREE||!S.MGRS){ console.warn('personagens.js: ganchos ausentes'); return; }
const T=S.THREE, TL=new T.TextureLoader();
function sprite(m, file, ratio){
  const agent=m.a, h=1.82;
  const t=TL.load(file); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8;
  const pic=new T.Mesh(new T.PlaneGeometry(h*ratio,h), new T.MeshBasicMaterial({map:t,transparent:true,alphaTest:.35,toneMapped:false}));
  pic.position.y=h/2;
  const sh=new T.Mesh(new T.CircleGeometry(h*ratio*.42,24), new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false}));
  sh.rotation.x=-Math.PI/2; sh.position.y=.012;
  agent.children.forEach(c=>{ if(!c.userData||!c.userData.shop) c.visible=false; });
  agent.add(pic); agent.add(sh);
  const wp=new T.Vector3();
  S.ANIM.push(()=>{ agent.getWorldPosition(wp); const c=S.camera.position; pic.rotation.y=Math.atan2(c.x-wp.x,c.z-wp.z)-agent.rotation.y; });
}
if(!window.__VISITA && S.MGRS[0]) sprite(S.MGRS[0],'../shared/personagens/ravi-em-pe.png',.341);
if(S.MGRS[1]) sprite(S.MGRS[1],'../shared/personagens/nara-em-pe.png',.33);
if(S.MGRS[2]) sprite(S.MGRS[2],'../shared/personagens/teo-em-pe.png',.332);
})();
