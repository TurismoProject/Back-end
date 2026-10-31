# Reservas, participantes e painel do fornecedor

O backend oferece saídas de passeios, reservas com participantes identificados,
confirmação/cancelamento em massa e registro individual ou em massa de embarque.
A interface web será construída sobre estes contratos. Exemplos usam valores em BRL.

## Organização do código

O projeto existente organiza controllers, módulos e repositórios por camada em
`src/base` e componentes compartilhados em `src/common`. O módulo novo reúne
suas camadas por funcionalidade em `src/reservations`, reutilizando `DatabaseModule`,
`AuthModule`, `PrismaService` e os mecanismos de injeção de dependências do NestJS.

| Arquivo/pasta em `src/reservations`       | Responsabilidade                                                  |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `reservations.module.ts`                  | Registra controllers, services, guard e repository.               |
| `reservation.controller.ts`               | Expõe rotas privadas do fornecedor/turista e catálogo público.    |
| `dto/reservation.dto.ts`                  | Define os pedidos, limites e validações de entrada.               |
| `auth/reservation-access.guard.ts`        | Verifica token, finalidade, perfil exigido e existência da conta. |
| `auth/reservation-actor.ts`               | Define e injeta a identidade mínima da conta autenticada.         |
| `auth/supplier-authentication.service.ts` | Login do fornecedor e rotação de refresh tokens.                  |
| `departure.service.ts`                    | Criação, consulta, conclusão e cancelamento das saídas.           |
| `reservation.service.ts`                  | Reservas, repetição de pedidos, ações em massa e comparecimento.  |
| `reservation.policy.ts`                   | Validações reutilizáveis de capacidade, horários e transições.    |
| `reservation.repository.ts`               | Consultas Prisma/SQL, escopos de leitura e transações.            |
| `supplier-dashboard.service.ts`           | Consolida totais e grupos por dia local e passeio.                |

Os arquivos de produção possuem JSDoc em português com responsabilidades, regras
e condições importantes. O schema Prisma usa comentários `///`, próprios do formato,
para explicar as entidades. Os testes unitários ficam ao lado da funcionalidade;
os cenários HTTP e de concorrência estão em `test/app.e2e-spec.ts`.

Ao estender o módulo:

- Use `withLockedDeparture` e o mesmo cliente `tx` em toda mutação que afete
  ocupação, reservas ou comparecimento. Uma transação independente perde essa garantia.
- Obtenha o responsável/fornecedor pela sessão. O guard autentica a conta;
  o service ainda deve conferir a propriedade de cada recurso.
- Mantenha as regras nos services/policies e as consultas no repository.
  O repository atual é concreto; o legado também possui contratos abstratos.
- Grave o evento de auditoria na mesma transação da alteração e evite registrar
  credenciais ou participantes de outra reserva nos detalhes.
- Preserve as distinções entre responsável e passageiro, pendente e confirmado,
  embarcado e participante de passeio concluído.

## Preparação

Depois de instalar as dependências e configurar `DATABASE_URL` e as chaves RSA:

```sh
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:dev
```

A nova migração adiciona tabelas, índices e restrições sem apagar dados existentes.
Ela impede excluir passeios e usuários vinculados a reservas para preservar o histórico.
O PostgreSQL precisa estar disponível; o container padrão de PostgreSQL não executa
Prisma. Execute as migrações nesta pasta da aplicação.

## Autenticação e mudanças nos contratos existentes

- Faça login novamente: tokens antigos, sem identificação de finalidade, não são aceitos.
- `POST /provedor/login` recebe `{ "email": "...", "password": "..." }` e devolve
  `{ "accessToken": "...", "refreshToken": "...", "supplier": { "id": "...", "name": "...", "email": "..." } }`.
- `POST /provedor/relogar` recebe `{ "refreshToken": "..." }`, devolve novos tokens
  e invalida o refresh token anterior. Não exige um access token ainda válido.
- Access tokens duram 15 minutos; refresh tokens, 7 dias. Envie
  `Authorization: Bearer <accessToken>` nas operações autenticadas.
- A identidade, perfil e existência da conta são verificados nas rotas de reservas.
  O fornecedor é obtido da sessão; não envie um `supplierId` nesses pedidos.
- `GET /provedor` retorna somente o perfil do fornecedor autenticado.
  Atualizar/excluir fornecedor também exige a própria sessão.
- A atualização de usuário exige a própria sessão; a listagem de usuários e o cadastro/
  atualização de administradores exigem perfil administrador.
- O cadastro de produto exige sessão de fornecedor, `supplierId` igual ao da sessão
  e agora também devolve o ID do produto.
- Campos extras são rejeitados globalmente. O campo opcional `id` da atualização
  de fornecedor, quando enviado, precisa corresponder ao fornecedor autenticado.
