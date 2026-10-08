# Partida normal — revisão arcade

Base: pedroluccas2015-sys/brasil-soccer, revisão 7887997 (baixada em 08/10/2026).

## Escopo

Recriação original de movimentação e animações com inspiração arcade 16-bit em Super Cup Soccer. Não é emulação nem transposição exata da ROM. O cabeçalho do arquivo fornecido identifica SUPER CUP SOCCER; a ROM não foi executada, descompilada nem incluída neste pacote. Não foram extraídos sprites, código ou parâmetros físicos do cartucho.

Referência pública complementar: descrição oficial de Jaleco Sports: Goal!, que inclui Super Cup Soccer, em https://store.steampowered.com/app/3399110/Jaleco_Sports_Goal/ . A referência confirma ações como chute, bloqueio, cabeçada, bicicleta, passe e roubo de bola; não fornece valores de física para reproduzir fielmente o original.

## Alterações

- Aceleração, mudança de direção e frenagem mais rápidas, sem vantagem de velocidade na diagonal.
- Integração da movimentação consistente em 30, 60 e 120 Hz.
- Condução com deslocamento da bola ligado às passadas, toque mais longo em velocidade e bola ainda disputável.
- Carrinho mantém a direção de lançamento; queda interrompe a movimentação.
- Oito orientações visuais, corrida com oito fases e poses de recepção, chute, lançamento, cabeceio, bicicleta, carrinho, queda e defesa. A bicicleta usa a ação contextual existente quando a bola está alta e o jogador está de costas para o gol.
- IA com perseguidor, cobertura, marcações distribuídas, antecipação de bola livre, recepção prioritária e apoio evitando impedimento.
- Passe da IA avalia corredor, distância, espaço, avanço e impedimento; goleiro procura saída e reage conforme o nível.
- Cache de sprites limitado e separado também pela cor das meias.

## Dificuldades da partida

Os nomes e a seleção existentes foram preservados. A velocidade e os atributos físicos dos jogadores não recebem bônus por dificuldade. Companheiros automáticos do usuário usam o mesmo perfil Normal em todos os níveis.

| Nível | Revisão do plano | Decisão com bola | Antecipação máxima | Comportamento |
|---|---:|---:|---:|---|
| Fácil | 0,65 s | 1,05 s | 0,10 s | Menor pressão, visão curta e maior erro de execução |
| Normal | 0,38 s | 0,72 s | 0,25 s | Pressão e marcação moderadas |
| Difícil | 0,22 s | 0,46 s | 0,42 s | Cobertura, marcação próxima e mais opções de passe |
| Craque | 0,13 s | 0,30 s | 0,58 s | Antecipação e pressão maiores, execução mais precisa |

Esses valores são ajustes originais desta implementação. A percepção de dificuldade e a fidelidade ao ritmo da referência ainda dependem de avaliação humana jogando.

## Preservação

Sem alterações em js/input.js, js/touch-controls.js, js/penalty.js, js/penalty-renderer.js, js/penalty-ui.js, js/ball.js e js/physics.js. As rotinas de cobrança e disputa de pênaltis dentro de match.js também foram preservadas. O novo movimento e a nova IA são executados apenas fora do estado de pênalti; esse estado retorna antes da simulação da partida normal.

## Validação executada

- 37 testes automatizados: 23 de núcleo, 4 de toque e 10 novos de jogabilidade.
- Simulações completas nos quatro níveis, sem bloqueio ou coordenadas inválidas.
- Comparação com a base original: 16 disputas de pênaltis (quatro sementes × quatro dificuldades), com amostras de quadros e resultados idênticos.
- Suíte de navegador Edge: partida, passe, chute, controles, substituição, intervalo, competição, pênaltis, quatro tamanhos de tela e execução offline.
- Teste visual automatizado: oito direções distintas, fases de corrida, ações e cor das meias no cache.
- Captura da partida inspecionada visualmente. Nenhum erro de console na suíte de navegador.

## Executar

Abra index.html no navegador ou execute npm start e acesse http://localhost:8000. Nenhum controle precisa ser reconfigurado.

Testes: npm test. Testes de navegador: com o servidor iniciado, npm run test:browser (requer Playwright e navegador instalado).

O pacote contém as alterações locais. O repositório remoto do GitHub não foi modificado.
