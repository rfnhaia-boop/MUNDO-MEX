/* Guia 3D de verdade: modelo com esqueleto (ravi-rosto-rig.glb, gerado por IA + rig no Blender) e animações idle/walk/talk/wave/sit/sit_talk.
   Fábrica window.__GUIA3D.make(grupo) -> {root, play(nome)}. Cada chamada cria uma instância (só uma aparece por vez: é UM guia). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
const S=window.__SEDE;
const pronto=new Promise(res=>new GLTFLoader().load('../shared/personagens/'+(window.GUIA_ARQUIVO||'ravi-rosto-rig.glb'),res,undefined,e=>{ console.warn('guia3d: modelo não carregou',e); res(null); }));
const USAR_3D=/[?&]3d=1/.test(location.search);
window.__GUIA3D={
  sprite(agent,file,h,ratio,y0){ y0=y0||0; const t=new THREE.TextureLoader().load(file); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
    const pic=new THREE.Mesh(new THREE.PlaneGeometry(h*ratio,h),new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.35,toneMapped:false})); pic.position.y=y0+h/2; agent.add(pic);
    if(!y0){ const sh=new THREE.Mesh(new THREE.CircleGeometry(h*ratio*.42,24),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.28,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=.012; agent.add(sh); }
    const wp=new THREE.Vector3(); S.ANIM.push(()=>{ agent.getWorldPosition(wp); const c=S.camera.position; pic.rotation.y=Math.atan2(c.x-wp.x,c.z-wp.z)-agent.rotation.y; }); return pic; },
  async make(parent,opt){ opt=opt||{}; if(!USAR_3D) return null; const g=await pronto; if(!g||!S) return null;
    const root=SkeletonUtils.clone(g.scene);
    root.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; const m=o.material.clone(); m.roughness=.75; m.metalness=0; if(m.map){ m.emissive=new THREE.Color('#ffffff'); m.emissiveMap=m.map; m.emissiveIntensity=.42; } o.material=m; } });
    const mixer=new THREE.AnimationMixer(root), acts={}; g.animations.forEach(a=>acts[a.name]=mixer.clipAction(a));
    let cur=null; const play=(n,fade)=>{ const a=acts[n]; if(!a||cur===a) return; a.reset().fadeIn(fade==null?.25:fade).play(); if(cur) cur.fadeOut(fade==null?.25:fade); cur=a; };
    play(opt.inicial||'idle',0); parent.add(root);
    S.ANIM.push((t,dt)=>{ let v=root.visible; for(let p=root.parent;v&&p;p=p.parent) v=p.visible; if(v) mixer.update(dt); });
    return {root,mixer,play,acts};
  },
  esconderCorpoAntigo(grupo,manter){ grupo.children.forEach(c=>{ if(c===manter) return; if(c.userData&&c.userData.shop) return; c.visible=false; }); }
};

/* só o guia fica: tira todos os outros agentes (bonecos de bloco) e os gerentes Nara/Téo; depois os agentes entram um por vez */
if(S&&S.FL&&S.MGRS){
  const manter=new Set([S.MGRS[0]&&S.MGRS[0].a]);
  S.FL.forEach(f=>{ const del=[]; f.traverse(o=>{ if(o.userData&&o.userData.legs&&!manter.has(o)) del.push(o); }); del.forEach(o=>o.parent&&o.parent.remove(o)); });
  for(const i of [1,2]){ const a=S.MGRS[i]&&S.MGRS[i].a; if(a&&a.parent) a.parent.remove(a); }
}

/* modo dono: o Ravi 3D é o guia dos três andares. Os "gerentes" 1 e 2 passam a ser ele mesmo; ele muda de andar junto com você. */
if(S&&S.MGRS&&S.MGRS[0]&&!window.__VISITA){
  const R=S.MGRS[0];
  (async()=>{ const G3=await window.__GUIA3D.make(R.a); if(!G3){ window.__GUIA3D.esconderCorpoAntigo(R.a,null); window.__GUIA3D.sprite(R.a,'../shared/personagens/ravi-rosto-em-pe.png',1.82,0.339); return; } window.__GUIA3D.esconderCorpoAntigo(R.a,G3.root);
    S.ANIM.push(()=>G3.play(R.waveT>0?'wave':R.walking?'walk':R.talking?'talk':'idle')); })();
  S.MGRS[1]=R; S.MGRS[2]=R;
  let ultimo=0;
  S.ANIM.push(()=>{ R.a.visible=true; const f=window.__dbg&&window.__dbg.st().fidx; if(f==null||f===ultimo||!S.FL[f]) return; ultimo=f;
    if(R.a.parent) R.a.parent.remove(R.a); S.FL[f].add(R.a); R.a.position.set(0,0,8.2); R.a.rotation.y=Math.PI; R.yaw=Math.PI; R.path=[]; R.cfg.f=f; R.faceCam=false;
    R.a.traverse(o=>{ if(o.userData&&o.userData.info&&o.userData.info.mgr!=null){ o.userData.info.mgr=f; o.userData.f=f; } }); });
}
