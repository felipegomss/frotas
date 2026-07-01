---
name: planejar
description: Planeja uma feature ANTES de codar (SDD). Use ao iniciar algo novo. Cria a spec com critérios de aceite, define os testes primeiro (TDD) e propõe um plano em plan mode sem tocar em código.
---
Siga specs/checklists/planejamento.md. Passos:
1. Leia a EF do módulo (specs/EFs/), ADRs e convenções.
2. Crie/atualize specs/features/<nome>.md a partir de specs/features/_template.md,
   com critérios de aceite verificáveis (given/when/then).
3. Para cada critério, defina o teste que o prova (TDD: o teste vem antes do código).
4. Monte o plano por camada: domain -> contracts -> api -> app.
5. Liste riscos, fora de escopo e decisões (ADR via skill novo-adr se preciso).
6. NÃO edite código. Apresente o plano e peça aprovação (plan mode).
