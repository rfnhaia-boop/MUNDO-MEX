# MUNDO NEW / MEX · Ecossistema Espacial 3D (2027)

Ecossistema imersivo de comércio espacial e visualização arquitetural 3D em tempo real construído com **Three.js**, materiais **PBR**, áudio procedural via **Web Audio API** e física em 60 FPS estáveis.

---

## 🏙️ Arquitetura da Avenida NEW (Dois Lados da Rua)

A avenida foi concebida sob uma lógica urbanística dual que separa operações ativas de protótipos conceituais:

### 🟢 Lado Sul: Lojas Reais & Abertas
- **`NEW Wear` (`/roupas-3d` e vitrine 2027)**: Boutique de moda streetwear e luxo. Possui trilho aéreo suspenso em latão escovado com física de pêndulo e inércia em tempo real, sustentando produtos reais da Nike (Air Jordan 1 High OG Chicago, Dunk Low Panda, Tech Fleece) e jaquetas de couro legítimo biker.
- **`SEDE Tower` (`/sede-3d` e torre 38m)**: Complexo central corporativo com seletor vertical de andares e elevador panorâmico (*Michon Motion Style*), abrigando a Central Executiva NEX, o NEW ERP e a mesa de operações quantitativas WIN Trader.

### 🔵 Lado Norte: Moldes & Protótipos de Ecossistema
- **`NEW Mercado` (`/mercado-3d` e molde 01)**: Molde de hipermercado inteligente com 12 metros de profundidade, adega de vinhos, geladeiras expositoras com iluminação fria, gôndolas de mercearia fina, ilha de hortifruti fresco com iluminação quente, padaria artesanal e caixas de autoatendimento com leitor laser.
- **`NEW CEASA` (`/ceasa-3d`)**: Molde de atacado hortifruti fresco.
- **`NEW Pet` (`/pet-3d`)**: Centro estético e produtos pet.
- **`NEX 3D` (`/nex-3d`)**: Agência e sistema de inteligência corporativa.
- **`Criador 3D` (`/criador-3d`)**: Construtor de lojas personalizadas no ecossistema.

---

## ⚡ Tecnologias & Engenharia da Experiência

- **Engine 3D:** Three.js (r160) com renderizador WebGL PBR, tone mapping ACES Filmic e sombras suaves PCF.
- **Asfalto Molhado:** Mapeamento de bump, specular reflections e espelho planar em tempo real (*Reflector*).
- **Controles Livres:** Navegação fluida sem trava de cursor (*free cursor*), órbita com mouse drag, zoom suave com scroll e deslocamento a pé com `WASD` / `Setas` + `Shift` para correr.
- **Áudio Procedural:** Sintetizador de áudio nativo Web Audio API com zero latência (passos no asfalto e parquet, pressurização de portas automáticas e chirps de diálogo).

---

## 🚀 Como Executar Localmente

### Opção 1: Via Script Automático (Windows)
Dê dois cliques no arquivo:
```cmd
abrir-lojas.bat
```
Ele iniciará o servidor local e abrirá automaticamente no navegador em:
`http://localhost:8000/mundo/index.html`

### Opção 2: Via Terminal Python
```bash
python -m http.server 8000
```
Acesse:
`http://localhost:8000/mundo/index.html`
