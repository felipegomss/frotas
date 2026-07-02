# Feature: M0-F02 — Provisionamento real de uma prefeitura

Módulo/EF: base multi-tenant (specs/arquitetura/multi-tenant.md, roadmap fase 2) + esqueleto da
trilha de auditoria com hash encadeado (roadmap fase 4, specs/arquitetura/seguranca.md)
Fase/milestone: M0 · MVP — segunda fatia (depende de M0-F01)

## Objetivo
Transformar o `tenant-runner` num fluxo real de onboarding (por script; a tela self-service é
pós-M0): criar o tenant no control-plane, criar o schema pelo template, rodar o seed base, criar o
1º admin (identity global + membership + usuário local no schema) e marcar o tenant `active` —
iniciando a trilha de auditoria com hash encadeado no schema recém-criado.

## Escopo
- Caso de uso `ProvisionTenant` no domínio (portas, sem Prisma): valida o slug → registra o tenant
  como `provisioning` → provisiona schema + template + seed base + admin + registro-gênese de
  auditoria numa única transação → marca `active`; falha marca `failed` e permite retry.
- Validação estrita do slug no domínio (minúsculas/dígitos/hífen, começa com letra, tamanho
  limitado) — o slug vira nome de schema interpolado em DDL, então é fronteira de segurança.
- Blocklist de slugs reservados no domínio: o slug também vira subdomínio (`<slug>.dominio.com.br`,
  specs/arquitetura/multi-tenant.md), então nomes de infra/aplicação (`www`, `api`, `admin`, `status`,
  `well-known`…) são rejeitados antes de tocar qualquer porta. Fonte única reusável (CLI hoje,
  self-service pós-M0).
- 1º admin: identity global nova ou reusada por CPF (ADR 0003), membership `admin` ativa no tenant
  e linha em `users` do schema do tenant referenciando a identity (seed base).
- Esqueleto da auditoria: tipos + hash encadeado (sha256) + verificação de cadeia como funções
  puras no domínio; porta de append; primeiro registro `tenant.provisioned` no `audit_log` do
  schema do tenant (`prev_hash` nulo na gênese).
- Adapters (Prisma control-plane + SQL cru com `SET LOCAL search_path`) e módulo `provisioning`
  na API; entrada por CLI (`pnpm --filter api provision`) usando Nest standalone context.
- `tenant-runner` do `packages/db` vira primitiva de baixo nível (aplicar template numa transação)
  reutilizada pelo adapter e pelo seed-demo, sem quebrar o seed existente.

## Fora de escopo
- Tela self-service no admin-console e fluxo assíncrono com `provisioning_jobs`/fila (pós-M0;
  o fluxo aqui é síncrono, por script de operação).
- Convite por e-mail (`invites`) — o 1º admin nasce direto, sem fluxo de aceite.
- Prefixo S3 (entra em M0-F07) e Cognito User Pool real (M0-F10); `authSub` do admin é parâmetro
  opcional do script (em dev casa com o emissor OIDC falso de F01).
- Enforcement append-only por RLS e espelho S3 Object Lock (WORM) — nesta fatia a inviolabilidade
  é a cadeia de hash verificável; RLS/WORM ficam para a trilha de segurança posterior.
- Auditar as demais escritas do sistema (F03+ passam a consumir o esqueleto criado aqui).
- Exibir a blocklist de reservados na tela de criação de tenant (para o operador saber o que não
  pode usar) — é do console de onboarding self-service (pós-M0); a lista já nasce exportada do
  domínio para essa UI consumir depois.

## Critérios de aceite (cada um vira ao menos um teste)
- [x] AC1: dado slug/nome/dados do admin válidos e slug inédito, quando o provisionamento roda,
  então existe o schema `tenant_<slug>` com as tabelas do template e o tenant existe no
  control-plane com status `active`.
- [x] AC2: dado o mesmo fluxo, então o admin existe como identity global (reusada por CPF se já
  existir), com membership `admin` ativa naquele tenant e uma linha em `users` do schema do tenant
  referenciando a identity.
- [x] AC3: dado o tenant provisionado, então o `audit_log` do schema contém o registro-gênese
  `tenant.provisioned` com `prev_hash` nulo e `hash` correto — a verificação da cadeia passa.
- [x] AC4: dado um slug inválido (maiúscula, espaço, aspas, `;`, unicode…), quando chama o caso de
  uso, então erro de domínio e nenhum efeito no banco (nem linha de tenant, nem schema).
- [x] AC5: dado um slug de tenant já `active`, quando tenta provisionar de novo, então erro de
  domínio e nada é alterado (schema e dados do tenant existente intactos).
- [x] AC6: dada uma falha no meio do provisionamento (ex.: template falha), então a transação é
  revertida — não sobra schema meio-criado — e o tenant fica marcado `failed`.
- [x] AC7: dado um tenant `failed`, quando o provisionamento roda de novo com o mesmo slug, então
  recomeça do zero e termina `active` (retry idempotente).
- [x] AC8: dada uma cadeia de auditoria com N registros, quando um registro é adulterado, então a
  verificação acusa a quebra; um novo append referencia o hash do registro anterior.
