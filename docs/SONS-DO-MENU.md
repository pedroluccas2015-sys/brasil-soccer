# Efeitos de navegação

Os efeitos usam trechos curtos da referência [Pes 2006 Sound Effects](https://www.youtube.com/watch?v=KxBt3xwYJXs), enviada pelo usuário. Os recortes foram associados a três ações:

| Ação | Trecho da referência |
| --- | --- |
| Mover o foco na grade com as setas | 0,397–0,650 s |
| Confirmar modo, liga, competição ou clube | 2,735–3,580 s |
| Voltar e sair | 3,940–4,730 s |

A identificação de cada trecho como navegação, confirmação ou volta é o mapeamento adotado no app. O vídeo não fornece rótulos individuais. O áudio foi convertido para PCM16 mono a 22.050 Hz, com volume normalizado e transição de 2 ms nas bordas para evitar estalos. A duração, afinação e o timbre dos trechos foram preservados.

`js/menu-sounds.js` contém apenas os três recortes em base64, com duração e hashes registrados. Os buffers são preparados uma única vez na primeira interação. Não há chamada ao YouTube, download de áudio ou dependência de internet durante a reprodução no jogo; a abertura local do HTML também é compatível.

O som fica ativo por padrão e começa após uma ação do usuário, respeitando a política de reprodução do navegador. O botão **SOM ON/OFF** silencia também os efeitos do menu e conserva a preferência no navegador. Confirmações e voltas têm efeitos diferentes; a grade, as abas de liga e os seletores de lista acionam um único efeito por escolha. Sons de movimentação têm um pequeno intervalo mínimo, e a sobreposição é limitada a quatro vozes.

Para reconstruir os recortes, obtenha a referência fornecida, converta-a para WAV mono PCM16 a 22.050 Hz e execute `python tools/build-menu-sounds.py caminho/para/referencia.wav`. Os trechos são atribuídos à referência acima; os direitos dos sons originais permanecem com seus respectivos titulares.
