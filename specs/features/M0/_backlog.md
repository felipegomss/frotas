# Backlog — M0 · MVP

Fatias verticais do M0, ordenadas por dependência e risco (walking skeleton primeiro).
Método: `specs/convencoes/features.md` (fatiamento) e `specs/convencoes/sequenciamento.md` (ordem).
Escopo/DoD do milestone: `specs/produto/milestones.md`.
Cada item vira uma spec própria em `specs/features/M0/` (SDD) com critérios de aceite verificáveis.

## Estado da base ao abrir o M0 (deduzido do repositório)
- ✅ Fase 0 (wiring) e Fase 1 (espinha hexagonal + módulo `vehicle`, o MOLDE) prontas.
- 🟡 Fase 2 (multi-tenant): acesso a dado de tenant por `SET LOCAL search_path` funciona; o
  `tenant-runner` cria o schema por template, mas ainda tem `TODO` (seed + marcar `active`) e
  não há serviço/endpoint de provisionamento.
- ❌ Fase 3 (auth/tenant no token), Fase 4 (bordas transversais), Fase 5 (storage) e
  Fase 6 (CI/homolog) pendentes.
- Como o escopo do M0 inclui "auth com tenant no token", "abastecimento com foto" e o DoD
  "no ar em homologação", as fases 3/5/6 entram como fatias do próprio M0 (abaixo), não como
  bloqueio externo. `TenantContext` por header (`ALLOW_HEADER_TENANT=1`) é débito e sai em F01.

## Backlog ordenado

### M0-F01 — Walking skeleton: login com tenant no token + listar frota isolada
Objetivo: usuário autentica (Cognito/JWT), o tenant ativo vem da claim assinada e `GET /frota`
devolve os veículos daquele tenant — provando auth → membership → isolamento ponta a ponta.
Dependência: base fases 0–2 (prontas); 1 tenant + 1 membership + 1 veículo por seed manual.
Módulo/EF: base (roadmap fase 3/4) + EF 01. Substitui o débito do `TenantContext` por header e
estabelece erro→HTTP + validação nestjs-zod (fase 4) neste primeiro endpoint real.

### M0-F02 — Provisionamento real de uma prefeitura
Objetivo: transformar o `tenant-runner` num fluxo real: cria schema, aplica template, roda seed
base, cria o 1º admin (identity+membership) e marca o tenant como `active`.
Dependência: M0-F01. Módulo/EF: base multi-tenant (fase 2) + console de onboarding (por script,
a tela self-service é pós-M0). Inicia a trilha de auditoria com hash encadeado (fase 4).

### M0-F03 — Cadastro de secretarias
Objetivo: CRUD de secretarias (unidade organizacional) do tenant, base para vincular veículos e
motoristas.
Dependência: M0-F01. Módulo/EF: EF 01.

### M0-F04 — Cadastro de veículos (completo) + tela web
Objetivo: criar/editar veículo com placa, modelo, ano, tipo, secretaria, quilometragem e status
inicial; listar e ver na web. Estende o módulo `vehicle` (hoje só list/save mínimos).
Dependência: M0-F03. Módulo/EF: EF 01.

### M0-F05 — Cadastro de motoristas + tela web
Objetivo: cadastrar motorista (nome, CNH categoria/validade, secretaria, veículos autorizados) e
gerenciar na web.
Dependência: M0-F03 (secretaria) e M0-F04 (veículos autorizados). Módulo/EF: EF 05.

### M0-F06 — Ordem de uso: ciclo completo
Objetivo: solicitar → aprovar → saída (km inicial) → retorno (km final), com o status do veículo
alternando `available`↔`in_use` e assinatura simples na ordem.
Dependência: M0-F04, M0-F05. Módulo/EF: EF 02 (agenda/conflito fica no M1).

### M0-F07 — Abastecimento com foto
Objetivo: registrar abastecimento (litros, valor, km, foto da bomba/painel e cupom) com upload
direto ao bucket por URL assinada.
Dependência: M0-F04, M0-F05 + storage (base fase 5, entregue nesta fatia). Módulo/EF: EF 03/EF 08.

### M0-F08 — Dashboard básico do gestor
Objetivo: painel web com KPIs essenciais (frota por status, ordens em aberto, abastecimentos
recentes).
Dependência: M0-F04, M0-F06, M0-F07 (consome o dado que elas produzem). Módulo/EF: EF 07.

### M0-F09 — App do motorista (Expo)
Objetivo: login com token em armazenamento seguro (tenant vem do convite), check-in/check-out,
abastecimento com foto e ocorrência rápida.
Dependência: M0-F06, M0-F07. Módulo/EF: EF 08.

### M0-F10 — Homologação: deploy por afetação + ciclo completo no ar
Objetivo: CI de deploy por afetação e ambiente de homologação; motorista faz o ciclo completo e o
gestor vê no painel, com dado isolado por schema — fechando o DoD do M0.
Dependência: todas as anteriores. Módulo/EF: base (roadmap fase 6).

## Notas de sequenciamento
- Walking skeleton = M0-F01: caminho mais fino que prova auth + tenant + leitura isolada.
- Produtor antes de consumidor: F08 (dashboard) e F09 (app) vêm depois das fatias que geram o dado.
- Bordas transversais (fase 4) não viram fatia horizontal isolada: erro→HTTP/validação nascem em
  F01; auditoria com hash encadeado começa em F02 e cobre as escritas seguintes.
- Riscos concentrados cedo: auth/tenant-no-token (F01) e storage (F07) são os itens mais incertos.
