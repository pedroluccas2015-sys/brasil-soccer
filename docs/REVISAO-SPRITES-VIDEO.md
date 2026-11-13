# Revisão visual a partir do vídeo

Referência observada: Pixel Cup Soccer Ultimate, vídeo https://www.youtube.com/watch?v=E9Q1bVbGo6k. O desenho foi refeito a partir dos quadros de jogo, com cabeças arredondadas em pixels, olhos menores, diferentes cabelos, pescoço, camisa curta, calção separado e membros articulados. Os uniformes dos clubes continuam disponíveis.

A camisa é rasterizada entre ombro e quadril, em vez de usar uma linha espessa que cobria calção e pernas. Rostos de frente, de costas e de perfil têm desenhos próprios e espelhamento coerente. Carrinho, goleiro, atletas e arbitragem usam a mesma paleta e o mesmo desenho de rosto.

A revisão cobre 25 poses nas oito direções: parado, corrida, arrancada, domínio, passe, cruzamento, chute, cobrança, cabeceio, voleio, bicicleta, carrinho, queda, mergulho, encaixe, bola nas mãos, lateral, comemoração, desarme, apito, relógio, indicação, bandeira, drible e chute colocado. Os sprites são compartilhados entre todas as câmeras e modos, incluindo pênaltis e cutscenes.

Os quadros de carrinho e poses aéreas ganharam espaço para evitar recortar pés, cabeça e braços. Foram mantidos os tempos de animação, as articulações, os controles e a jogabilidade.

Validação: 206 testes aprovados. Os novos testes percorrem todas as poses, modelos de atleta/goleiro/árbitro, oito direções e diferentes fases para detectar recortes e pixels fracionários. Também verificam o espelhamento dos rostos, a ausência de olhos nas costas e a coerência do rosto no carrinho.

Galeria interativa: tests/video-sprites.html. Ela permite animar, avançar quadros, escolher modelo e direção, e alternar entre todas as poses e oito direções.
