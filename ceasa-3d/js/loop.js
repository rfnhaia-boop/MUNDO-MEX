'use strict';
/* LOOP
 * Movimento, câmera, mira (raycast) e render a cada quadro. Inicia o desempenho automático (NewPerf).
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== loop ========== */
const clock=new THREE.Clock(), fwd=new THREE.Vector3(), rgt=new THREE.Vector3(), ray=new THREE.Raycaster(), ray2=new THREE.Raycaster(); ray.far=7; ray2.far=26;
let bob=0, rc=0, hov=null;
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.05);
  if(follow){ const bp=follow.api.pos(), hd=follow.api.heading(); if(bp){ const k=Math.min(1,dt*2.6); const tx=bp.x-hd.x*2.5-hd.z*.55, tz=bp.z-hd.z*2.5+hd.x*.55; camera.position.x+=(tx-camera.position.x)*k; camera.position.z+=(tz-camera.position.z)*k;
    const lx=bp.x+hd.x*1.6, lz=bp.z+hd.z*1.6; const ty=Math.atan2(-(lx-camera.position.x),-(lz-camera.position.z)); let d=ty-yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); yaw+=d*Math.min(1,dt*3); pitch+=(-.12-pitch)*Math.min(1,dt*3); } }
  if(camAnim){ const a=camAnim; a.t=Math.min(1,a.t+dt/a.dur); const e=a.t<.5?2*a.t*a.t:1-Math.pow(-2*a.t+2,2)/2; camera.position.x=a.fx+(a.tx-a.fx)*e; camera.position.z=a.fz+(a.tz-a.fz)*e; yaw=a.fy+(a.ty-a.fy)*e; pitch=a.fp+(a.tp-a.fp)*e; if(a.t>=1) camAnim=null; }
  if(free&&locked&&!modalOn&&!catalogOn&&!chatOn&&!camAnim&&!follow&&!tourOn){ const dz=v=>Math.abs(v)<.12?0:(v-Math.sign(v)*.12)/.88; yaw-=dz(mx)*dt*2.4; pitch=Math.max(-1.35,Math.min(1.35,pitch-dz(my)*dt*1.6)); }
  let moving=false;
  if(locked&&!modalOn&&!catalogOn&&!chatOn&&!camAnim&&!follow&&!tourOn){
    const sp=(keys.ShiftLeft||keys.ShiftRight?5.5:3.2)*dt;
    const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0), r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
    fwd.set(-Math.sin(yaw),0,-Math.cos(yaw)); rgt.set(Math.cos(yaw),0,-Math.sin(yaw));
    const dx=(fwd.x*f+rgt.x*r)*sp, dzz=(fwd.z*f+rgt.z*r)*sp;
    if(dx||dzz){ moving=true; bob+=dt*(keys.ShiftLeft?11:8); }
    if(!hit(camera.position.x+dx,camera.position.z)) camera.position.x+=dx;
    if(!hit(camera.position.x,camera.position.z+dzz)) camera.position.z+=dzz;
  }
  camera.position.y=1.65+(moving?Math.sin(bob)*.016:0);
  camera.rotation.set(pitch,yaw,0);
  vend.frame(dt,camera.position); if(telao) telao.update(dt);
  if(flashT>0){ flashT-=dt; if(chatOn&&flashM){ outline.visible=true; outline.position.copy(flashM.position); outline.quaternion.copy(flashM.quaternion); outline.scale.set(1.04,flashM.userData.h+.02,1.26); outline.position.y=flashM.userData.h/2; } }
  if(modalOn||catalogOn||chatOn){ hideCard(); vend.tip(false); totemTip.style.display='none'; if(!(chatOn&&flashT>0)) outline.visible=false; hov=null; }
  else if(locked&&(rc++&1)===0){
    ray.setFromCamera({x:0,y:0},camera);
    const h=ray.intersectObjects(pickMeshes,false)[0];
    hov=h?h.object:null;
    if(!hov&&telao){ ray2.setFromCamera({x:0,y:0},camera); if(ray2.intersectObject(telao.pick,false)[0]) hov=telao.pick; }
    if(hov&&hov.userData.vendor){ hideCard(); vend.tip(true); totemTip.style.display='none'; $('cross').classList.add('hot'); outline.visible=false; }
    else if(hov&&(hov.userData.totem||hov.userData.telao)){ hideCard(); vend.tip(false); totemTip.textContent=hov.userData.telao?'E · ver as fotos de todo o pavilhão':'E · usar o totem do Box '+String(hov.userData.totem.num).padStart(2,'0')+' (fotos reais e estoque)'; totemTip.style.display='block'; $('cross').classList.add('hot'); outline.visible=false; }
    else if(hov){ totemTip.style.display='none'; vend.tip(false); showCard(hov.userData.p); $('cross').classList.add('hot'); outline.visible=true; outline.position.copy(hov.position); outline.quaternion.copy(hov.quaternion); outline.scale.set(1.04,hov.userData.h+.02,1.26); outline.position.y=hov.userData.h/2; }
    else { hideCard(); vend.tip(false); totemTip.style.display='none'; $('cross').classList.remove('hot'); outline.visible=false; }
  }
  renderer.render(scene,camera);
}
frame();
window.__dbg={ pick:()=>{ const rc=new THREE.Raycaster(); rc.setFromCamera({x:0,y:0},camera); return rc.intersectObjects(scene.children,true).slice(0,4).map(h=>{ const o=h.object,m=o.material; return {d:+h.distance.toFixed(2),geo:o.geometry&&o.geometry.type,pos:o.position.toArray().map(v=>+v.toFixed(2)),rotY:+o.rotation.y.toFixed(2),mat:m&&m.type,col:m&&m.color?m.color.getHexString():null,map:!!(m&&m.map),side:m&&m.side,inst:!!o.isInstancedMesh}; }); }, add:(id,q=1)=>add(P[id],q), open:()=>openCheckout(), go:(x,z,y,p)=>{ camera.position.x=x; camera.position.z=z; yaw=y; pitch=p; locked=true; free=false; overlay.style.display='none'; }, info:()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,pick:pickMeshes.length,bags:bags.reduce((a,b)=>a+b.m.length,0)}), pose:()=>({x:camera.position.x,z:camera.position.z,yaw,pitch}) };
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

if(window.NewPerf) NewPerf.attach(renderer,scene);
