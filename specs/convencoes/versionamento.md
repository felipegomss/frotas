# Versionamento e release (SemVer)

Tags no formato vMAJOR.MINOR.PATCH (https://semver.org). Cada push de tag v* dispara o
Portão 2 (release-checks.yml).

## Quando incrementar
- PATCH (v0.1.1): correção que não muda contrato nem comportamento externo (bugfix).
- MINOR (v0.2.0): feature nova aditiva, sem quebrar contrato existente (packages/contracts).
- MAJOR (v1.0.0+): quebra de contrato/comportamento, OU a primeira versão considerada pronta
  para produção real (não só homolog). Enquanto pré-produção, fica na faixa v0.x.y.

## Contrato como fonte da verdade
Se a mudança tocou packages/contracts (schema Zod exposto a web/mobile) de forma incompatível
(campo removido, tipo mudou, endpoint removido) -> é MAJOR, mesmo em v0.x.y trate como salto
de MINOR no mínimo. Aditivo e compatível (campo novo opcional) -> MINOR ou PATCH.

## Onde a tag entra no fluxo
main sempre implantável (auto-deploy em homolog a cada merge) -> quando um conjunto de
features está pronto para produção, cria-se a tag a partir da main -> dispara release-checks.yml
(Portão 2: e2e multi-tenant, build completo, auditoria de dependências, terraform plan, gate
de aprovação no Environment production).

## Mensagem da tag e do release
Título curto + lista das mudanças relevantes desde a tag anterior, agrupadas por tipo de commit
convencional (feat/fix/chore). Referencie o milestone/EF tocado quando fizer sentido
(isso é contexto da release, não vira orientação de método).
