# Feature: M0-F03 — Cadastro de secretarias

Módulo/EF: specs/EFs/01-cadastro-frota.md ("Secretarias como unidades organizacionais")
Fase/milestone: M0 · MVP

## Objetivo
CRUD de secretarias (unidade organizacional do tenant), base para vincular veículos (M0-F04) e
motoristas (M0-F05), com o dado isolado por schema e o tenant vindo só da claim assinada.

## Escopo
- `POST /secretarias` — cria uma secretaria (`{ name }`) no tenant da sessão.
- `GET /secretarias` — lista as secretarias do tenant (ordenadas por nome).
- `GET /secretarias/:id` — detalha uma secretaria do tenant.
- `PUT /secretarias/:id` — renomeia uma secretaria.
- `DELETE /secretarias/:id` — remove uma secretaria.
- Nome único por tenant: `UNIQUE(name)` no template + 409 em duplicado (mirror de `vehicles.plate`).
- Todas as rotas protegidas por `SessionGuard`; o schema vem exclusivamente da claim (ADR 0010).
- Acesso ao dado por `$queryRaw` + `SET LOCAL search_path` em transação (ADR 0005), via o mapper —
  tipo do Prisma nunca cruza a fronteira do repositório.
- Seed: uma secretaria em `tenant_prefdemo` e outra em `tenant_prefdemo2`, para provar isolamento.

## Fora de escopo
- RBAC por papel: qualquer membership ativa pode gerir (herda o out-of-scope da M0-F01).
- Bloquear exclusão de secretaria referenciada: não há FK ainda; entra em M0-F04/F05 quando
  `secretariat_id` surgir em veículos/usuários.
- Qualquer superfície web (M0-F04 em diante).
- Campos além de `name` (sigla, responsável, etc.).

## Critérios de aceite (cada um vira ao menos um teste)
- [x] AC1: dada uma sessão válida no tenant A, quando `POST /secretarias {name:"Saúde"}`, então 201
  com `{id, name:"Saúde"}` e a secretaria passa a aparecer em `GET /secretarias`.
- [x] AC2: dado que já existe "Saúde" em A, quando `POST /secretarias {name:"Saúde"}`, então 409 e
  nenhuma secretaria é criada.
- [x] AC3: dado `name` vazio/em branco, quando `POST /secretarias`, então 400 (validação Zod).
- [x] AC4: dada uma sessão no tenant A, quando `GET /secretarias`, então retorna só as secretarias de
  A — a secretaria seedada em `tenant_prefdemo2` não aparece.
- [x] AC5: dada uma sessão no tenant A com header forjado `X-Tenant-Schema: tenant_prefdemo2`, então o
  header é ignorado e a lista continua sendo a de A.
- [x] AC6: dada uma requisição a qualquer rota `/secretarias` sem token de sessão ou com token
  inválido/adulterado, então 401 e nenhum dado de tenant é acessado.
- [x] AC7: dada uma secretaria existente de id X, quando `PUT /secretarias/X {name:"Educação"}`, então
  200 e o nome é atualizado; `GET` reflete a mudança.
- [x] AC8: dado um id inexistente, quando `GET`/`PUT`/`DELETE /secretarias/:id`, então 404.
- [x] AC9: dada uma secretaria existente, quando `DELETE /secretarias/:id`, então 204 e ela some da
  lista.
- [x] AC10: dado um `PUT` cujo `name` já pertence a outra secretaria do tenant, então 409.

## Testes que provam cada critério (TDD — escritos antes do código)
- Domínio (vitest, `packages/domain`) com `FakeSecretariatRepository` e `FakeIdGenerator`:
  - `Secretariat` rejeita nome vazio/em branco, faz trim (AC3 no nível de domínio).
  - `CreateSecretariat`: cria com id do gerador (AC1); nome duplicado → `DuplicateSecretariatNameError`
    (AC2).
  - `UpdateSecretariat`: renomeia (AC7); id inexistente → `SecretariatNotFoundError` (AC8); nome de
    outra secretaria → `DuplicateSecretariatNameError` (AC10).
  - `DeleteSecretariat`: id inexistente → `SecretariatNotFoundError` (AC8).
  - `ListSecretariats`: retorna a lista ordenada por nome.
- Integração da API (Nest Testing + supertest, requer Postgres `frotas-db-1` com o seed):
  `apps/api/test/secretariats.e2e-spec.ts` — ciclo CRUD HTTP (AC1, AC7, AC9), 409 (AC2, AC10),
  400 (AC3), isolamento (AC4), header forjado ignorado (AC5), 401 (AC6), 404 (AC8). Reusa
  `makeIdpKit` (JWKS local + jose) e `seedTestData`.

## Plano por camada (domain → contracts → api → db)
1. **domain** (`packages/domain/src/secretariat/`): entidade `Secretariat` (id, name, validação +
   `rename`), porta `SecretariatRepository` (`list`, `findById`, `findByName`, `save`, `delete`),
   porta `IdGenerator` (`newId()`), casos de uso `CreateSecretariat`, `ListSecretariats`,
   `GetSecretariat`, `UpdateSecretariat`, `DeleteSecretariat`, erros `SecretariatNotFoundError`
   (→404) e `DuplicateSecretariatNameError` (→409). Sem Prisma. Export no `index.ts`. Testes primeiro.
2. **contracts** (`packages/contracts/src/index.ts`): Zod `CreateSecretariatRequest {name}`,
   `UpdateSecretariatRequest {name}`, `SecretariatResponse {id, name}`, `SecretariatListResponse`.
3. **api** (`apps/api/src/secretariat/`): `secretariat.mapper.ts` (row snake_case → entidade),
   `infra/prisma-secretariat.repository.ts` (padrão `withTenant`; traduz violação de unicidade do
   Postgres como backstop de AC2/AC10), `secretariats.controller.ts` (`POST`, `GET`, `GET/:id`,
   `PUT/:id`, `DELETE/:id` sob `SessionGuard`), DTOs via `createZodDto`, `secretariat.module.ts`
   (token de injeção do repositório + `randomUUID` como `IdGenerator`), registro no `AppModule`.
   Ampliar `DomainExceptionFilter` para mapear os novos erros de domínio (centraliza erro→HTTP,
   fase 4).
4. **db** (`packages/db`): `UNIQUE` em `secretariats.name` no `prisma/tenant-template.sql`; em
   `src/seed-demo.ts`, inserir uma secretaria em cada tenant (`tenant_prefdemo`, `tenant_prefdemo2`) para
   provar isolamento (AC4). Schemas são recriados pelo seed (idempotente).

## Riscos e decisões
- Segurança: toca dado de tenant **e** é caminho de escrita → revisão `revisar-tenant` obrigatória
  antes do commit.
- Risco (TOCTOU): a checagem de nome único no caso de uso tem corrida; mitigado pelo `UNIQUE` no
  banco (backstop autoritativo, traduzido para erro de domínio no adaptador). Aceitável no MVP.
- Sem novo ADR: cabe nos ADR 0004 (REST) e 0005 (dado de tenant por SQL cru). `PUT` para renomear
  (único campo mutável). Ver [[idioma-camada-nao-conceito]] (rota PT, código EN).
- Dependência de teste: Postgres compartilhado (`frotas-db-1`) + seed. Ver [[toolchain-nvm-path]].
