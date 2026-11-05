/* BOOT da NEW CEASA: carrega o three.js (módulo) e depois os scripts da loja, um por um, na ordem abaixo.
 * A ORDEM IMPORTA: cada arquivo usa o que os anteriores definiram, e a cena é sorteada com semente (mudar a ordem muda a cena). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
Object.assign(window, { THREE, RoomEnvironment, mergeGeometries });
window.__ceasaOk = true;
const ORDEM = [
  "loja/config.js",
  "js/nucleo/base.js",
  "loja/catalogo.js",
  "js/nucleo/estado.js",
  "js/nucleo/cena.js",
  "js/cena/texturas.js",
  "js/cena/piso.js",
  "js/cena/ceu.js",
  "js/cena/galpao.js",
  "js/cena/frutas.js",
  "js/cena/embalagens.js",
  "js/cena/pallets.js",
  "js/cena/bancas.js",
  "js/cena/props.js",
  "loja/montagem.js",
  "js/ui/ficha.js",
  "js/ui/carrinho.js",
  "js/ui/checkout.js",
  "js/ui/vitrine.js",
  "js/ui/lista.js",
  "loja/beto.js",
  "js/ui/telao.js",
  "js/ui/totem-ligacao.js",
  "js/tour.js",
  "js/controles.js",
  "js/loop.js"
];
for (const src of ORDEM) {
  await new Promise((ok, falha) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => falha(new Error('não carregou ' + src)); document.body.appendChild(s); });
}
