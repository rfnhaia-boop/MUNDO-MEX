// Coloca (ou tira) imagens de DEMONSTRAÇÃO nos totens da CEASA, só pra ver como a tela fica. Elas aparecem com o selo "Demonstração" e o Beto NÃO as trata como foto real.
// Uso:  node ceasa-demo.mjs          → põe uma imagem de demonstração por produto
//       node ceasa-demo.mjs --limpar → apaga todas as demonstrações (fotos reais do dono nunca são tocadas)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registraDemo, limpaDemos } from './ceasa-dono.mjs';

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'ceasa-3d', 'assets');
if (process.argv.includes('--limpar')) { console.log('demonstrações removidas:', limpaDemos()); process.exit(0); }
const POR_BOX = {
  'banner-bananas.jpg': ['banprata', 'bannanica', 'banmaca'], 'banner-citrus.jpg': ['laranja', 'limao', 'tanger'], 'banner-maca-pera.jpg': ['gala', 'fuji', 'pera'],
  'banner-uvas.jpg': ['uva', 'morango', 'kiwi', 'pessego', 'goiaba'], 'ad-tropicais.jpg': ['manga', 'abacaxi', 'maracuja', 'mamao', 'coco'],
  'ad-melancia.jpg': ['melancia', 'melao', 'tomate', 'pimentao', 'abobrinha'], 'ad-raizes.jpg': ['berinjela', 'batata', 'cebola', 'cenoura', 'alho'], 'ad-verduras.jpg': ['alface', 'repolho', 'couve', 'cheiroverde'],
};
limpaDemos(); let n = 0;
for (const [arq, ids] of Object.entries(POR_BOX)) { const buf = fs.readFileSync(path.join(assets, arq)); for (const id of ids) { registraDemo(buf, id, 'Imagem de demonstração (arte do box)'); n++; } }
console.log('demonstrações criadas:', n);
