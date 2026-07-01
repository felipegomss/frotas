# Convenção de código

## Hexagonal (Ports & Adapters)
- Domínio (packages/domain): entidades, value objects, portas (interfaces) e casos de uso.
  Sem framework, sem Prisma.
- Caso de uso depende só da porta. Adaptador (apps/api) implementa a porta.
- Tipo do Prisma NUNCA cruza a fronteira do repositório. Use mappers (row -> entidade).
- Erro do Prisma vira erro de domínio dentro do adaptador.

## Dado de tenant (ver ADR 0005)
- Tabelas de tenant não são models do Prisma. Acesso via $queryRaw + SET LOCAL search_path
  em transação. O schema do tenant vem do resolver (fase 2), nunca de input do usuário.

## Prisma 7
- Requer driver adapter: new PrismaClient({ adapter: new PrismaPg({ connectionString }) }).
- url fica em packages/db/prisma.config.ts, não no schema.prisma.
- Confirme o caminho REAL do client gerado antes de importar.

## Testes
- Teste de caso de uso com repositório fake (vitest). Multi-tenant: teste e2e com Postgres real.
