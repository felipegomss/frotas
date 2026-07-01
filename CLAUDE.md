# frotas (AMPARO Frota)

Plataforma SaaS multi-tenant de gestão de frota pública (DDS Sistemas).

## Documentação (consulte sob demanda)
Base em `specs/` — comece por `specs/README.md`. Fluxo e skills: `specs/fluxo.md`.
Produto: specs/produto/ · Arquitetura: specs/arquitetura/ · Módulos: specs/EFs/
Convenções: specs/convencoes/ · Decisões: specs/adr/ · Checklists: specs/checklists/
Specs de feature: specs/features/ · Roadmap: specs/roadmap.md

## Disciplina obrigatória (specs/convencoes/tdd-sdd.md)
- SDD: nada de código sem spec com critérios de aceite (specs/features/).
- TDD: teste do critério primeiro; red-green-refactor. PR não passa sem teste.

## Fluxo (specs/fluxo.md)
Entender -> planejar (spec) -> construir (TDD) -> validar -> revisar (subagent) -> entregar.
Sempre plan mode. Rode o Claude Code a partir da raiz.

## Skills: quebrar-milestone · planejar · modulo-hexagonal · revisar-tenant · validar · novo-adr
## Subagent: revisor (revisão sem contexto, aplica specs/checklists/revisao.md)
## Plugins oficiais: security-guidance · code-review · frontend-design · skill-creator

## Regras não-negociáveis
- Idioma: rotas/UI em português; banco, código, tipos em inglês.
- Domínio (packages/domain) NÃO conhece Prisma. Depende de portas. Use mappers.
- Tipo do Prisma NUNCA cruza a fronteira do repositório.
- Tenant vem da claim assinada do token, validada no servidor. Nunca do cliente.
- Dado de tenant: $queryRaw + SET LOCAL search_path em transação (nunca de sessão).
- Prisma 7 exige driver adapter (@prisma/adapter-pg); url em prisma.config.ts.
- HTTP: fetch nativo, sem Axios. Worker fala com a API só via SQS.
- Contrato de API em packages/contracts (Zod), importado por web e mobile.

## Stack (detalhe em specs/arquitetura/stack.md)
Monorepo pnpm+Turborepo. Next.js (web/admin-console), NestJS hexagonal (api/worker),
Expo (mobile). PostgreSQL + Prisma 7. TanStack Query + Zustand. AWS sa-east-1.

## Comandos
- docker compose up -d
- pnpm dev | build | lint | test | typecheck
