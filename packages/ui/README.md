# @frotas/ui

Design System do AMPARO Frota. Fonte única de tokens de estilo e componentes
compartilhados entre os frontends web (`apps/web`, `apps/admin-console`).

## O que vive aqui

- `src/styles/globals.css` — **tokens** (cores da marca em OKLCH, radius, fontes,
  modo escuro). É a única fonte de verdade de estilo; nenhum app define token próprio.
- `src/components/*` — componentes shadcn/ui (estilo `base-vega`, primitivos Base UI,
  ícones Remix Icon), adicionados **sob demanda**.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).

## Paleta da marca (logo AMPARO Frota)

| Token | Cor | Uso |
|-------|-----|-----|
| `--primary` | Azul-marinho `#1B3A63` | Ações principais, links, foco |
| `--success` | Verde `#55A32F` | Status positivo, confirmações |
| `--chart-1..5` | Escala navy ↔ verde | Gráficos (recharts) |
| Neutros | Slate (frios) | Superfícies, bordas, texto secundário |

## Como consumir (apps web)

1. `"@frotas/ui": "workspace:^"` nas dependências e `"@frotas/ui"` em
   `transpilePackages` no `next.config.ts`.
2. No `globals.css` do app:
   ```css
   @import "@frotas/ui/globals.css";
   @source "../../../../packages/ui/src";
   ```
3. O app carrega as fontes (next/font) e expõe as variáveis `--font-sans`
   (IBM Plex Sans), `--font-heading` (Inter) e `--font-geist-mono` no `<html>`
   — ver `apps/web/src/app/layout.tsx`.
4. Importar componentes: `import { Button } from "@frotas/ui/components/button"`.

## Como adicionar um componente

Rode a partir do app (o CLI detecta o monorepo e escreve aqui):

```bash
cd apps/web
pnpm dlx shadcn@latest add <componente>
```

Depois rode `pnpm lint --fix` neste pacote (formatação prettier).

## Mobile (Expo)

Os tokens são variáveis CSS puras (`:root`/`.dark`) e serão consumidos no mobile
via NativeWind, reutilizando este mesmo arquivo de tema. Os componentes deste
pacote são web-only; a estratégia de componentes nativos (NativeWind + lib a
definir) será decidida na fase do DS formal (pós-MVP, ADR 0013/0014).

## Escopo (MVP)

Setup antecipado: tokens + componentes base. Storybook, variantes documentadas e
biblioteca completa continuam pós-MVP (ADR 0013).
