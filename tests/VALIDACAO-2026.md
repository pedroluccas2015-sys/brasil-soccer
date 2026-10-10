# Validação da expansão — 10/10/2026

Ambiente: Windows, Node.js, Edge headless com Playwright.

- 97 testes de lógica aprovados, executando cada arquivo `*.test.js` com Node.
- Integridade de 208 clubes e 5.931 registros: IDs, posições, mínimo de 11 atletas e goleiro por equipe.
- Temporadas completas nas sete competições; três versões em pênaltis.
- 380 partidas na Série A; 216 na Série C; 610 na Série D; 97 na Copa do Brasil a partir da terceira fase.
- Playoffs da Série B, quadrangulares, acessos/descensos, agregados, empate com vantagem, pênaltis extras e sorteios reproduzíveis após salvar.
- Chave das semifinais da Copa do Brasil preservada; mando da final da Série C; redistribuição de vagas e exclusão de rebaixados.
- Navegador: seleção das quatro divisões e três copas, início de partida, resultado, avanço, save/reload e três copas de pênaltis.
- Abertura `file://` com 208 clubes e recálculo de vagas pelo formulário.
- Capturas desktop e mobile; sem erros JavaScript no percurso concluído.

Os resultados sintéticos do teste de interface encerram partidas para verificar integração; o teste não equivale a uma campanha humana completa. A lógica de jogo tem testes separados.

Esta validação não certifica a completude federativa dos elencos nem a fidelidade dos uniformes. Consulte `data/sources.md`.
