---
name: novo-modulo-hexagonal
description: Cria um módulo no padrão hexagonal (entidade, porta, caso de uso, adaptador Prisma, wiring NestJS).
---
1. Entidade + value objects em packages/domain/src/<module>/ (em inglês)
2. Porta no mesmo pacote
3. Caso de uso depende só da porta
4. Adaptador Prisma em apps/api/src/<module>/infra + mapper
5. Binding no módulo NestJS. Rotas e UI em português; código em inglês.
