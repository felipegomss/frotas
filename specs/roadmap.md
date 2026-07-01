# Roadmap de implementação — base sólida

Objetivo: construir o esqueleto que torna qualquer feature fácil e segura de escrever.
Isto é a BASE, não o produto (os milestones M0..M6 vêm depois, em cima disto).

## Fase 0 — Wiring do monorepo
transpilePackages no Next (web, admin-console); metro.config.js nos Expo (watchFolders).
Faz as peças se enxergarem. Sem isto, importar um package não compila.

## Fase 1 — Espinha hexagonal na API
PrismaService (Prisma 7 + driver adapter) + primeiro módulo ponta a ponta
(entidade, porta, caso de uso, adaptador, mapper, wiring Nest). Define o MOLDE do time.

## Fase 2 — Núcleo multi-tenant
Resolver de tenant (lê do token, valida memberships), serviço de provisionamento real,
acesso a dado com SET LOCAL search_path em transação. Prova que o isolamento funciona.

## Fase 3 — Identidade e autenticação
Login, memberships, token com tenant ativo assinado, validação no backend.
Decidir Cognito vs Auth.js aqui.

## Fase 4 — Bordas transversais
Tratamento de erro (erro de domínio -> HTTP), nestjs-zod com os contratos,
log estruturado (pino), esqueleto da trilha de auditoria com hash encadeado.

## Fase 5 — Storage e primeiro fluxo real
Upload de foto por URL assinada (S3/MinIO). Valida a stack ponta a ponta.

## Fase 6 — CI e homologação
Deploy por afetação no GitHub Actions; ambiente de homolog no Terraform.
Garante o caminho "commit -> deploy no homolog".

## Ritmo sugerido
Fases 0+1 juntas (primeiro módulo rodando). 2+3 são o miolo, com calma.
4, 5, 6 podem ser paralelizadas entre os devs.
