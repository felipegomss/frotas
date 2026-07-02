# Feature: M0-F04b — Tela web de veículos + fundação web

Módulo/EF: specs/EFs/01-cadastro-frota.md + roadmap fase 3 (auth-web) / fase 4
Fase/milestone: M0 · MVP

> UI simples de propósito: no MVP não há design system formal (componentes locais + Tailwind). O
> DS shadcn/ui + Storybook entra pós-MVP — ver ADR 0013. Não over-investir em design aqui; a
> migração para o DS é incremental e não toca domínio/API/contratos.

## Objetivo
Primeira superfície web do produto: listar, criar, editar e ver veículos (consumindo a API de
M0-F04), com a fundação mínima que destrava as telas de F05 em diante — sessão no browser (BFF com
cookie httpOnly), cliente de API, layout e navegação.

## Escopo
- **Fundação web (`apps/web`)**:
  - **Sessão via BFF (ADR 0010 + visão-geral "Next.js é o BFF do web")**: o token de sessão da API
    vive num **cookie httpOnly** setado no servidor (server action); nunca em localStorage/Zustand
    nem exposto ao JS do cliente. A leitura é feita em **server components** e a mutação em **server
    actions**, que leem o bearer do cookie no servidor e chamam a API (`API_BASE_URL`) — sem expor
    token nem endpoint da API ao browser.
  - **Login de dev**: página `/login` que, em dev, obtém um token do IdP fake (`dev-idp.mjs`), lista
    prefeituras (`GET /sessao/prefeituras`), o usuário escolhe a prefeitura, e o BFF faz
    `POST /sessao` e grava o cookie. O login Cognito real (hosted UI) fica para pós-MVP (roadmap
    fase 3 web) — o ponto de troca é isolado no route handler de login.
  - **Guarda de rota**: acesso a `/veiculos*` sem sessão redireciona para `/login`.
  - **Layout/nav mínimos** + logout (limpa o cookie).
  - Config: `API_BASE_URL` (server-only) apontando para a API (evita conflito de porta 3000).
- **Telas de veículos** (rota PT `/veiculos`):
  - Lista: placa, modelo, ano, tipo, secretaria, status, quilometragem.
  - Criar/editar: formulário React Hook Form + Zod (schema `CreateVehicleRequest`/
    `UpdateVehicleRequest` de `@frotas/contracts`), com dropdown de secretaria (`GET /secretarias`).
  - Detalhe (ver) e excluir (com confirmação).
- **Contratos**: reusa `@frotas/contracts` (nada novo previsto; se faltar algo, adicionar lá).

## Fora de escopo
- Design system / shadcn / Storybook / tokens (ADR 0013 — pós-MVP).
- Login Cognito real (hosted UI, refresh, logout federado) — pós-MVP.
- TanStack Query/Table no cliente: no MVP a leitura é server component + a mutação é server
  action; a camada de dados client-side entra junto do DS (quando as telas viram shadcn). Ver
  "Decisões".
- RBAC por papel (herdado de M0-F01: qualquer membership ativa gere).
- Telas de outros módulos (motoristas F05, ordens F06, etc.).
- E2E de navegador (Playwright) — ver "Riscos".

## Critérios de aceite (cada um vira ao menos um teste)
- [x] AC1: dado que não há cookie de sessão, quando acesso `/veiculos`, então sou redirecionado
  para `/login` e nenhuma chamada à API de tenant é feita.
- [x] AC2: dado o login de dev, quando escolho uma identidade válida e uma prefeitura, então o BFF
  faz `POST /sessao`, grava o token num cookie **httpOnly** e me leva a `/veiculos`.
- [x] AC3: dada uma sessão válida, quando abro `/veiculos`, então vejo a lista dos veículos do
  tenant (placa, modelo, ano, tipo, secretaria, status, km), buscada no servidor com o bearer.
- [x] AC4: dado o formulário de criação preenchido, quando submeto, então o BFF faz `POST /veiculos`
  e o veículo aparece na lista; entradas inválidas (placa/ano/tipo) mostram erro inline (Zod do
  contrato) antes do submit.
- [x] AC5: dado um veículo existente, quando abro "editar", então o formulário vem pré-preenchido e
  o submit faz `PUT /veiculos/:id`, refletindo a mudança.
- [x] AC6: dado um veículo existente, quando confirmo "excluir", então o BFF faz `DELETE /veiculos/:id`
  e ele some da lista.
- [x] AC7: dado o formulário de veículo, quando ele carrega, então o campo secretaria lista as
  secretarias do tenant (`GET /secretarias`).
