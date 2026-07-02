# ADR 0012 - Auditoria com hash encadeado por schema de tenant

Status: aceito.

## Contexto e forças
specs/arquitetura/seguranca.md exige trilha de auditoria inviolável (append-only, hash encadeado,
espelho WORM depois). O roadmap (fase 4) pede o esqueleto; o backlog manda começar em M0-F02
(provisionamento) e cobrir as escritas seguintes (F03+). Forças: isolamento por schema (ADR 0001),
portabilidade do schema via pg_dump (sem FK cross-schema), domínio sem Prisma (ADR 0002/0005),
LGPD (exportar/apagar por prefeitura leva a trilha junto).

## Decisão
A trilha vive no `audit_log` de CADA schema de tenant (tabela já nasce no template SQL). A cadeia
de hash é POR SCHEMA: `hash = sha256(prev_hash + canônico(entrada))`; o primeiro registro (gênese)
tem `prev_hash` nulo e é criado no provisionamento (`tenant.provisioned`), dentro da mesma
transação que cria o schema. O cálculo e a verificação da cadeia são funções puras do domínio
(`packages/domain/src/audit/`); o append é uma porta, implementada por adapter SQL cru com
`SET LOCAL search_path` (ADR 0005). O contrato da porta exige append serializado por schema
(advisory lock / FOR UPDATE na transação) para evitar corrida no `prev_hash`.

## Alternativas rejeitadas
- **Auditoria centralizada no control-plane (schema admin):** quebra a portabilidade (o dump do
  tenant sai sem a própria trilha), mistura dados de prefeituras numa tabela só e cria hot-spot de
  escrita global; a cadeia única também acopla tenants entre si (o hash de um depende do outro).
- **Log externo (ex.: CloudWatch/arquivo) sem cadeia no banco:** não dá verificabilidade na origem
  nem transação com a escrita auditada; espelho externo continua no plano (S3 Object Lock), mas
  como REFORÇO, não como fonte.

## Reversibilidade e gatilho de reavaliação
Reversível: a cadeia é dado (colunas `prev_hash`/`hash`) + funções puras; trocar armazenamento ou
formato não toca o domínio dos módulos auditados, só o adapter de append. Gatilho para reavaliar:
volume de escrita em que a serialização por schema vire gargalo medível, ou exigência de edital
por armazenamento WORM/HSM dedicado — aí entra o espelho S3 Object Lock e/ou particionamento.