- As rotas de teste que emitiam tokens Google com dados fornecidos pelo cliente
  foram removidas. O OAuth real permanece disponível.
- Senhas e hashes não são devolvidos no login/perfil do fornecedor. O seed agora
  aplica hash nas senhas; não execute o seed sobre contas já existentes.

## 1. Criar e consultar saídas

`POST /provedor/saidas`:

```json
{
  "productId": "UUID_DO_PASSEIO",
  "startsAt": "2027-01-15T09:00:00-03:00",
  "timeZone": "America/Maceio",
  "capacity": 40,
  "pricePerPerson": "120.00"
}
```

- O passeio deve pertencer ao fornecedor da sessão.
- Data futura com offset explícito ou `Z`; fuso IANA válido. Padrão: `America/Maceio`.
- Capacidade entre 1 e 10.000; preço positivo em string decimal com duas casas.
- O mesmo passeio não pode ter duas saídas no mesmo instante.
- O preço da saída é independente do preço atual do produto.
- Nesta versão, saídas não podem ser reagendadas nem ter preço/capacidade alterados.

`GET /provedor/saidas?page=1&limit=20&productId=UUID&status=SCHEDULED`
lista apenas as saídas do fornecedor, com métricas, `acceptsReservations` e
`availableSeats` (zero para saídas iniciadas, concluídas ou canceladas).

Use também `startsFrom` (inclusivo) e `startsBefore` (exclusivo), ambos com horário
e offset, para consultar as saídas de um dia. Exemplo: de `2027-01-15T00:00:00-03:00`
até `2027-01-16T00:00:00-03:00`. O frontend deve codificar esses valores com
`URLSearchParams`.

`GET /passeios/saidas` é público, aceita os mesmos filtros e retorna disponibilidade
agregada, sem responsáveis nem nomes de participantes. Por padrão, a listagem inclui
os diferentes status; use `status=SCHEDULED` no catálogo de próximas operações e
considere `startsAt` para distinguir saídas futuras. Só saídas futuras e agendadas
aceitam novas reservas.

Listagens retornam `{ "items": [], "total": 0, "page": 1, "limit": 20 }`.
Limite máximo por página: 100. Ordenação estável por data e ID.

## 2. Criar reserva como turista

`POST /usuario/reservas`:

```json
{
  "departureId": "UUID_DA_SAIDA",
  "requestKey": "UUID_GERADO_PELO_FRONTEND",
  "participants": [{ "name": "Ana Souza" }, { "name": "João Souza" }]
}
```

O responsável é o usuário autenticado e seu nome é preservado na reserva.
Ele não é automaticamente incluído entre os passageiros: deve constar na lista se
for embarcar. A quantidade de pessoas é derivada dessa lista, sem um segundo campo
que possa divergir. Nomes não precisam ser únicos; não são coletados documentos.

A reserva nasce `PENDING`. O preço por pessoa e o total são copiados da saída,
calculados com aritmética decimal no servidor e devolvidos como strings decimais
(zeros finais podem ser omitidos). O cliente não pode definir preço, responsável,
situação nem comparecimento. A lista aceita de 1 a 100 participantes.

`requestKey` é um UUID gerado uma vez pelo frontend. Reenvie a mesma chave ao repetir
um pedido por falha de conexão: a mesma reserva será retornada, sem duplicar pessoas
ou eventos. Reutilizar a chave com outra saída ou outros nomes resulta em `409`.
A ordem dos nomes não altera a identificação do pedido.

**Política de vagas:** somente reservas confirmadas ocupam vagas. Pendentes são
solicitações de confirmação, sem bloqueio temporário nem garantia de vaga. A criação
exige vagas disponíveis naquele momento, mas diferentes pedidos pendentes podem
somar mais pessoas que a capacidade. A confirmação sempre revalida a ocupação.
Não há cobrança, expiração automática ou lista de espera nesta versão.

- `GET /usuario/reservas`: próprias reservas, com paginação e filtro `status`.
- `GET /usuario/reservas/:id`: detalhes da própria reserva e participantes.
- `PATCH /usuario/reservas/:id/cancelar`, com `{ "reason": "Desistência" }`:
  permite cancelar a própria reserva antes da saída, se ninguém tiver embarcado.

## 3. Resolver reservas

`GET /provedor/saidas/:departureId/reservas` retorna responsáveis, participantes,
valores e situações. Aceita paginação e filtro `status`.

`PATCH /provedor/saidas/:departureId/reservas/resolver`:

```json
{
  "reservationIds": ["UUID_RESERVA_1", "UUID_RESERVA_2"],
  "action": "CONFIRM"
}
```

Para cancelar, use `"action": "CANCEL"` e `"reason": "Mau tempo"`.
Uma seleção de um item funciona como operação individual. Limite: 100 IDs únicos.

