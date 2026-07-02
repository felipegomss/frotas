# Feature: M0-F01 — Login com tenant no token + listar frota isolada (walking skeleton)

Módulo/EF: base (roadmap fases 3–4: identidade/auth + bordas) + specs/EFs/01-cadastro-frota.md
Fase/milestone: M0 · MVP — primeira fatia (walking skeleton)

## Objetivo
Provar a stack inteira ponta a ponta: a identidade autentica no IdP, o tenant ativo vem de uma
claim **assinada pela API** (derivada das memberships, nunca do cliente) e `GET /frota` devolve só
os veículos daquele tenant — matando o débito do `X-Tenant-Schema` por header.

## Escopo
- Verificação de token do IdP na API (jose + JWKS), com emissor configurável: Cognito em prod,
  emissor OIDC falso local (JWKS + JWT assinado com jose) em dev/test — mesmo código de verificação.
- `GET /sessao/prefeituras`: lista as prefeituras (memberships ativas) da identidade autenticada,
  para seleção. Não expõe prefeituras de terceiros nem catálogo global.
- `POST /sessao`: recebe o token do IdP (header Authorization) + `{ tenantId }`, valida a membership
  ativa e emite um **token de sessão assinado pela API** com a claim do tenant (`schemaName`, `role`).
- `TenantContext` passa a derivar o schema **exclusivamente** da claim assinada e verificada; o
  caminho por header (`ALLOW_HEADER_TENANT`) é removido.
- `GET /frota` protegido pelo token de sessão; retorna os veículos disponíveis do tenant da claim
  (reusa o módulo `vehicle`/MOLDE já existente).
- Seed com dois tenants (`tenant_demo`, `tenant_demo2`) com veículos distintos + identidade e
  memberships de demonstração, para provar isolamento.

## Fora de escopo
- Provisionamento real de prefeitura (é M0-F02); aqui o tenant nasce do seed.
- Qualquer superfície web, inclusive smoke visual (adiado para M0-F04); F01 é provado por testes.
- 2FA, refresh token, logout/revogação, RBAC além de "membership ativa" (fases/features futuras).
- Infra real do Cognito User Pool (entra na trilha de homologação, M0-F10).
- Trilha de auditoria com hash encadeado (começa em M0-F02).
- App do motorista (M0-F09).

## Critérios de aceite (cada um vira ao menos um teste)
- [x] AC1: dada uma identidade com membership ativa na prefeitura A, quando chama `POST /sessao`
  com um IdP token válido e `{ tenantId: A }`, então recebe 200 e um token de sessão assinado pela
  API cuja claim contém o `schemaName` e o `role` da prefeitura A.
- [x] AC2: dado um IdP token inválido/expirado (assinatura não verifica no JWKS), quando chama
  `POST /sessao`, então 401 e nenhum token de sessão é emitido.
- [x] AC3: dada uma identidade sem membership ativa na prefeitura pedida, quando chama `POST /sessao`
  para aquele tenant, então 403 e nenhum token é emitido.
- [x] AC4: dado um token de sessão válido para a prefeitura A, quando chama `GET /frota`, então
  retorna somente os veículos de A (nenhum veículo de `tenant_demo2` aparece).
- [x] AC5: dado um token de sessão para a prefeitura A, quando a requisição também envia um header
  `X-Tenant-Schema: tenant_demo2` forjado, então o header é ignorado e a resposta continua sendo a
  frota de A — o schema vem só da claim assinada.
- [x] AC6: dada uma requisição a `GET /frota` sem token de sessão ou com assinatura inválida/adulterada,
  então 401 e nenhum dado de tenant é acessado.
- [x] AC7: dada uma identidade autenticada, quando chama `GET /sessao/prefeituras`, então lista
  apenas as suas memberships ativas (id, slug, nome, role), sem vazar outras prefeituras.

