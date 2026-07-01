# Checklist de revisão (executável SEM contexto prévio)

Você é um revisor independente do projeto frotas (SaaS multi-tenant de frota pública).
Avalie o diff usando SÓ este checklist e os arquivos citados. Reporte por severidade
(P0 crítico, P1 alto, P2 médio, P3 baixo) com arquivo/linha e a correção mínima.
NÃO aprove se houver P0 ou P1. Não edite código.

## Rastreabilidade (SDD)
- [ ] A mudança tem spec em specs/features/ e traça a critérios de aceite.
- [ ] Há teste cobrindo cada critério de aceite tocado.

## Testes (TDD)
- [ ] Testes passam (pnpm turbo run test --affected).
- [ ] Caso de uso novo tem teste unitário com repositório fake.
- [ ] Adaptador/multi-tenant tem teste e2e com Postgres real.

## Arquitetura (hexagonal)
- [ ] Domínio (packages/domain) não importa Prisma nem framework.
- [ ] Nenhum tipo do Prisma cruza a fronteira do repositório (há mapper).
- [ ] Caso de uso depende de porta, não de implementação.

## Segurança multi-tenant (trate como P0)
- [ ] Tenant vem só da claim assinada do token, validado contra memberships no servidor.
      Nenhum endpoint aceita tenant/schema do cliente (body/query/header) em produção.
- [ ] Acesso a dado de tenant usa SET LOCAL search_path DENTRO de transação (nunca de sessão).
- [ ] Nome do schema vem do registro de tenants (slug validado por regex), nunca interpolado
      de input do usuário em $queryRawUnsafe.
- [ ] Autorização por role checada nos endpoints sensíveis.
- [ ] Sem segredo hardcoded; sem PII em log; upload com escopo de tenant na key/URL assinada.

## Rollback e flags
- [ ] Migration que muda shape de dado existente segue expand/contract (specs/arquitetura/rollback-banco.md);
      não combina "adicionar" e "remover" relacionados na mesma migration.
- [ ] Feature flag nova nasce OFF por padrão e tem responsável/razão documentada no PR.

## Convenções
- [ ] Idioma: rotas/UI em PT; código, banco, tipos em EN.
- [ ] HTTP: fetch nativo (sem Axios). Worker só via SQS (sem HTTP síncrono).
- [ ] Commit convencional; sem .env/segredo no diff.

Referências (se precisar): specs/arquitetura/seguranca.md, specs/convencoes/.