- Todos os IDs devem pertencer à mesma saída e ao fornecedor da sessão.
- Toda a seleção é validada antes de gravar. Um erro desfaz a operação inteira.
- Confirmar exige saída futura, agendada e vagas para todos os novos confirmados.
- Reservas canceladas não podem ser reabertas.
- Cancelar exige motivo e ausência de participantes embarcados.
- Repetir uma ação já aplicada é uma operação sem alteração e sem duplicar histórico.
- Alterações concorrentes usam transação e bloqueio da saída no PostgreSQL.

Resposta: `{ "requested": 2, "changed": 2, "status": "CONFIRMED" }`.

## 4. Registrar embarque/ausência

`PATCH /provedor/saidas/:departureId/participantes/comparecimento`:

```json
{
  "participantIds": ["UUID_PARTICIPANTE_1", "UUID_PARTICIPANTE_2"],
  "attendance": "BOARDED"
}
```

Situações: `NOT_RECORDED`, `BOARDED`, `NO_SHOW`.

- Apenas participantes de reservas confirmadas da própria saída.
- De 1 a 100 IDs únicos; operação integral e atômica.
- Embarque abre duas horas antes do início. Ausência só pode ser registrada após
  o início. Essa janela é uma regra inicial que pode ser ajustada posteriormente.
- É possível corrigir registros enquanto a saída estiver agendada, inclusive
  retornar a `NOT_RECORDED`. A correção fica no histórico.
- Registros repetidos não geram novos eventos nem alteram o horário original.

## 5. Concluir ou cancelar a saída

`PATCH /provedor/saidas/:departureId/status`:

```json
{ "status": "COMPLETED" }
```

Concluir exige que a saída tenha começado, não tenha reservas pendentes e todos os
participantes confirmados tenham embarque ou ausência registrados. Depois disso,
a saída fica fechada para alterações.

Para cancelar: `{ "status": "CANCELLED", "reason": "Mau tempo" }`.
Isso cancela todas as reservas ativas na mesma transação. Não é permitido se já
houver embarcados. Saídas concluídas/canceladas não podem ser reabertas.

## 6. Painel e histórico

`GET /provedor/painel/reservas?from=2027-01-01&to=2027-01-31&productId=UUID`

Datas inclusivas, período máximo de 93 dias. O relatório usa a data do passeio no
fuso de cada saída, e não a data de criação da reserva ou o fuso do servidor.
Devolve `totals` e `byDateAndProduct`, com:

- Saídas totais, concluídas e canceladas.
- Reservas pendentes, confirmadas e canceladas.
- Participantes pendentes, confirmados, embarcados, ausentes e não registrados.
- `completedParticipants`: embarcados em saídas já concluídas, para responder
  quantas pessoas efetivamente fizeram os passeios.

Uma reserva de quatro pessoas conta como uma reserva e quatro participantes.
Uma pessoa em duas saídas conta duas participações; não há identificação de
pessoas únicas entre passeios. O painel abrange apenas reservas da plataforma.

`GET /provedor/saidas/:departureId/reservas/:reservationId/historico`
retorna eventos paginados com ação, autor, perfil, data e detalhes da alteração.

## Erros

- `400`: campos inválidos/desconhecidos, IDs repetidos, motivo ausente ou período inválido.
- `401`: sessão ausente, inválida, expirada, revogada na renovação ou conta inexistente.
- `403`: perfil sem permissão para a rota.
- `404`: recurso inexistente ou pertencente a outro fornecedor/turista.
- `409`: lotação, transição incompatível, chave reutilizada ou horário duplicado.

## Testes

```sh
npm test -- --runInBand
npm run build
```

Testes HTTP/de concorrência usam PostgreSQL real em banco **exclusivo** cujo nome
termine em `_test`. A suíte limpa suas tabelas antes de cada cenário. Nunca aponte
`TEST_DATABASE_URL` para um banco com dados que devam ser preservados.

Exemplo de ambiente isolado:

```sh
docker run --detach --rm --name turismo-reservations-test \
  --publish 127.0.0.1:55439:5432 \
  --env POSTGRES_USER=turismo_test --env POSTGRES_PASSWORD=turismo_test \
  --env POSTGRES_DB=turismo_reservations_test postgres:16.3

DATABASE_URL='postgresql://turismo_test:turismo_test@127.0.0.1:55439/turismo_reservations_test?schema=public' npx prisma migrate deploy
TEST_DATABASE_URL='postgresql://turismo_test:turismo_test@127.0.0.1:55439/turismo_reservations_test?schema=public' npm run test:reservations:e2e

docker stop turismo-reservations-test
```

O Swagger em `/api` documenta as rotas e os campos dos novos pedidos.
