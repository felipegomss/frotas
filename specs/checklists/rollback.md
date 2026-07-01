# Checklist de rollback (execução de incidente)

Objetivo: estabilizar primeiro, investigar depois. Não corrija na frente sob pressão.

- [ ] Identifiquei se a causa é CÓDIGO, BANCO (migration recente) ou FEATURE FLAG isolável.
- [ ] Se é feature flag isolável: desliguei a flag primeiro (mais rápido que redeploy).
- [ ] Se é código (homolog): git revert do PR causador; deixei o pipeline redeployar.
- [ ] Se é código (produção): apontei o serviço para a imagem/tag anterior conhecida-boa.
- [ ] Confirmei que NÃO preciso reverter banco junto (se precisar, a migration não seguiu
      expand/contract — registre isso como aprendizado, ver specs/arquitetura/rollback-banco.md).
- [ ] Se é migration EXPAND que falhou parcialmente no runner multi-schema: corrigi a causa e
      rodei de novo só nos schemas pendentes (idempotente), não reverti os que já pegaram.
- [ ] Sistema estabilizado. Abri a correção como PR normal (roll-forward) pelo fluxo padrão.
- [ ] Registrei o incidente: causa, o que foi revertido, e se falta uma flag/expand-contract
      que teria evitado o problema.
