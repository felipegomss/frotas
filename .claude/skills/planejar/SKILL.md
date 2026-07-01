---
name: planejar
description: Planeja uma feature ou módulo ANTES de codar. Use ao iniciar algo novo. Lê a EF do módulo, os ADRs e as convenções, e propõe um plano em plan mode sem tocar em código.
---
1. Identifique o módulo/feature e leia a EF em specs/EFs/.
2. Leia os ADRs e convenções relevantes (specs/adr/, specs/convencoes/) e o specs/roadmap.md.
3. Proponha um plano por camada: domain (entidade, porta, caso de uso) -> contracts (Zod)
   -> api (adaptador, mapper, controller, module) -> app (web/mobile). Inclua os testes.
4. Liste riscos, decisões em aberto e o que fica fora de escopo.
5. NÃO edite código. Apresente o plano e peça aprovação (plan mode).
Decisão de arquitetura nova -> use a skill novo-adr.
