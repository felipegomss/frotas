# Stack

Base: Node 20+, TypeScript, PostgreSQL 16, Prisma 7 (driver adapter @prisma/adapter-pg).

## Web (web, admin-console)
Next.js (App Router), Tailwind, shadcn/ui.
Estado: TanStack Query (servidor) + Zustand (UI). Dado de servidor NÃO vai no Zustand.
Formulários: React Hook Form + Zod (schema de @frotas/contracts).
Listas: TanStack Table. Gráficos: Recharts. Datas: date-fns. Ícones: @remixicon/react.
Design System: tokens e componentes base compartilhados em `@frotas/ui` (shadcn preset
`base-vega`, primitivos Base UI, paleta da logo) — ver ADR 0015 e `packages/ui/README.md`.
Componentes shadcn entram sob demanda via `pnpm dlx shadcn add`. O DS formal
(Storybook, catálogo, componentes mobile via NativeWind) entra pós-MVP — ver ADR 0013.

## API (NestJS, hexagonal)
Validação: nestjs-zod (contratos compartilhados). Config: @nestjs/config.
JWT: jose. Log: nestjs-pino/pino. AWS: SDK v3 (S3+presigner, SQS, SES). HTTP: fetch nativo (sem Axios).

## Worker (NestJS)
AWS SDK v3 (SQS, EventBridge). Relatórios: exceljs e pdfmake.

## Mobile (Expo)
TanStack Query, Zustand, RHF + Zod. expo-secure-store (token), expo-camera,
expo-image-picker (foto de painel/cupom), expo-notifications (push).
Instalar libs de Expo com `expo install`, não pnpm direto.
