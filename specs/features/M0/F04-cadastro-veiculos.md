# Feature: M0-F04 — Cadastro de veículos (completo)

Módulo/EF: specs/EFs/01-cadastro-frota.md ("placa, modelo, ano, tipo, secretaria responsável,
status, quilometragem atual")
Fase/milestone: M0 · MVP

> Escopo fatiado: esta spec cobre **domínio + contracts + api** do CRUD de veículos. A **tela web**
> (listar/criar/editar/ver) e a fundação web (login no browser, API client, TanStack Query, shadcn,
> layout/nav) saem numa fatia seguinte, **M0-F04b**. Ver `specs/features/M0/_backlog.md`.

## Objetivo
CRUD completo de veículos do tenant — criar/editar com placa, modelo, ano, tipo, secretaria,
quilometragem e status inicial; listar e detalhar — estendendo o módulo `vehicle` (hoje só
`GET /frota` de disponíveis), com dado isolado por schema e tenant vindo só da claim assinada.

## Escopo
- Estende a entidade `Vehicle` (hoje `id, plate, status, currentMileage`) com `model`, `year`,
  `type` e `secretariatId`.
- `POST /veiculos` — cria um veículo no tenant da sessão.
- `GET /veiculos` — lista todos os veículos do tenant (qualquer status), ordenados por placa.
- `GET /veiculos/:id` — detalha um veículo do tenant.
- `PUT /veiculos/:id` — edita placa, modelo, ano, tipo, secretaria, quilometragem e status.
- `DELETE /veiculos/:id` — remove um veículo.
- Placa única por tenant (`UNIQUE` já existe no template) → 409 em duplicado (mirror de secretaria).
- `type`: união fechada `car | motorcycle | truck | van | bus | pickup | machine | other` (EN no
  código; rótulo PT fica na UI/F04b).
- `status` inicial/administrativo restrito a `available` (default) e `inactive`. Os status
  operacionais (`in_use`, `reserved`, `in_maintenance`, `in_repair`) são dirigidos por outros
  módulos (M0-F06+) e **não** podem ser atribuídos por este CRUD → 400.
- `secretariatId` obrigatório; introduz `vehicles.secretariat_id` como FK para `secretariats(id)`.
- Todas as rotas sob `SessionGuard`; schema vem exclusivamente da claim (ADR 0010).
- Acesso a dado por `$queryRaw` + `SET LOCAL search_path` em transação (ADR 0005), via mapper —
  tipo do Prisma nunca cruza a fronteira do repositório.
- Fecha o débito herdado de M0-F03: com a FK criada, `DELETE /secretarias/:id` de uma secretaria
  **com veículos** passa a devolver 409 (antes ficaria sem proteção).
- `GET /frota` (M0-F01, só disponíveis) permanece intacto.

## Fora de escopo
- Qualquer superfície web/mobile — vai para **M0-F04b**.
- Documentos (CRLV, seguro), fotos e responsável pelo veículo com histórico (M1, EF01).
- Transições operacionais de status (máquina de estados alimentada por M0-F06/F07).
- RBAC por papel: qualquer membership ativa pode gerir (herda o out-of-scope da M0-F01).
- Edição de quilometragem com regra de monotonicidade operacional: `registerMileage` (só cresce)
  segue para o fluxo de ordem de uso/abastecimento; aqui a quilometragem é o hodômetro inicial,
  corrigível administrativamente.

## Critérios de aceite (cada um vira ao menos um teste)
- [x] AC1: dada uma sessão válida no tenant A e uma secretaria S de A, quando
  `POST /veiculos {plate:"ABC1D23", model:"Fiat Strada", year:2022, type:"pickup",
  secretariatId:S, currentMileage:15000}`, então 201 com o veículo (status `available`) e ele
  passa a aparecer em `GET /veiculos`.
- [x] AC2: dado que já existe a placa "ABC1D23" em A, quando `POST /veiculos` com a mesma placa,
  então 409 e nenhum veículo é criado.
- [x] AC3: dada placa em formato inválido (não bate `AAA9999` nem Mercosul `AAA9A99`), `year` fora
  de faixa, `type` fora da união, `currentMileage` negativo, ou `status` operacional, quando
  `POST /veiculos`, então 400 (validação Zod / invariante de domínio).
- [x] AC4: dada uma sessão no tenant A, quando `GET /veiculos`, então retorna só os veículos de A —
  o veículo seedado em `tenant_prefdemo2` não aparece.
- [x] AC5: dada uma sessão no tenant A com header forjado `X-Tenant-Schema: tenant_prefdemo2`, então o
  header é ignorado e a lista continua sendo a de A.
- [x] AC6: dada uma requisição a qualquer rota `/veiculos` sem token de sessão ou com token
  inválido/adulterado, então 401 e nenhum dado de tenant é acessado.
- [x] AC7: dado um veículo existente de id X, quando `PUT /veiculos/X` alterando modelo/ano/tipo/
  secretaria/status, então 200 e as mudanças refletem no `GET /veiculos/X`.
- [x] AC8: dado um id inexistente, quando `GET`/`PUT`/`DELETE /veiculos/:id`, então 404.
- [x] AC9: dado um veículo existente, quando `DELETE /veiculos/:id`, então 204 e ele some da lista.
- [x] AC10: dado um `PUT` cuja `plate` já pertence a outro veículo do tenant, então 409.
- [x] AC11: dado `secretariatId` que não existe no tenant, quando `POST`/`PUT /veiculos`, então 404
  (secretaria não encontrada) e nenhum veículo é gravado/alterado.
- [x] AC12: dada uma secretaria S com ao menos um veículo, quando `DELETE /secretarias/S`, então
  409 (secretaria em uso) e S continua existindo.
- [x] AC13: `GET /frota` continua devolvendo só os veículos `available` do tenant (sem regressão).

## Testes que provam cada critério (TDD — escritos antes do código)
- Domínio (vitest, `packages/domain`) com `FakeVehicleRepository` e `FakeIdGenerator`:
  - `Vehicle`: normaliza/valida placa (maiúsculas, formato antigo e Mercosul) — AC3; rejeita `year`
    fora de faixa, `type` inválido, `currentMileage` negativo, `status` operacional em create/edit
    — AC3; `update(...)` altera atributos — AC7.
  - `CreateVehicle`: cria com id do gerador (AC1); placa duplicada → `DuplicatePlateError` (AC2).
  - `UpdateVehicle`: edita (AC7); id inexistente → `VehicleNotFoundError` (AC8); placa de outro
    veículo → `DuplicatePlateError` (AC10).
  - `GetVehicle`/`DeleteVehicle`: id inexistente → `VehicleNotFoundError` (AC8).
  - `ListVehicles`: retorna a lista ordenada por placa (AC4 no nível de porta).
- Integração da API (Nest Testing + supertest, requer Postgres `frotas-db-1` com o seed):
  `apps/api/test/vehicles.e2e-spec.ts` — ciclo CRUD HTTP (AC1, AC7, AC9), 409 placa (AC2, AC10),
  400 validação (AC3), isolamento (AC4), header forjado ignorado (AC5), 401 (AC6), 404 (AC8),
  secretaria inexistente → 404 (AC11), e regressão do `GET /frota` (AC13). Reusa `makeIdpKit` e
  `seedTestData`.
  `apps/api/test/secretariats.e2e-spec.ts` — novo caso: DELETE de secretaria com veículo → 409
  (AC12).

## Plano por camada (domain → contracts → api → db)
1. **domain** (`packages/domain/src/vehicle/`):
   - `vehicle.entity.ts`: adicionar `model`, `year`, `type: VehicleType`, `secretariatId`;
     value/validações de `plate` (normalize + regex `^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$`), `year`
     (inteiro, faixa 1900..2100), `currentMileage` (≥0), `status` administrativo (só `available`/
     `inactive` em create/edit); método `update(attrs)`. Mantém `registerMileage` (monotônico) para
     os módulos operacionais.
   - `vehicle.type.ts`: união `VehicleType`.
   - `vehicle.errors.ts`: `VehicleNotFoundError` (→404), `DuplicatePlateError` (→409).
   - `vehicle.repository.ts` (porta): adicionar `list()`, `findByPlate()`, `delete()`; manter
     `findById`, `listAvailable` (F01), `save`.
   - `id-generator.ts`: reutilizar a porta existente de `secretariat` (mover para local
     compartilhado ou reexportar) — decisão no ADR/nota abaixo.
   - Casos de uso: `CreateVehicle`, `ListVehicles`, `GetVehicle`, `UpdateVehicle`, `DeleteVehicle`.
   - `testing/fake-vehicle-repository.ts` para os testes de domínio.
   - Export tudo no `index.ts`. Testes primeiro (red → green).
2. **contracts** (`packages/contracts/src/index.ts`): `VehicleType` (Zod enum), `CreateVehicleRequest`
   `{plate, model, year, type, secretariatId, currentMileage, status?}`, `UpdateVehicleRequest`
   (igual), `VehicleResponse` `{id, plate, model, year, type, secretariatId, status, currentMileage}`,
   `VehicleDetailListResponse`. Mantém `VehicleListItem` (F01) intacto.
3. **api** (`apps/api/src/vehicle/`): `vehicle.mapper.ts` (row snake_case → entidade, novas colunas),
   estender `infra/prisma-vehicle.repository.ts` (`list`, `findByPlate`, `delete`; traduzir
   `23505`→`DuplicatePlateError`, `23503` de FK de secretaria no insert/update →
   `SecretariatNotFoundError`), `vehicles.controller.ts` (`/veiculos` CRUD sob `SessionGuard`),
   DTOs via `createZodDto`, ampliar `vehicle.module.ts` (novos casos de uso + `IdGenerator`),
   registrar no `AppModule`. Ampliar `DomainExceptionFilter`: `VehicleNotFoundError`→404,
   `DuplicatePlateError`→409, `SecretariatInUseError`→409.
   - Secretaria em uso: em `infra/prisma-secretariat.repository.ts`, traduzir `23503` no `delete`
     para novo `SecretariatInUseError` (domínio, em `secretariat.errors.ts`).
4. **db** (`packages/db`): em `prisma/tenant-template.sql`, alterar `vehicles`:
   `model text NOT NULL`, `year integer NOT NULL`, `type text NOT NULL`,
   `secretariat_id uuid NOT NULL REFERENCES secretariats(id)` (mantém `plate UNIQUE`, `status`,
   `current_mileage`). Em `src/seed-demo.ts`, criar a secretaria antes dos veículos e referenciar
   `secretariat_id`, preenchendo `year`/`type` nos inserts de `tenant_prefdemo` e `tenant_prefdemo2`.

## Riscos e decisões
- Segurança: toca dado de tenant **e** é caminho de escrita → revisão `revisar-tenant` obrigatória
  antes do commit.
- Corrida (TOCTOU) na checagem de placa única: mitigada pelo `UNIQUE` no banco (backstop
  autoritativo, traduzido para erro de domínio no adaptador). Aceitável no MVP.
- Acoplamento entre agregados: o CRUD de veículo depende de uma secretaria existente. Para não
  acoplar o domínio `vehicle` ao domínio `secretariat`, a existência é garantida pela FK no banco
  e o adaptador traduz a violação `23503` em `SecretariatNotFoundError` (404). Sem porta
  cross-agregado no domínio. Rever se o UX exigir 404 antes de tocar o banco.
- `IdGenerator`: hoje vive em `secretariat/`. Decisão: promover a porta para um local compartilhado
  do domínio e reexportar (evita duplicar a interface). Sem novo ADR (cabe em ADR 0002).
- Sem novo ADR: cabe nos ADR 0004 (REST) e 0005 (dado de tenant por SQL cru). `PUT` para edição.
  Ver [[idioma-camada-nao-conceito]] (rota PT, código EN).
- Dependência de teste: Postgres compartilhado (`frotas-db-1`) + seed. Ver [[toolchain-nvm-path]].
