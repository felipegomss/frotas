# Arquitetura — visão geral

## Monorepo (pnpm workspaces + Turborepo)
apps/  : web, admin-console (Next.js) · api, worker (NestJS) · mobile-motorista, mobile-gestor (Expo)
packages/ : domain (núcleo hexagonal) · contracts (DTOs/Zod) · db (Prisma admin + template de tenant)
            · config · ui · mobile-shared

## Princípios
- Hexagonal (Ports & Adapters) na api: regra de negócio não conhece framework nem ORM.
- Next.js é o BFF do web (server components/route handlers).
- Mobile fala com a API por REST; endpoints "no formato da tela" reduzem round-trips.
- Worker é assíncrono: consome SQS e roda por cron (EventBridge). Nunca HTTP síncrono da API.
- Deploy por afetação: cada app tem seu artefato; só sobe o que mudou.

## Fluxo de request (ideal)
cliente -> CloudFront -> API -> resolve tenant (claim do token) -> abre transação com
SET LOCAL search_path no schema do tenant -> caso de uso -> repositório -> resposta.