- [x] AC9: dado um slug reservado (`www`, `api`, `admin`, `status`, `well-known`, `demo`…), quando
  chama o caso de uso, então erro de domínio (`ReservedTenantSlugError`) e nenhum efeito no banco
  (nem linha de tenant, nem schema) — o slug seria um subdomínio de infra/aplicação.

## Testes que provam cada critério (TDD — escritos antes do código)
- Domínio (vitest, `packages/domain`):
  - `audit`: `computeEntryHash`/`verifyChain` — gênese com `prev_hash` nulo (parte pura de AC3),
    encadeamento e detecção de adulteração (AC8).
  - `ProvisionTenant` com portas fake — orquestração feliz na ordem certa (AC1/AC2), slug
    inválido rejeitado antes de qualquer porta de escrita (AC4), slug `active` rejeitado (AC5),
    falha do provisioner → `markFailed` e erro propagado (AC6), retry de `failed` (AC7).
- Integração (apps/api, vitest + Postgres real `frotas-db-1`, schemas de teste descartáveis):
  - Fluxo real cria schema com as tabelas do template e tenant `active` (AC1).
  - Identity/membership/usuário local criados; segundo tenant com o mesmo CPF reusa a identity (AC2).
  - Registro-gênese em `audit_log` com hash conferido pela função de verificação do domínio (AC3).
  - Slug já `active` → erro e nada muda (AC5).
  - Falha injetada (template inválido) → sem schema órfão, tenant `failed` (AC6); nova execução
    termina `active` (AC7).

## Plano por camada (domain → contracts → api → app)
0. **ADR registrado:** `specs/adr/0012-auditoria-hash-encadeado-por-tenant.md` — trilha de
   auditoria no `audit_log` de cada schema de tenant, cadeia de hash por schema, gênese no
   provisionamento, append serializado por schema.
1. **domain** (`packages/domain/src/audit/` e `src/provisioning/`): tipos `AuditEntry`,
   `computeEntryHash`, `verifyChain` (node:crypto, sem dependências); VO/validação `TenantSlug`;
   erros (`InvalidTenantSlugError`, `TenantAlreadyActiveError`); portas `TenantDirectory`
   (findBySlug, createProvisioning, markActive, markFailed), `TenantSchemaProvisioner`
   (provision(schemaName, admin, genesisEntry) — atômico) e `AdminIdentityDirectory`
   (findOrCreateByCpf + ensureAdminMembership); caso de uso `ProvisionTenant`. Testes primeiro.
2. **contracts**: nada nesta fatia — não há superfície HTTP (provisionamento por script; não
   existe auth de operador de plataforma ainda). Registrado como decisão abaixo.
3. **api** (`apps/api/src/provisioning/`): `PrismaTenantDirectory`, `PrismaAdminIdentityDirectory`
   (control-plane, Prisma typed), `RawSqlTenantSchemaProvisioner` (uma transação: schema + template
   + user local + gênese da auditoria, via `$executeRaw`/`SET LOCAL search_path`), mappers,
   `provisioning.module`, CLI `provision.ts` (NestFactory.createApplicationContext + parse de args)
   e script pnpm. Testes de integração.
4. **db** (`packages/db`): extrair do `tenant-runner` a primitiva `applyTenantTemplate(tx, schema)`
   reutilizável; `provisionTenant` atual continua existindo para o seed-demo (fixture) — o fluxo
   real da API usa a primitiva. Sem mudança de comportamento no seed.
   (**app**: nenhuma superfície web/mobile nesta fatia.)

## Riscos e decisões
- **Segurança (revisão `revisar-tenant` obrigatória):** slug interpolado em DDL (`CREATE SCHEMA`)
  → mitigado pela validação estrita no domínio (whitelist de caracteres) + identifier quoting no
  adapter. Toca dado de tenant e SQL cru.
- **Concorrência no append da auditoria:** `prev_hash` tem corrida se dois appends simultâneos
  lerem o mesmo último hash. Nesta fatia só o provisionamento escreve (gênese, schema novo — sem
  corrida real); a porta documenta que o append deve ser serializado por schema (advisory lock /
  `FOR UPDATE`) para os consumidores de F03+.
- **Decisão — sem endpoint HTTP:** não existe autenticação de operador de plataforma (DDS) ainda;
  expor provisionamento na API pública seria risco sem ganho. Fica script de ops; a tela
  self-service (pós-M0) introduz a superfície HTTP com auth própria.
- **Decisão — `provisioning_jobs` não usado:** a tabela existe para o fluxo assíncrono self-service
  (pós-M0). No fluxo síncrono por script, o status do tenant (`provisioning`/`active`/`failed`) +
  auditoria bastam.
- **Decisão — seed-demo não passa pelo caso de uso:** `packages/db` não pode depender dos adapters
  da API; o seed continua na primitiva de baixo nível (mesmo template, sem drift). Corolário: a
  blocklist de reservados vive no caso de uso (`parseTenantSlug`), não na primitiva — por isso os
  slugs de fixture `demo`/`demo2` (que constam na lista) continuam funcionando no seed, enquanto o
  onboarding real via caso de uso os rejeita.
- Risco: testes de integração dependem do Postgres compartilhado `frotas-db-1`
  (ver [[toolchain-nvm-path]]); schemas/slugs de teste próprios e descartáveis para não colidir
  com o seed de dev.
