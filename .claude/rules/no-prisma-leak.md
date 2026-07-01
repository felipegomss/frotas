---
description: Impede tipos do Prisma de cruzarem a fronteira do repositório.
globs: ["packages/domain/**", "apps/api/src/**/use-cases/**"]
---
Domínio e casos de uso não importam de @prisma/client nem retornam tipos do Prisma.
Repositórios retornam entidades de @frotas/domain.
