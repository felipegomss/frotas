---
description: Regras do Prisma 7 (driver adapters, sem url no schema).
globs: ["packages/db/**", "apps/api/**", "apps/worker/**"]
---
- Prisma 7 é "Rust-free" e EXIGE driver adapter. Postgres = @prisma/adapter-pg + pg.
- Instanciar: new PrismaClient({ adapter: new PrismaPg({ connectionString }) }).
- A url NÃO fica no schema.prisma. Fica em packages/db/prisma.config.ts (datasource.url).
- O client generated pode ter output custom; confira o caminho REAL gerado e importe de lá,
  não presuma "@prisma/client". Rode `prisma generate` e verifique o output antes de codar.
- Tabelas de tenant NÃO são models do Prisma. Só o control-plane (admin) é. Dado de tenant
  é acessado por SQL cru via $queryRaw com SET LOCAL search_path dentro de transação.