- [x] AC8: dada uma resposta de erro da API (409 placa duplicada, 404, 400), quando ela ocorre,
  então uma mensagem legível é exibida e a UI não quebra.
- [x] AC9: dado que estou logado, quando faço logout, então o cookie de sessão é limpo e sou levado
  a `/login`.
- [x] AC10 (segurança): o token de sessão nunca chega ao JS do cliente — está só em cookie httpOnly;
  não aparece em localStorage, store do cliente, nem no corpo de resposta ao browser.

## Testes que provam cada critério (TDD — escritos antes do código)
Como `apps/web` ainda não tem runner, adicionar **vitest** ao app e testar as costuras de lógica
(a UI declarativa de baixo risco é verificada rodando o app):
- **Cliente de API / BFF** (`fetch` mockado): monta URL a partir de `API_BASE_URL`, injeta
  `Authorization: Bearer` a partir do cookie, e mapeia status → erro legível (AC3, AC4, AC5, AC6,
  AC8) — os handlers `/api/*` chamam a API com método/rota/corpo corretos.
- **Sessão/cookie** (`session.ts`): grava cookie com flags `httpOnly` (e `secure` em prod), lê e
  limpa; o token não vaza para retorno ao cliente (AC2, AC9, AC10).
- **Guarda de rota** (`requireSession`): sem cookie → redireciona a `/login` (AC1).
- **Parsing do formulário**: `CreateVehicleRequest.safeParse` rejeita placa/ano/tipo inválidos
  (AC4) — reusa o schema do contrato (já testado no nível de API em F04).
- **Verificado rodando o app** (skill `verify`/`run`, não automatizado nesta fatia): fluxo visual
  login → lista → criar → editar → excluir → logout (AC2–AC9 ponta a ponta na tela). Playwright
  fica como item futuro (ver Riscos).

## Plano por camada (foundation → telas)
1. **config/env**: `API_BASE_URL` (server-only) em `apps/web`; doc no README. Sem segredo commitado.
2. **fundação** (`apps/web/src/lib/`): `api-client.ts` (fetch server-side com bearer + mapeamento de
   erro), `session.ts` (cookie httpOnly get/set/clear via `next/headers`), `require-session.ts`.
   Provider de app mínimo no `layout.tsx`. Testes primeiro (vitest + fetch mock).
3. **server actions** (`apps/web/src/app/`): `login/actions.ts` (dev IdP → `POST /sessao` → cookie),
   `actions.ts` (`logoutAction`), `veiculos/actions.ts` (`create/update/deleteVehicleAction`,
   revalidam a lista e re-parseiam o contrato no servidor). Sem proxies `/api/*` — server
   components/actions falam direto com a API server-side.
4. **telas** (`apps/web/src/app/`): `login/page.tsx`; `veiculos/page.tsx` (lista, server component);
   `veiculos/novo/page.tsx` e `veiculos/[id]/editar/page.tsx` (form RHF+Zod client via server
   action); `veiculos/[id]/page.tsx` (detalhe). Layout/nav (`veiculos/layout.tsx`) + botão logout.
5. **validar**: `pnpm turbo run lint typecheck test build --affected`; rodar o app e percorrer o
   fluxo; revisão de segurança (toca sessão/token → `revisar-tenant`).

## Riscos e decisões
- **Segurança (sessão no browser)**: token só em cookie httpOnly, BFF injeta o bearer no servidor →
  revisão `revisar-tenant` obrigatória. O tenant continua vindo da claim assinada validada pela API
  (o web nunca decide tenant). Ver [[auth-cognito-decision]].
- **Next.js "não é o que você conhece"** (`apps/web/AGENTS.md`): consultar `node_modules/next/dist/docs/`
  antes de escrever código Next (route handlers, server actions, cookies em App Router).
- **Decisão — server components + actions em vez de TanStack Query/Table agora**: menos JS no
  cliente e menos plumbing para uma UI que será refeita no DS (ADR 0013). TanStack Query/Table
  entram quando as telas migrarem para shadcn. RHF+Zod já entram (pareiam com os contratos e com o
  form do DS). Deriva consciente do stack (`specs/arquitetura/stack.md`), justificada pelo ADR 0013.
- **Decisão — login de dev, não Cognito**: o fluxo Cognito real é incerto e pós-MVP; o dev-login
  isola a troca num único route handler. Sem novo ADR (cabe em ADR 0010).
- **Risco — sem E2E de navegador**: a UI é verificada rodando o app; Playwright fica como fatia
  futura (candidato a item no backlog / F10 homologação). Registrado como gap consciente.
- **Porta**: API e web usam 3000 por padrão; `API_BASE_URL` + porta distinta do `next dev` no
  desenvolvimento evitam conflito.
