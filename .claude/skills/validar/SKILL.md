---
name: validar
description: Portão de qualidade antes de commit/PR. Use ao finalizar uma tarefa. Roda testes/lint/typecheck/build por afetação, confere rastreabilidade SDD e as convenções.
---
1. pnpm turbo run lint typecheck test build --affected. Corrija o que quebrar.
2. SDD: cada critério de aceite da spec (specs/features/) tem teste correspondente.
3. Idioma: rotas/UI em PT; código, banco, tipos em EN.
4. Se tocou tenant/auth, rode o subagent `revisor` (ou a skill revisar-tenant).
5. Commit convencional. Nunca commite .env nem segredo.
