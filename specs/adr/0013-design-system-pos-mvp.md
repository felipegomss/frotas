# ADR 0013 - Design System (shadcn/ui + Storybook) entra pós-MVP

Aceito. Parcialmente atualizado pelo ADR 0015 (tokens e componentes base do DS antecipados
para o MVP em `packages/ui`; Storybook e biblioteca completa seguem pós-MVP).

## Decisão
No MVP (M0), a UI web é construída de forma **simples e funcional**, sem um design system
formal: componentes locais por app, Tailwind direto e o mínimo de abstração para entregar as
telas (cadastros, ordem de uso, dashboard). Não se investe em tokens, variantes ou documentação
de componentes nesta fase.

Logo **após a entrega do MVP**, um Design System dedicado será introduzido:
- **Base:** shadcn/ui (já previsto no stack — `specs/arquitetura/stack.md`).
- **Preset:** um preset de tema/tokens será fornecido pelo time no momento da implementação (não
  inventar tema agora).
- **Documentação/visualização:** Storybook.
- **Local:** o pacote compartilhado `packages/ui` (já reservado em `specs/arquitetura/visao-geral.md`)
  passa a hospedar os componentes do DS, consumidos por `web` e `admin-console`.

## Motivo
- Escala atual (MVP, primeira prefeitura em homologação) não justifica o custo de montar um DS
  antes de existirem telas reais que informem quais componentes/variantes valem a pena abstrair.
- Construir simples agora e migrar depois evita abstração prematura: o DS nasce a partir de UI
  concreta, não de suposição.

### Alternativas rejeitadas por ora
- **DS completo já no MVP** (tokens + Storybook + `packages/ui` desde a primeira tela): atrasa a
  entrega do MVP e congela decisões de design sem uso real que as valide.
- **Nunca ter DS** (cada app com seus componentes ad hoc): não escala para F05+ e os dois apps web
  (`web`, `admin-console`); gera divergência visual e retrabalho.

## Reversibilidade e gatilho de reavaliação
- **Gatilho:** disparar a adoção do DS assim que o MVP (M0) for entregue/homologado e o preset de
  tema for fornecido.
- **Reversível:** a UI do MVP é intencionalmente rasa; migrar telas para os componentes do DS é
  incremental (tela a tela), sem reescrita de domínio/API/contratos. O front consome contratos de
  `@frotas/contracts`, então a troca é puramente de camada de apresentação.
- **Não contradiz** nenhum ADR aceito. Detalha o item de stack (shadcn/ui) definindo **quando** e
  **como** ele vira DS. Relaciona-se com ADR 0007 (estado do front).
