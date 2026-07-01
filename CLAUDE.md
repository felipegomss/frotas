# frotas

Plataforma SaaS multi-tenant de gestão de frota pública (DDS Sistemas).

## Padrão de idioma
- Fronteira em PORTUGUÊS: rotas (/frota, /ordens-de-uso), textos de UI, rótulos de relatório.
- Interior em INGLÊS: tabelas e colunas do banco, variáveis, funções, classes, tipos.

## Stack
- Monorepo: pnpm workspaces + Turborepo
- Web/Admin-console: Next.js (App Router), Tailwind, shadcn/ui
- API/Worker: NestJS (hexagonal), Prisma
- Mobile: Expo (motorista e gestor)
- Estado: TanStack Query (servidor) + Zustand (cliente/UI).
- Formulários: React Hook Form + Zod (mesmo schema de @frotas/contracts).
- Banco: PostgreSQL, multi-tenant por schema. Prisma no controle (admin).

## Convenções não-negociáveis
- Domínio (packages/domain) NÃO conhece Prisma. Depende de portas.
- Tipo do Prisma NUNCA cruza a fronteira do repositório. Use mappers.
- Tenant vem da claim assinada do token, validada no servidor.
- Acesso a dado de tenant usa SET LOCAL search_path em transação.
- Contrato de API em packages/contracts (Zod).
- HTTP: fetch nativo, sem Axios.
- Worker fala com a API só via SQS. Nunca HTTP síncrono.

## Comandos
- docker compose up -d
- pnpm dev | build | lint | test | typecheck