## Testes que provam cada critério (TDD — escritos antes do código)
- Domínio (vitest, `packages/domain`): `StartTenantSession` com `FakeMembershipDirectory` —
  membership ativa retorna a claim (AC1); ausência de membership lança erro de domínio (AC3).
- Token de sessão (unit): `signSession`/`verifySession` — token adulterado é rejeitado (AC2/AC6).
- Integração da API (Nest Testing + supertest, requer Postgres `frotas-db-1` com o seed de 2 tenants):
  - `POST /sessao` feliz emite token com a claim correta (AC1).
  - IdP token inválido → 401 (AC2). Sem membership → 403 (AC3).
  - `GET /frota` com sessão de A → só veículos de A (AC4).
  - `GET /frota` com header `X-Tenant-Schema` forjado → ignorado (AC5).
  - `GET /frota` sem/со token inválido → 401 (AC6).
  - `GET /sessao/prefeituras` lista só as memberships da identidade (AC7).
  - Helper de teste emite IdP tokens via JWKS local + jose (mesma verificação de prod).

## Plano por camada (domain → contracts → api → app)
1. **domain** (`packages/domain/src/auth/`): `ActiveMembership` (tipo), porta `MembershipDirectory`
   (`listActive(identityId)`, `findActive(identityId, tenantId)`), caso de uso `StartTenantSession`
   (valida membership → devolve dados da claim). Sem Prisma. Testes primeiro.
2. **contracts** (`packages/contracts/src/`): Zod `StartSessionRequest` (`{ tenantId }`),
   `SessionResponse` (`{ token, tenant, role }`), `PrefeiturasResponse`, `VehicleListItem`.
3. **api** (`apps/api/src/auth/`): `idp-verifier` (jose+JWKS, issuer/audience por env),
   `session-token` (sign/verify do JWT da API), `PrismaMembershipDirectory` (adapter typed Prisma,
   control-plane), `session.controller` (`POST /sessao`, `GET /sessao/prefeituras`), `session.guard`
   + principal; refatorar `TenantContext` para ler o schema da claim verificada (remover header);
   aplicar guard no `FrotaController`; wiring no `AppModule`. Testes de integração.
4. **db** (`packages/db/src/seed.ts`): segundo tenant + identidade + memberships de demonstração.
   (Superfície web adiada para M0-F04; F01 termina na fronteira da API, provado por testes.)

## Riscos e decisões
- **Decisão registrada em `specs/adr/0010-auth-dois-tokens.md`:** modelo de dois tokens — IdP token
  (externo, prova identidade) + token de sessão assinado pela API (interno, carrega o tenant ativo
  derivado das memberships). Rastreado na issue #2. Ver [[auth-cognito-decision]].
- Risco: dev sem Cognito real → mitigado pelo emissor OIDC falso (JWKS local), verificação idêntica.
- Risco: testes de integração dependem do Postgres compartilhado (`frotas-db-1`) e do seed de 2
  tenants; documentar o pré-requisito. Ver [[toolchain-nvm-path]].
- Segurança: toca auth **e** dado de tenant → revisão `revisar-tenant` é obrigatória antes do commit.
- Decidido: smoke web adiado para M0-F04; ADR 0010 registrado antes de codar.

## Nota de evolução (jul/2026, redesign do DS)
O fluxo web de login mudou de "lista de prefeituras para seleção" para o fluxo
espelhando produção: a prefeitura é resolvida pelo **subdomínio** do Host
(`<slug>.<domínio>` — F02, `apps/web/src/lib/tenant-host.ts`), e o login pede
identidade + código 2FA (OTP fixo `000000` em dev, validado no servidor —
`apps/web/src/lib/otp.ts`) até o Cognito entrar (ADR 0010). `GET
/sessao/prefeituras` segue existindo: o web o usa para casar o slug do host com
as memberships da identidade; a autoridade continua sendo o token assinado.
Em dev, `localhost` sem subdomínio cai em `DEV_TENANT_SLUG` (default `demo`);
`<slug>.localhost` também funciona.
