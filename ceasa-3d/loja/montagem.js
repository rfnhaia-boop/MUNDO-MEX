'use strict';
/* MONTAGEM DO PAVILHÃO
 * Onde fica cada box (banca), a caixaria e a xepa. Roda depois de todas as peças da cena.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== monta tudo ========== */
// (sem caminhão e sem carrinhos soltos: o galpão é fechado, com uma única abertura pra rua)
// carga descarregada em frente ao caminhão
pallet({x:-10.5,z:10.4,ry:0,p:P.laranja,layers:3,wrap:true}); col(-11.2,-9.8,9.7,11.1);
pallet({x:-9.0,z:10.2,ry:.1,p:P.banprata,layers:3,wrap:true}); col(-9.7,-8.3,9.5,10.9);
pallet({x:-12.1,z:10.1,ry:-.1,p:P.gala,layers:3,wrap:false}); col(-12.8,-11.4,9.4,10.8);
platformScale(6.8,16.6);
pallet({x:11,z:16,ry:0,p:P.kcx,layers:5}); col(10.3,11.7,15.3,16.7);
pallet({x:13.2,z:16.2,ry:.1,p:P.pcx,layers:5}); col(12.5,13.9,15.5,16.9);
pallet({x:15.2,z:15.6,ry:-.05,p:P.ccx,layers:6}); col(14.5,15.9,14.9,16.3);

stall({s:-1,zc:6, num:1,name:'BANANAS',          color:'#f2cd2e',items:[P.banprata,P.bannanica,P.banmaca]});
stall({s:-1,zc:-2,num:2,name:'CITRUS',           color:'#f08a14',items:[P.laranja,P.limao,P.tanger]});
stall({s:-1,zc:-10,num:3,name:'MAÇÃ E PERA',     color:'#e0394a',items:[P.gala,P.fuji,P.pera]});
stall({s:-1,zc:-18,num:4,name:'UVAS E FINAS',    color:'#7c4dd6',items:[P.uva,P.morango,P.kiwi,P.pessego,P.goiaba]});
stall({s:1,zc:6,  num:5,name:'TROPICAIS',        color:'#e3a52f',items:[P.manga,P.abacaxi,P.maracuja,P.mamao,P.coco]});
stall({s:1,zc:-2, num:6,name:'MELANCIA E LEGUMES', color:'#4fb35c',items:[P.melancia,P.melao,P.tomate,P.pimentao,P.abobrinha]});
stall({s:1,zc:-10,num:7,name:'LEGUMES E RAÍZES', color:'#c98a3a',items:[P.berinjela,P.batata,P.cebola,P.cenoura,P.alho]});
stall({s:1,zc:-18,num:8,name:'VERDURAS E FOLHAS', color:'#6aa832',items:[P.alface,P.repolho,P.couve,P.cheiroverde]});
// caixaria (embalagens vazias) agora fica no fundo, ao lado da xepa
placeDisplay(P.kcx,-9.6,-27.6,-1,2); placeDisplay(P.pcx,-7.4,-27.6,-1,2); placeDisplay(P.ccx,-5.2,-27.6,-1,2);
// xepa no fundo
placeDisplay(P.xepa,-3.0+.2,-27.6,-1,2); // usa o mesmo padrão de ficha
binXepa(5.2,-28.2);
const xs=new THREE.Mesh(new THREE.PlaneGeometry(3,.7),new THREE.MeshBasicMaterial({map:ctex(512,120,(g,w,h)=>{ g.fillStyle='#14111c'; g.fillRect(0,0,w,h); g.fillStyle='#8b5cf6'; g.fillRect(0,0,w,8); g.fillStyle='#fff'; g.font='800 50px "Segoe UI",system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('XEPA · FIM DO DIA',w/2,h/2+4); })})); xs.position.set(1.1,2.2,-30.7); scene.add(xs);
finalizeBags();

// contorno da caixa apontada
const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:'#c4b5fd',transparent:true,opacity:.9,depthTest:false}));
outline.visible=false; outline.renderOrder=10; scene.add(outline);
