# ADR 0014 - Tokens e componentes base do DS antecipados em `packages/ui`

Aceito. Atualiza parcialmente o ADR 0013 (que segue válido para Storybook e biblioteca completa).

## Contexto
O ADR 0013 adiou o Design System para pós-MVP em parte porque o preset de tema "seria
fornecido depois". O preset chegou (shadcn `base-vega`) junto com a proposta de logo do
cliente (paleta navy `#1B3A63` + verde `#55A32F`), e a UI do MVP não pode divergir
visualmente entre os frontends.

## Decisão
Antecipar para o MVP apenas a **fundação** do DS, hospedada em `packages/ui` (local já
previsto pelo ADR 0013):

- **Tokens de estilo** em `packages/ui/src/styles/globals.css` — fonte única de verdade,
  importada pelos apps web via `@import "@frotas/ui/globals.css"`. Paleta derivada da
  logo: primária navy, verde como `--success` e nos gráficos, neutros frios (slate),
  modo claro e escuro.
- **Componentes shadcn sob demanda** em `packages/ui/src/components/*` — estilo
  `base-vega` do preset, primitivos **Base UI**, ícones **Remix Icon**, fontes IBM Plex
  Sans (texto) e Inter (headings). O `components.json` dos apps aponta os aliases
  `ui`/`utils` para `@frotas/ui`, então `pnpm dlx shadcn add <x>` rodado no app instala o
  componente no pacote compartilhado.
- Consumo src-only via `transpilePackages` (mesmo padrão de `@frotas/contracts`).
- **Mobile:** os tokens são variáveis CSS puras e serão reutilizados no Expo via
  NativeWind; componentes nativos ficam para a fase do DS formal.

Continuam **pós-MVP** (ADR 0013): Storybook, catálogo/documentação de variantes e a
migração sistemática das telas existentes — telas atuais migram incrementalmente.

## Motivo
- Consistência visual entre `web`, `admin-console` e mobile exige token único desde já;
  duplicar tema por app é retrabalho certo.
- Componentes locais por app (plano original do MVP) já começariam duplicados no primeiro
  segundo frontend.

### Alternativas rejeitadas
- **shadcn local em `apps/web`** (setup padrão do CLI): mais simples, mas os tokens e
  componentes não se compartilham; migrar depois para `packages/ui` reescreveria imports
  em todas as telas.
- **Esperar o pós-MVP como no ADR 0013 original:** o preset já existe; cada tela nova
  construída fora do tema aumenta o custo da migração.
- **DS completo agora (Storybook etc.):** segue rejeitado pelos motivos do ADR 0013.

## Reversibilidade e gatilho de reavaliação
- **Reversível:** os apps consomem tokens por import de CSS e componentes por alias;
  trocar preset/tema é editar um arquivo. A paleta atual usa uma proposta de logo ainda
  não final — **gatilho:** quando a logo definitiva chegar, recalibrar os tokens OKLCH.
- **Gatilho do DS formal:** MVP entregue/homologado → ativa o restante do ADR 0013
  (Storybook, catálogo, estratégia de componentes mobile com NativeWind).
