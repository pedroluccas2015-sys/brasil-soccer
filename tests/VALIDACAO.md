# Verificação da build — 30/09/2026

Ambiente: Windows, Node.js, Microsoft Edge/Chromium via Playwright. Servidor local e abertura `file://` verificados. Nenhum erro JavaScript ou mensagem de console de nível error no percurso automatizado concluído.

## Testes de lógica: 14/14 aprovados

- Integridade dos 20 clubes e elencos; nomes únicos por clube e atributos entre 1–99.
- Calendário de 38 rodadas: 380 confrontos únicos, 19 mandos por clube, sem equipe duplicada na rodada.
- Pontuação, classificação, temporada completa e save/load.
- Chave da copa, sete confrontos e campeão.
- Física: parábola, quique, atrito e repouso.
- Separação de jogadores em colisões.
- Impedimento nas duas direções, em relação à bola, meio-campo e penúltimo defensor.
- Gol, poste, lateral, escanteio e tiro de meta.
- Cronômetro, intervalo, troca de lados e fim.
- Falta por carrinho, cartão e limite de substituições.
- Escalação e formação aplicadas ao visitante controlado.
- Encerramento antecipado de disputa de pênaltis.
- Validação e persistência da importação de elenco.
- Três partidas completas de IA, com sementes diferentes, sem coordenadas inválidas ou bloqueios. Os últimos placares observados foram 0–0, 2–4 e 0–1; todos chegaram ao fim.

## Navegador

Percurso real de interface e teclado: menu → seleção → formação → saída de bola → movimento → ações → pausa → substituição confirmada → intervalo → fim → reinício. Brasileirão iniciado, primeira rodada concluída, classificação atualizada e restaurada após recarregar. Pênalti cobrado pelo teclado. Esquema WASD selecionado, chute redefinido e persistência conferida. O relógio foi avançado programaticamente no percurso de interface; a duração completa foi coberta pelas simulações de lógica.

Cenários controlados dentro do navegador verificaram gol após chute, defesa de goleiro, cobranças de lateral, escanteio, tiro de meta e falta, pênalti causado por infração, impedimento e conclusão da copa. Gamepad API testada com dispositivo padrão simulado, incluindo direção, passe, corrida e soltura do botão. Nenhum controle físico foi testado.

Capturas inspecionadas: `menu.png`, `match.png`, `league.png` e `mobile-menu.png`. Também foram gravadas `result.png` e `penalties.png`. O layout de menu cabe em 390 px; a partida exige teclado ou gamepad, pois não há controles touch.

Os testes cobrem os comportamentos acima, não certificam todas as situações possíveis ou a fidelidade às regras oficiais. Firefox, Safari e hardware de gamepad continuam sem verificação prática. O loop usa 60 ticks/s; não foi feito benchmark prolongado de FPS em vários equipamentos.

Reproduzir: `node --test tests/core.test.js`; iniciar `node tools/serve.js` e executar `node tests/browser.cjs`. Playwright é necessário apenas no teste de navegador.

## Atualização de pênaltis — 07/10/2026
20 testes de lógica aprovados. Edge headless: teclado, seleção de nove cobradores sem duplicatas, finta, três forças, pausa, defesa, Gamepad API com disposição SNES, retorno ao segundo tempo, HTTP e file:// aprovados; nenhum erro no console. Imagens: penalty-defense.png e penalty-in-match.png. Não houve teste de controle físico nem comparação quadro a quadro com a ROM.

## Bola física e animada
23 testes de lógica aprovados: giro/repouso, quique, rede nos dois lados, placar sem duplicação, voo e espalmada durante o resultado. Verificação visual em tests/ball-animation.png. Os quadros do modelo são armazenados em cache e o giro é atualizado na simulação, respeitando a pausa.

## Escala 16:9
Canvas 480×270, escala proporcional sem arredondamento inteiro, partida ocupando o maior retângulo 16:9 da janela. Validado no navegador em 1920×1080, 1366×768, 1024×768 e 390×844, nos modos normal e pênaltis, incluindo redimensionamento e pausa com rolagem. Sem erros no console. Captura: layout-16x9.png.
