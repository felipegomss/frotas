# Feature: M0-F05 — Cadastro de motoristas + tela web

Módulo/EF: specs/EFs/05-motoristas.md ("nome, CNH categoria/validade, vínculo/secretaria,
veículos autorizados")
Fase/milestone: M0 · MVP

> Fatiamento: a spec cobre **domínio + contracts + api** (fase A) e a **tela web** (fase B), reusando
> a fundação web já entregue em M0-F04b (BFF/cookie httpOnly, api-client, RHF+Zod, layout/nav).
> Recomenda-se **dois PRs** (api, depois web) num mesmo branch; ver "Riscos e decisões".

## Objetivo
CRUD completo de motoristas do tenant — nome, categoria e validade da CNH, secretaria (vínculo) e
veículos autorizados a conduzir — na API e na web, com dado isolado por schema e tenant vindo só da
claim assinada. Introduz o agregado `driver` como módulo hexagonal próprio (espelha `vehicle`).

## Escopo
- Novo agregado de domínio `Driver` (`id, name, cnhCategory, cnhExpiry, secretariatId, status,
  authorizedVehicleIds`), módulo `packages/domain/src/driver/` no molde de `vehicle`.
- `POST /motoristas` — cria um motorista no tenant da sessão.
- `GET /motoristas` — lista todos os motoristas do tenant, ordenados por nome.
- `GET /motoristas/:id` — detalha um motorista (com seus `authorizedVehicleIds`).
- `PUT /motoristas/:id` — edita nome, categoria/validade da CNH, secretaria, status e o conjunto de
  veículos autorizados (substituição total do conjunto).
- `DELETE /motoristas/:id` — remove um motorista (e suas autorizações, via `ON DELETE CASCADE`).
- `cnhCategory`: união fechada `A | B | C | D | E | AB | AC | AD | AE` (EN no código; rótulo PT na UI).
- `cnhExpiry`: data (`YYYY-MM-DD`). **Sem** regra de "deve ser futura": cadastrar CNH vencida é
  permitido; o alerta de vencimento é do módulo de alertas (EF 05 / EF 07), fora daqui.
- `status` administrativo restrito a `active` (default) e `inactive`.
- `secretariatId` **obrigatório** → FK `drivers.secretariat_id → secretariats(id)`. Secretaria
  inexistente no tenant → 404 (reusa `SecretariatNotFoundError`, traduzido da violação de FK `23503`).
- `authorizedVehicleIds`: conjunto (M:N) via tabela `driver_authorized_vehicles`. Opcional (pode ser
  vazio). Veículo inexistente no tenant → 404 (`VehicleNotFoundError`, traduzido da FK `23503`).
- Todas as rotas sob `SessionGuard`; schema vem exclusivamente da claim (ADR 0010).
- Acesso a dado por `$queryRaw` + `SET LOCAL search_path` em transação (ADR 0005), via mapper —
  tipo do Prisma nunca cruza a fronteira do repositório. O `save` grava o motorista **e** o conjunto
  de autorizações na mesma transação de tenant.
- Fecha/estende o débito da F04: `DELETE /secretarias/:id` de uma secretaria **com motoristas** passa
  a devolver 409 (a FK nova ativa a proteção que já traduz `23503`→`SecretariatInUseError`).
- Tela web (rota PT `/motoristas`) reusando a fundação de F04b: listar/criar/editar/ver/excluir,
  com dropdown de secretaria (`GET /secretarias`) e multisseleção de veículos (`GET /veiculos`).

## Fora de escopo
- CPF do motorista e unicidade por CPF (não está na EF 05 desta fatia) → **sem** regra de duplicidade
  neste CRUD. Ver "Riscos e decisões".
- Vínculo do motorista a uma identidade de login (`identity`)/app do motorista → M0-F09 (EF 08).
- Histórico de utilização, multas e penalidades (EF 05, milestones seguintes).
- Alertas de CNH vencendo (módulo de alertas — EF 07).
- Uso dos motoristas em ordem de uso/abastecimento (`usage_orders`/`refuelings`) → M0-F06/F07. Esta
  fatia apenas **reaponta** os FKs `driver_id` desses templates para `drivers(id)` (ver db).
- RBAC por papel: qualquer membership ativa pode gerir (herda o out-of-scope da M0-F01).
- Design system / shadcn / Storybook (ADR 0013 — pós-MVP); UI simples de propósito.

## Critérios de aceite (cada um vira ao menos um teste)

### Domínio + API (fase A)
- [x] AC1: dada uma sessão válida no tenant A e uma secretaria S de A, quando
  `POST /motoristas {name:"João Silva", cnhCategory:"D", cnhExpiry:"2027-05-31", secretariatId:S}`,
  então 201 com o motorista (status `active`, `authorizedVehicleIds:[]`) e ele passa a aparecer em
  `GET /motoristas`.
- [x] AC2: dado `name` vazio/em branco, `cnhCategory` fora da união, `cnhExpiry` em formato inválido
  (não `YYYY-MM-DD` / data inexistente), ou `status` fora de `active|inactive`, quando `POST/PUT
  /motoristas`, então 400 (validação Zod / invariante de domínio).
- [x] AC3: dada uma sessão no tenant A, quando `GET /motoristas`, então retorna só os motoristas de A —
  o motorista seedado em `tenant_demo2` não aparece (isolamento).
- [x] AC4: dada uma sessão no tenant A com header forjado `X-Tenant-Schema: tenant_demo2`, então o
  header é ignorado e a lista continua sendo a de A.
- [x] AC5: dada uma requisição a qualquer rota `/motoristas` sem token de sessão ou com token
  inválido/adulterado, então 401 e nenhum dado de tenant é acessado.
- [x] AC6: dado um motorista existente de id X, quando `PUT /motoristas/X` alterando nome/CNH/
  secretaria/status, então 200 e as mudanças refletem no `GET /motoristas/X`.
- [x] AC7: dado um id inexistente, quando `GET`/`PUT`/`DELETE /motoristas/:id`, então 404
  (`DriverNotFoundError`).
- [x] AC8: dado um motorista existente, quando `DELETE /motoristas/:id`, então 204 e ele some da lista.
- [x] AC9: dado `secretariatId` que não existe no tenant, quando `POST`/`PUT /motoristas`, então 404
  (secretaria não encontrada) e nenhum motorista é gravado/alterado.
- [x] AC10: dado `authorizedVehicleIds` contendo um id que não é veículo do tenant, quando
  `POST`/`PUT /motoristas`, então 404 (veículo não encontrado) e a gravação é revertida (transação).
- [x] AC11: dado `POST`/`PUT /motoristas` com `authorizedVehicleIds:[v1,v2]` de veículos válidos do
  tenant, então o `GET /motoristas/:id` devolve exatamente esse conjunto; um `PUT` posterior com
  `[v1]` substitui o conjunto (v2 sai).
- [x] AC12: dada uma secretaria S com ao menos um motorista, quando `DELETE /secretarias/S`, então
  409 (secretaria em uso) e S continua existindo.
- [x] AC13: sem regressão — `GET /frota`, `GET /veiculos` e `DELETE /veiculos/:id` (mesmo de um
  veículo autorizado a um motorista) continuam funcionando.

### Web (fase B)
- [x] AC14: dada uma sessão válida, quando abro `/motoristas`, então vejo a lista dos motoristas do
  tenant (nome, CNH categoria/validade, secretaria, status), buscada no servidor com o bearer.
- [x] AC15: dado o formulário de criação, quando submeto válido, então o BFF faz `POST /motoristas` e
  o motorista aparece na lista; entradas inválidas mostram erro inline (Zod do contrato) antes do
  submit; o campo secretaria lista `GET /secretarias` e os veículos autorizados listam `GET /veiculos`.
- [x] AC16: dado um motorista existente, quando abro "editar", o form vem pré-preenchido (inclusive as
  autorizações marcadas) e o submit faz `PUT /motoristas/:id`, refletindo a mudança.
- [x] AC17: dado um motorista existente, quando confirmo "excluir", o BFF faz `DELETE /motoristas/:id`
  e ele some da lista; erro da API (404/409/400) exibe mensagem legível sem quebrar a UI.
- [x] AC18 (segurança): o token de sessão nunca chega ao JS do cliente (só cookie httpOnly); a web
  nunca decide tenant (herdado de F04b).

## Testes que provam cada critério (TDD — escritos antes do código)
- Domínio (vitest, `packages/domain/src/driver/`) com `FakeDriverRepository` e o
  `shared/testing/fake-id-generator`:
  - `Driver`: rejeita nome vazio/branco (faz trim), `cnhCategory` fora da união, `cnhExpiry` inválida,
    `status` inválido — AC2; `update(...)` altera atributos e substitui `authorizedVehicleIds` — AC6/AC11.
  - `CreateDriver`: cria com id do gerador (AC1); mantém o conjunto de autorizações informado (AC11).
  - `UpdateDriver`/`GetDriver`/`DeleteDriver`: id inexistente → `DriverNotFoundError` (AC7).
  - `ListDrivers`: retorna a lista ordenada por nome (AC3 no nível de porta).
- Integração da API (Nest Testing + supertest, requer Postgres `frotas-db-1` com o seed):
  `apps/api/test/drivers.e2e-spec.ts` — ciclo CRUD HTTP (AC1, AC6, AC8), 400 validação (AC2),
  isolamento (AC3), header forjado ignorado (AC4), 401 (AC5), 404 (AC7), secretaria inexistente → 404
  (AC9), veículo autorizado inexistente → 404 (AC10), round-trip do conjunto de autorizações (AC11),
  e regressão (AC13). Reusa `makeIdpKit` e `seedTestData`.
  `apps/api/test/secretariats.e2e-spec.ts` — novo caso: DELETE de secretaria com motorista → 409 (AC12).
- Web (vitest em `apps/web`): `lib/drivers.ts` (monta rota/método/corpo e injeta bearer — AC14–AC17);
  parsing `CreateDriverRequest.safeParse` rejeita entradas inválidas (AC15). Fluxo visual login →
  lista → criar (com autorizações) → editar → excluir verificado rodando o app (skill `verify`),
  não automatizado (herda a decisão de F04b; Playwright fica para F10).

## Plano por camada (domain → contracts → api → db → web)
1. **domain** (`packages/domain/src/driver/`), testes primeiro (red → green):
   - `driver.type.ts`: `CnhCategory` (`A|B|C|D|E|AB|AC|AD|AE`) e `DriverStatus` (`active|inactive`),
     com arrays `CNH_CATEGORIES`/`DRIVER_STATUSES` (espelha `vehicle.type.ts`).
   - `driver.entity.ts`: `Driver` com validação de `name` (trim, não vazio), `cnhCategory` (na união),
     `cnhExpiry` (formato `YYYY-MM-DD` + data de calendário real), `status` administrativo, e
     `authorizedVehicleIds` (dedup, string[]); método `update(Partial<...>)`.
   - `driver.errors.ts`: `DriverNotFoundError` (→404). (Sem erro de duplicidade — ver escopo.)
   - `driver.repository.ts` (porta): `list()`, `findById()`, `save(driver)`, `delete(id)`.
   - Casos de uso: `CreateDriver`, `ListDrivers`, `GetDriver`, `UpdateDriver`, `DeleteDriver` (molde
     de `vehicle`; reusa `shared/id-generator`).
   - `testing/fake-driver-repository.ts`. Export tudo no `index.ts`.
2. **contracts** (`packages/contracts/src/index.ts`): `CnhCategory` (Zod enum), `DriverStatus`,
   `CreateDriverRequest {name, cnhCategory, cnhExpiry: z.string().date(), secretariatId: uuid,
   authorizedVehicleIds: z.array(uuid).default([]), status?: DriverStatus}`, `UpdateDriverRequest`
   (igual), `DriverResponse {id, name, cnhCategory, cnhExpiry, secretariatId, status,
   authorizedVehicleIds}`, `DriverListResponse`.
3. **api** (`apps/api/src/driver/`):
   - `infra/driver.mapper.ts` (row snake_case → entidade; `cnh_expiry::text` para evitar shift de TZ).
   - `infra/prisma-driver.repository.ts` (padrão `withTenant`): `list`/`findById` fazem JOIN/agregação
     de `driver_authorized_vehicles` (ex. `array_agg`); `save` faz upsert do motorista + `DELETE` das
     autorizações + reinsere o conjunto, tudo na mesma transação; traduz FK `23503` roteando por
     `error.constraint` → `SecretariatNotFoundError` (secretaria) ou `VehicleNotFoundError`
     (autorização). Constraints nomeadas no template para roteamento confiável.
   - `drivers.controller.ts` (`/motoristas` CRUD sob `SessionGuard`), `driver.dto.ts` (`createZodDto`),
     `driver.module.ts` (token do repositório + `CryptoIdGenerator`), registro no `AppModule`.
   - `DomainExceptionFilter`: adicionar `DriverNotFoundError`→404; ajustar a mensagem de
     `SecretariatInUseError` para "Secretaria possui registros vinculados." (veículos **ou** motoristas).
4. **db** (`packages/db`): em `prisma/tenant-template.sql`:
   - `CREATE TABLE drivers (id uuid PK default gen_random_uuid(), name text NOT NULL, cnh_category text
     NOT NULL, cnh_expiry date NOT NULL, secretariat_id uuid NOT NULL REFERENCES secretariats(id),
     status text NOT NULL DEFAULT 'active')`.
   - `CREATE TABLE driver_authorized_vehicles (driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE
     CASCADE, vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE, PRIMARY KEY
     (driver_id, vehicle_id))` (nomear as constraints de FK).
   - Reapontar `usage_orders.driver_id` e `refuelings.driver_id` de `users(id)` → `drivers(id)`
     (tabelas ainda sem uso; coerência do modelo antes de M0-F06/F07).
   - `src/seed-demo.ts`: inserir um motorista em `tenant_demo` (com 1 veículo autorizado) e outro em
     `tenant_demo2`, para provar isolamento (AC3).
5. **web** (`apps/web/src/app/motoristas/` + `lib/drivers.ts`), reusando a fundação de F04b:
   - `lib/drivers.ts`: `listDrivers/getDriver/createDriver/updateDriver/deleteDriver` (reusa
     `apiFetch`, `requireSession`, `listSecretariats`, `listVehicles`).
   - `motoristas/page.tsx` (lista, server component), `novo/page.tsx`, `[id]/page.tsx`,
     `[id]/editar/page.tsx`, `actions.ts`, `driver-form.tsx` (RHF+Zod; select de categoria CNH, input
     `date` para validade, select de secretaria, multisseleção de veículos autorizados), botão excluir.
   - `lib/labels.ts`: rótulos PT de `CnhCategory` e `DriverStatus`; link "Motoristas" no `layout.tsx`.
   - Consultar `node_modules/next/dist/docs/` antes de escrever código Next (ver `apps/web/AGENTS.md`).
6. **validar**: `pnpm turbo run lint typecheck test build --affected`; revisão `revisar-tenant`
   obrigatória (dado de tenant + escrita + sessão); rodar o app e percorrer o fluxo.

## Riscos e decisões
- **Decisão-chave — motorista é agregado próprio (`drivers`), não `users`.** `users` exige
  `identity_id NOT NULL` (pessoa com login) e é criado no provisionamento para o admin; um motorista
  no MVP é cadastrado pelo gestor e **não** tem login (o app do motorista é M0-F09). Um agregado
  `driver` dedicado mantém o domínio limpo e espelha `vehicle` 1:1. Custo: os FKs `driver_id` de
  `usage_orders`/`refuelings` (hoje → `users`, sem uso) passam a apontar `drivers`. Alternativa
  rejeitada: estender `users` (identity nullable + campos de CNH), que mistura "pessoa com login" com
  "motorista". Registrado em **ADR 0014** (aceito). Ver [[auth-cognito-decision]] e ADR 0003.
- **Decisão — sem unicidade no MVP.** Sem CPF nesta fatia (EF 05 lista nome/CNH/secretaria/veículos),
  logo não há chave natural única → sem `Duplicate*Error`. Se o UX exigir, CPF único entra depois.
- **Decisão — validade da CNH pode ser passada.** Cadastrar CNH vencida é permitido; o alerta é do
  módulo de alertas (EF 07). Evita acoplar regra de negócio de alerta ao CRUD.
- **Veículos autorizados (M:N)**: persistidos por substituição total do conjunto no `save`, na mesma
  transação de tenant. Existência garantida por FK (sem porta cross-agregado no domínio, como em F04);
  o adaptador traduz `23503` por nome de constraint → 404 do agregado certo. `ON DELETE CASCADE` no
  `vehicle_id` evita regressão do `DELETE /veiculos/:id` (AC13).
- **Segurança**: toca dado de tenant **e** é caminho de escrita/sessão → revisão `revisar-tenant`
  obrigatória antes do commit.
- **Escopo/entrega**: recomendo **dois PRs** (A: domain→api→db; B: web) no mesmo branch, para revisões
  menores — mantém o backlog que bundla "cadastro + tela".
- **Além do ADR 0014**: cabe nos ADR 0004 (REST) e 0005 (dado de tenant por SQL cru).
  `PUT` para edição. Ver [[idioma-camada-nao-conceito]] (rota PT, código EN).
- **Dependência de teste**: Postgres compartilhado (`frotas-db-1`) + seed. Ver [[toolchain-nvm-path]].
