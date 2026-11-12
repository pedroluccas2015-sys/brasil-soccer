# Força dos clubes — temporada 2026

Os 208 clubes recebem entre **1 e 5 estrelas**. As estrelas pertencem exclusivamente ao clube: atletas não têm overall na interface nem nos registros hidratados, inclusive elencos importados. Os atributos técnicos internos continuam necessários para executar os movimentos e a física, com um modificador coletivo derivado da força do clube.

## Referências oficiais

- [Ranking Nacional de Clubes da CBF 2026](https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/RNC_Ranking_Nacional_dos_Clubes_2026_27e24418e7.pdf), atualizado em 23/12/2025: 235 clubes.
- [Ranking de Clubes CONMEBOL 2026](https://cdn.conmebol.com/wp-content/uploads/2025/12/Ranking-de-Clubes-CONMEBOL-2026-1.pdf), emitido em 15/12/2025: 308 registros, incluindo clubes explicitamente indicados como sem ranking.

As tabelas extraídas estão em `data/rankings/`. Posição, pontuação e federação/país são conservados. Empates de posição são mantidos. A associação entre nomes e IDs distingue Botafogo-RJ/SP/PB, Fluminense-RJ/PI, Vitória-BA/ES e outros homônimos.

**As entidades publicam rankings e pontos, não estas estrelas.** A conversão abaixo é uma regra do jogo, com consulta registrada em 12/11/2026.

## Conversão

Cada pontuação é normalizada dentro de sua fonte: `20 + 80 × sqrt(pontos / pontos do líder)`. Os líderes têm 16.314 pontos na CBF e 9.828,6 na CONMEBOL.

- Brasileiros com ambas as fontes: 75% da força CBF e 25% da força CONMEBOL.
- Brasileiros com apenas CBF: força CBF.
- Estrangeiros e demais clubes com apenas CONMEBOL: força CONMEBOL.
- **Ausentes dos rankings ou registrados como S/R sem outra fonte válida: 1 estrela, força 20.** Nenhuma posição oficial é inventada. Clubes classificados com zero pontos também recebem a força mínima.

| Estrelas | Força interna |
| --- | --- |
| 1 | 20 a menos de 36 |
| 2 | 36 a menos de 52 |
| 3 | 52 a menos de 68 |
| 4 | 68 a menos de 84 |
| 5 | 84 a 100 |

Distribuição desta edição: 73 clubes com 1 estrela, 68 com 2, 38 com 3, 19 com 4 e 10 com 5. Dentro da mesma faixa, a força contínua preserva diferenças entre clubes.

Execute `node tools/build-club-ratings.js` para regenerar as notas a partir das tabelas oficiais locais. Depois execute `node tools/build-data.js` para atualizar o pacote offline. As notas e as referências utilizadas ficam em `competitions.clubRatings`.

## Efeito nos torneios e partidas

Os placares simulados deixam de tratar todos os adversários como iguais. A diferença de força muda a expectativa de gols de cada equipe, com uma vantagem moderada para o mandante. O placar continua aleatório e depende da semente salva. Os pênaltis são simulados cobrança por cobrança, com probabilidades diferentes por força e encerramento antecipado/morte súbita. As mesmas regras ponderam os desempates de jogos empatados e as fases continentais simuladas em paralelo.

Nos jogos controlados, a força coletiva afeta a precisão técnica, a reação e a tomada de decisão dos companheiros e da CPU. Não altera o resultado já obtido pelo jogador. Reservas e titulares usam a mesma base coletiva. Saves existentes conservam os resultados anteriores; apenas jogos futuros usam o novo modelo.

## Verificação

`tests/club-ratings.test.js` verifica a cobertura dos 208 clubes, a regra de 1 estrela para ausentes, os homônimos, a retirada de overall, o efeito na partida e a reprodução por save/load. Também mede milhares de partidas e disputas por pênaltis e 500 Copas do Brasil completas. As probabilidades são escolhas de balanceamento do jogo, não previsões oficiais das entidades.
