# Fluxo de desenvolvimento (Claude Code)

Ciclo padrão de uma feature, do spec ao merge. Cada passo tem uma skill.
Sempre começar em plan mode (Shift+Tab) e rodar o Claude Code a partir da raiz do repo.

1. ENTENDER  — leia a EF do módulo (specs/EFs/) e os ADRs/convenções relevantes.
2. PLANEJAR  — skill `planejar`: plano por camada, contrato, testes, riscos. Aprove antes de codar.
3. CONSTRUIR — skill `modulo-hexagonal`: domain -> contracts -> api -> app, com mapper e teste.
4. VALIDAR   — skill `validar`: lint/typecheck/test/build afetados + convenções.
5. SEGURANÇA — skill `revisar-tenant` (+ plugin security-guidance): invariantes multi-tenant.
6. ENTREGAR  — commit convencional -> PR -> CI por afetação -> merge (homolog auto; prod atrás de gate).

Decisão de arquitetura nova em qualquer passo -> skill `novo-adr`.

## Skills do projeto (.claude/skills/)
- planejar          — planeja antes de codar (lê EF, ADRs, roadmap).
- modulo-hexagonal  — molde de módulo ponta a ponta.
- revisar-tenant    — revisão das invariantes de segurança multi-tenant.
- validar           — portão de qualidade antes do commit.
- novo-adr          — registra uma decisão de arquitetura.

## Plugins oficiais recomendados (marketplace claude-plugins-official)
Instale dentro do Claude Code (não é comando de shell):
  /plugin install security-guidance@claude-plugins-official   (avisos de risco ao editar)
  /plugin install code-review@claude-plugins-official          (revisão de diff)
  /plugin install feature-dev@claude-plugins-official          (workflow de feature, opcional)
  /plugin install frontend-design@claude-plugins-official      (UI do web)
  /plugin install skill-creator@claude-plugins-official         (criar/evoluir skills)
Depois: /reload-plugins
O security-guidance é best-effort, não garantia: a skill revisar-tenant e a revisão humana continuam valendo.
