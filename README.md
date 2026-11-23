# Louvre de Raul

Estudo de arquitetura em Three.js: um passeio navegável e simplificado pelo Louvre, modelado inteiramente em código.

## Ambientes

- **Cour Napoléon**: o pátio com a pirâmide de vidro (treliça em losangos), as três pirâmides menores, os espelhos d'água e as alas Richelieu, Denon e Sully, com fachadas, telhados mansarda, águas-furtadas e o Pavillon de l'Horloge. Céu com sol e sombras.
- **Grande Galerie**: abóbada de berço com claraboias, arcos sobre colunas duplas, piso em chevron e 40 molduras vazias para receber desenhos.

Chegue perto da pirâmide para entrar na galeria, e perto da porta de entrada da galeria para voltar ao pátio. O **Mapa** pula direto para nove pontos.

A pirâmide usa as medidas reais aproximadas (base de cerca de 35 m, altura de cerca de 21,6 m). O resto está em escala estimada, e a ligação pátio/galeria é esquemática.

## Controles

- Celular: polegar esquerdo anda, arrastar no resto da tela olha em volta.
- Computador: clique para olhar com o mouse, WASD ou setas andam, Shift corre, M abre o mapa, E entra/sai, Esc solta o mouse.
- Quadros: toque num quadro para colocar uma imagem, ou use "Desenhos" para várias. As imagens ficam só no aparelho.

## Código

Sem build. Three.js 0.170 via CDN (import map).

- `js/main.js`: renderer, troca de ambientes, mapa, interface
- `js/controls.js`: primeira pessoa (teclado, mouse, joystick de toque)
- `js/courtyard.js`: Cour Napoléon
- `js/gallery.js`: Grande Galerie
- `js/textures.js`: texturas procedurais em canvas

Deploy automático no GitHub Pages via `.github/workflows/pages.yml`.
