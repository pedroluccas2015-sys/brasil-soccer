# Jogabilidade e apresentação

O campo passa de 1260 × 816 para 1470 × 952 unidades: 16,7% a mais em cada eixo. Formações, radar, impedimento, áreas e reposições seguem a geometria do campo. A área penal e as traves conservam suas dimensões para manter a precisão da finalização.

Segure **Passe**, **Chute** ou **Cruzamento** e solte para executar. A carga completa leva 0,85 segundo. Toques curtos privilegiam companheiros próximos; cargas maiores ampliam a distância e a velocidade. O chute usa 430–730 unidades/segundo e os passes/cruzamentos respeitam o teto de 420, eliminando a inversão da força. A barra mostra o comando e a porcentagem de carga.

A assistência considera direção, distância adequada à carga, espaço livre, bloqueios e impedimento. O cruzamento busca jogadores na área quando parte de um corredor lateral. A trajetória considera gravidade e atrito, com antecipação moderada do deslocamento do receptor. O atleta selecionado se aproxima do ponto de recepção quando o direcional está solto; qualquer comando de direção assume o movimento. Interceptações continuam possíveis. O indicador azul marca o receptor durante a carga.

A IA procura passes progressivos, faz tabelas e corridas de apoio, ocupa os corredores e finaliza de mais posições. O cursor acompanha o jogador próximo à bola com um intervalo para evitar trocas constantes; a troca manual tem prioridade temporária. O goleiro continua controlado pela IA e distribui a bola após uma defesa.

## Competições

- **Copa de Pênaltis:** todas as fases de mata-mata têm uma única disputa por confronto, inclusive finais e playoffs. Sem agregado ou vantagem de empate. Os grupos mantêm sua estrutura por pontos.
- **Torneios normais:** os calendários e critérios próprios de cada competição são preservados. Ida e volta nas fases previstas; fases iniciais e finais de jogo único continuam conforme as definições existentes do jogo.
- Saves anteriores de mata-mata de pênaltis com ida e volta conservam a primeira disputa já concluída e descartam a volta pendente. Os totais são recalculados para evitar contagem duplicada.

## Apresentação e assets

O seletor usa abas horizontais de ligas, uma grade de escudos, fichas animadas, cores de transmissão esportiva, navegação por setas/Enter e suporte a toque. A arte da interface é original, inspirada nos menus de futebol dos anos 2010. Não contém arquivos extraídos de PES.

Os **208 escudos** estão em `assets/crests/`. A procedência individual e o commit fixo da coleção pública estão em `data/crest-sources.json`. 207 SVGs vêm de [JoseArroyave/football-logos](https://github.com/JoseArroyave/football-logos); o PNG do Castanhal vem da imagem pública do clube no Transfermarkt. Metadados `foreignObject` de exportação foram removidos dos SVGs. Os direitos sobre os símbolos continuam com seus respectivos titulares; disponibilidade pública não equivale a uma licença comercial dos clubes.

O estádio e o troféu em `assets/ui/` são arte vetorial original. As partidas ganham entrada dos atletas, animações de corrida em 12 quadros, passe rasteiro próprio, variação nas comemorações, confetes, flashes, bancos de reservas e refletores. Os replays interpolam os snapshots gravados sem executar novamente a física. A preferência do sistema por movimento reduzido desativa as animações decorativas do menu.

## Validação

Execute `npm test` para os testes de física, IA, controles, competições, migração, assistência e assets. `node tools/build-data.js` atualiza o pacote offline depois de editar os dados. Para abrir o jogo: `npm start`, depois `http://localhost:8000`.

`tests/presentation.html` oferece cenas estáticas para inspeção visual pelo navegador. É uma página de testes, sem entrada no menu do jogo. A validação visual cobre seleção desktop/mobile, troca de liga e clube, pesquisa, entrada, comemoração, substituição, replay e campo. Testes de hardware/gamepad real e sensação de controle em partidas humanas continuam dependendo do dispositivo do jogador.
