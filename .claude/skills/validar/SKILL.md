---
name: validar
description: Portão de qualidade antes de commit/PR. Use ao finalizar uma tarefa. Roda lint, typecheck, testes e build por afetação e confere as convenções do projeto.
---
1. Rode: pnpm turbo run lint typecheck test build --affected. Corrija o que quebrar.
2. Idioma: rotas/UI em português; código, banco e tipos em inglês (specs/convencoes/idioma.md).
3. Confirme que há teste do caso de uso novo (vitest, repositório fake).
4. Se o código tocou dado de tenant/auth, rode a skill revisar-tenant.
5. Commit convencional descrevendo a mudança. Nunca commite .env nem segredo.
