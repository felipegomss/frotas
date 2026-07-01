---
name: modulo-hexagonal
description: Molde para implementar um módulo ponta a ponta no padrão hexagonal, em TDD. Use após o plano aprovado. Escreve o teste do critério de aceite primeiro, depois o código.
---
Pré-requisito: existe spec em specs/features/ com critérios de aceite.
TDD por critério: escreva o teste que falha, veja falhar, implemente o mínimo, refatore.
Camadas (idioma: código em inglês):
1. packages/domain/src/<module>/ : entidade + value objects (sem framework, sem Prisma)
2. packages/domain/src/<module>/ : porta (interface de repositório)
3. packages/domain/src/<module>/ : caso de uso (depende só da porta) + teste vitest com repo fake
4. packages/contracts/src/ : DTO/schema Zod, se houver I/O de API
5. apps/api/src/<module>/infra : adaptador + mapper (row -> entidade)
6. apps/api/src/<module> : controller (rota em PT-BR) + module NestJS (binding)
Regras: nunca vazar tipo do Prisma fora do adaptador; dado de tenant via $queryRaw + SET LOCAL
search_path em transação (ADR 0005).
Ao terminar: skill `validar` e, se tocou tenant/auth, o subagent `revisor`.
