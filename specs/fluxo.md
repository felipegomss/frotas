# Fluxo de desenvolvimento (Claude Code) — SDD + TDD

Sempre plan mode primeiro (Shift+Tab); rode o Claude Code a partir da raiz.

1. ENTENDER  — leia a EF do módulo (specs/EFs/) e ADRs/convenções.
2. PLANEJAR  — skill `planejar` (SDD): cria spec em specs/features/ com critérios de aceite;
               define os testes primeiro. Checklist: specs/checklists/planejamento.md.
3. CONSTRUIR — skill `modulo-hexagonal` (TDD): teste que falha -> código mínimo -> refatora,
               por camada domain -> contracts -> api -> app.
4. VALIDAR   — skill `validar`: testes/lint/typecheck/build afetados + rastreabilidade SDD.
5. REVISAR   — subagent `revisor` (contexto isolado) aplica specs/checklists/revisao.md;
               + plugin security-guidance. Não passa com P0/P1.
6. ENTREGAR  — commit convencional -> PR -> CI por afetação -> merge (homolog auto; prod atrás de gate).

Decisão de arquitetura nova -> skill `novo-adr` (checklist specs/checklists/decisao.md).

## Skills (.claude/skills/): planejar · modulo-hexagonal · revisar-tenant · validar · novo-adr
## Subagent (.claude/agents/): revisor
## Checklists (specs/checklists/): planejamento · decisao · revisao

## Plugins oficiais (dentro do Claude Code): /plugin install <nome>@claude-plugins-official
security-guidance · code-review · frontend-design · skill-creator  (depois: /reload-plugins)
