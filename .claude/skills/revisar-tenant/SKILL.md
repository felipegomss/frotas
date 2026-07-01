---
name: revisar-tenant
description: Revisão de segurança das invariantes multi-tenant do projeto. Use antes de commitar código que toque dado de tenant, autenticação, SQL cru ou upload.
---
Verifique e recuse o que falhar (reporte por severidade P0..P3 e proponha a correção mínima):
1. Tenant vem SEMPRE da claim assinada do token, validado contra memberships no servidor.
   Nenhum endpoint de produção aceita tenant/schema vindo de body, query ou header do cliente.
2. Acesso a dado de tenant usa SET LOCAL search_path DENTRO de transação (nunca de sessão).
3. O nome do schema vem do registro de tenants (validado por slug), NUNCA interpolado de input
   do usuário em $queryRawUnsafe (risco de SQL injection). Slug validado por regex estrito.
4. Nenhum tipo do Prisma cruza a fronteira do repositório; erro do Prisma vira erro de domínio.
5. Autorização por role (membership) checada nos endpoints sensíveis.
6. Sem segredo hardcoded (use env/Secrets Manager). Sem PII em log.
7. Upload: URL assinada com escopo do tenant; key sob o prefixo do tenant.
Base: specs/arquitetura/seguranca.md e specs/arquitetura/multi-tenant.md.
