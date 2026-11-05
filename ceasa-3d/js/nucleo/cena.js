'use strict';
/* CENA
 * Renderer, cena, câmera, luzes, limites do galpão e colisores.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== renderer / cena ========== */
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#d8e6f2');
scene.fog = new THREE.Fog('#d9d6cc', 28, 95);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.05).texture;

const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.05, 400);
camera.position.set(0,1.65,16.5);
camera.rotation.order = 'YXZ';

scene.add(new THREE.HemisphereLight('#f4f1e8','#8d8a82',0.9));
const SUN_POS=V3(-14,30,14), SUN_TGT=V3(0,0,-5);
const sun = new THREE.DirectionalLight('#fff0d6',2.1);
sun.position.copy(SUN_POS); sun.target.position.copy(SUN_TGT);
sun.castShadow = true; sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-27,right:27,top:36,bottom:-36,near:1,far:90});
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

const ROOM = {x0:-17,x1:17,z0:-31,z1:21,h:7.5};
const colliders = [];
const addBox = (g,w,h,d,mat,x,y,z,shadow=true)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=shadow; m.receiveShadow=true; g.add(m); return m; };
const col = (x0,x1,z0,z1)=>colliders.push({x0,x1,z0,z1});
