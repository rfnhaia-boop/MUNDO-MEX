'use strict';
/* ESTADO COMPARTILHADO
 * Flags que vários módulos leem/escrevem (chat aberto, mira travada, câmera, animações).
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
let chatOn=false;
let locked=false, free=false, drag=0, yaw=0, pitch=-.04, mx=0, my=0;
let camAnim=null, flashT=0, flashM=null, follow=null;
