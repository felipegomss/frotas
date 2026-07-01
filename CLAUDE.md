# frotas (AMPARO Frota)

Plataforma SaaS multi-tenant de gestão de frota pública (DDS Sistemas).

## Documentação (consulte sob demanda)
Base de conhecimento em `specs/` — comece por `specs/README.md`.
Fluxo de trabalho e mapa de skills: `specs/fluxo.md`.
- Produto: specs/produto/ · Arquitetura: specs/arquitetura/ · Módulos: specs/EFs/
- Convenções: specs/convencoes/ · Decisões: specs/adr/ · Roadmap: specs/roadmap.md

## Fluxo (detalhe em specs/fluxo.md)
Entender EF -> planejar (skill) -> construir (modulo-hexagonal) -> validar -> revisar-tenant -> entregar.
Sempre plan mode primeiro. Rode o Claude Code a partir da raiz.

## Skills do projeto (.claude/skills/)
planejar · modulo-hexagonal · revisar-tenant · validar · novo-adr

## Plugins oficiais (instalar no Claude Code: /plugin install <nome>@claude-plugins-official)
security-guidance · code-review · frontend-design · skill-creator

## Regras sempre válidas (não-negociáveis)
- Idioma: rotas/UI em português; banco, código, tipos em inglês.
- Domínio (packages/domain) NÃO conhece Prisma. Depende de portas. Use mappers.
- Tipo do Prisma NUNCA cruza a fronteira do repositório.
- Tenant vem da claim assinada do token, validada no servidor. Nunca do cliente.
- Dado de tenant: $queryRaw + SET LOCAL search_path em transação (nunca de sessão).
- Prisma 7 exige driver adapter (@prisma/adapter-pg); url em prisma.config.ts.
- HTTP: fetch nativo, sem Axios. Worker fala com a API só via SQS.
- Contrato de API em packages/contracts (Zod), importado por web e mobile.

## Stack (resumo — detalhe em specs/arquitetura/stack.md)
Monorepo pnpm+Turborepo. Next.js (web/admin-console), NestJS hexagonal (api/worker),
Expo (mobile). PostgreSQL + Prisma 7. Estado: TanStack Query + Zustand. AWS sa-east-1.

## Comandos
- docker compose up -d
- pnpm dev | build | lint | test | typecheck
