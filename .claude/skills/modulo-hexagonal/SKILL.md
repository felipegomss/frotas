---
name: modulo-hexagonal
description: Molde para implementar um módulo de domínio ponta a ponta no padrão hexagonal (entidade, porta, caso de uso, adaptador, mapper, wiring NestJS). Use ao construir qualquer área de negócio após o plano aprovado.
---
Ordem e camadas:
1. packages/domain/src/<module>/ : entidade + value objects (inglês, sem framework, sem Prisma)
2. packages/domain/src/<module>/ : porta (interface de repositório)
3. packages/domain/src/<module>/ : caso de uso (depende só da porta)
4. packages/contracts/src/ : DTO/schema Zod se houver entrada/saída de API
5. apps/api/src/<module>/infra : adaptador que implementa a porta + mapper (row -> entidade)
6. apps/api/src/<module> : controller (rota em PT-BR) + module NestJS com o binding
Regras:
- Nunca importar @prisma/client no domínio nem retornar tipo do Prisma fora do adaptador.
- Dado de tenant: adaptador usa $queryRaw + SET LOCAL search_path em transação (ADR 0005).
- Escreva teste do caso de uso (vitest) com repositório fake.
Ao terminar: rode a skill validar e, se tocou dado de tenant/auth, a skill revisar-tenant.
