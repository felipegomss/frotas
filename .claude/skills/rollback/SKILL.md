---
name: rollback
description: Conduz um rollback de incidente (código, banco ou feature flag) em produção ou homolog. Use quando o usuário disser que algo quebrou e precisa reverter/estabilizar rápido.
---
Método: specs/checklists/rollback.md (execução), specs/arquitetura/rollback-codigo.md,
specs/arquitetura/rollback-banco.md, specs/arquitetura/feature-flags.md.

Passos:
1. Pergunte/deduza (git log, deploy recente, flags ativas) qual foi a última mudança suspeita.
2. Classifique a causa: feature flag isolável > código > banco (nesta ordem de preferência
   de ação, da mais rápida/segura para a mais lenta/arriscada).
3. Siga specs/checklists/rollback.md item a item, narrando cada ação antes de executá-la.
4. NUNCA proponha reverter uma migration em produção sem antes confirmar que ela não seguiu
   expand/contract — se seguiu, o rollback de banco não deveria ser necessário.
5. Depois de estabilizado: abra a correção como PR normal pelo fluxo padrão (specs/fluxo.md),
   e registre o incidente (causa raiz, o que faltou).
Qual ambiente, qual deploy e qual flag são estado do momento — vêm do repositório/infra reais,
nunca de um valor fixado em arquivo de orientação.
