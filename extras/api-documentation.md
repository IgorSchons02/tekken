# API Tekken Torneios

API para gerenciamento de torneios, confrontos e resultados.

## Visualizacao com Swagger

Com a API rodando, acesse:

- http://tekken-torneios.vercel.app/docs

Essa pagina permite visualizar e testar os endpoints direto no navegador.

## Setup local rapido

1. Instalar dependencias: npm install
2. Gerar client do Prisma: npx prisma generate
3. Subir API: npm run dev

Se aparecer erro de modulo do Prisma Client nao encontrado, rode novamente o passo 2.

## Glossario do dominio

- Torneio: evento com titulo, periodo e premio.
- Participante: jogador cadastrado para disputar confrontos.
- Personagem: lutador escolhido para o confronto.
- Bracket: confrontos do torneio (chaveamento).
- Round: numero da etapa do confronto no torneio.
- Fase: nome textual da etapa no retorno de partidas.

## Fluxo completo do processo

1. Popular personagens base do jogo.
2. Cadastrar participantes.
3. Criar torneio.
4. Gerar confrontos (bracket) para o torneio.
5. Consultar partidas de um torneio.
6. Atualizar vencedor de cada confronto apos ocorrer.

## Endpoints

### Health check

- GET /

Resposta:

```json
{
  "hello": "world"
}
```

### Torneios

- GET /torneios
- POST /torneios

Body do POST /torneios:

```json
{
  "titulo": "Torneio Tekken SP",
  "data_inicio": "2026-04-12T10:00:00.000Z",
  "data_final": "2026-04-12T20:00:00.000Z",
  "premio": 1000
}
```

### Participantes

- POST /participantes
- GET /torneios/:id/participantes

Body do POST /participantes:

```json
{
  "nome": "Player 1"
}
```

### Personagens

- GET /personagens
- POST /personagens-multiplos
- GET /torneios/:id/personagens

### Confrontos (Bracket)

- POST /torneios/:id/gerar-bracket

Body do POST /torneios/:id/gerar-bracket:

```json
{
  "participantes": [
    { "id": 1, "personagem_id": 3 },
    { "id": 2, "personagem_id": 7 },
    { "id": 3, "personagem_id": 12 },
    { "id": 4, "personagem_id": 20 }
  ]
}
```

Observacao:

- Neste endpoint o vencedor nao deve ser enviado.
- Os confrontos sao criados com vencedor nulo.
- O id do torneio que está lançando/editando precisa estar no post, substituindo o :id. 

### Partidas por torneio

- GET /torneios/:id/partidas

Resposta exemplo:

```json
[
  {
    "id": 1,
    "fase": "Quartas de Final",
    "jogador1": {
      "id": 1,
      "nickname": "Player 1",
      "personagem": "Jin Kazama"
    },
    "jogador2": {
      "id": 2,
      "nickname": "Player 2",
      "personagem": "Kazuya Mishima"
    },
    "vencedor": null,
    "status": "pendente"
  }
]
```

Observacao:

- O id do round que está lançando/editando precisa estar no post, substituindo o :id. 


### Atualizacao de vencedor

- PATCH /rounds/:id/vencedor

Body:

```json
{
  "vencedor_id": 1
}
```

Regra:

- O vencedor deve ser um dos dois participantes do round.

Observacao:

- O id do round que está lançando/editando precisa estar no post, substituindo o :id. 

## Sequencia recomendada para frontend

1. POST /personagens-multiplos (uma vez para carga inicial).
2. POST /participantes (repetir para cada jogador).
3. POST /torneios.
4. POST /torneios/:id/gerar-bracket.
5. GET /torneios/:id/partidas.
6. PATCH /rounds/:id/vencedor.
7. GET /torneios/:id/partidas (reconsulta para refletir vencedor e status).

## Codigos de status esperados

- 200: consulta ou atualizacao com sucesso.
- 201: recurso criado com sucesso.
- 400: validacao de entrada ou regra de negocio invalida.
- 404: recurso nao encontrado.
- 500: erro interno.
