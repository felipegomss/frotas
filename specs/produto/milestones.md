# Milestones (conteúdo editável)

Escopo, critério de pronto (DoD) e dependências concretas de cada milestone deste produto.
Os PRINCÍPIOS de ordenação (atemporais) estão em specs/convencoes/sequenciamento.md.
Detalhe cada milestone só quando for o próximo. Milestone pode ser editado; ao mudar de decisão
de arquitetura, registre um ADR.

## Base técnica (pré-requisito) — ver specs/roadmap.md
Wiring, espinha hexagonal, núcleo multi-tenant, auth, bordas transversais, storage, CI/homolog.

## M0 · MVP  (depende da base técnica)
Escopo: cadastros essenciais (vehicles, drivers, secretariats), ordem de uso, abastecimento com
foto, dashboard básico, app do motorista, auth com tenant no token.
DoD: prefeitura provisionada; motorista faz o ciclo completo pelo app; gestor vê no painel;
dado isolado por schema; testes verdes; no ar em homologação.

## M1 · Gestão operacional  (depende de M0)
Agenda/reserva com detecção de conflito, status completo, motorista completo, responsável pelo
veículo, gestão documental.
DoD: reservar sem conflito de horário; documentos com alerta de vencimento.

## M2 · Manutenção e consertos  (depende de M0)
Manutenção preventiva, consertos (oficina/orçamento/peças), indisponibilidade automática do veículo.
DoD: abrir conserto tira o veículo de "disponível"; histórico por veículo.

## M3 · Combustível e alertas  (depende de M0 + worker/cron)
Análise de consumo e anomalias, alertas automáticos, painel gerencial.
DoD: alertas disparam por cron; anomalias sinalizadas; KPIs no painel.

## M4 · Relatórios e prestação de contas  (depende de M0-M3)
Relatórios PDF/Excel, painel executivo, assinatura.
DoD: relatórios de custo/uso/prestação exportáveis.

## M5 · App do gestor  (depende de M0-M2)
DoD: gestor opera o ciclo de aprovação/reserva pelo celular.

## M6 · Integrações e segurança avançada  (depende do núcleo estável)
Escopo aberto por sistema externo. DoD: por integração contratada.

## Console de onboarding self-service  (depende de M0)
Provisionamento existe por script desde o início; a TELA self-service só depois que uma
prefeitura funciona ponta a ponta em M0. A tela deve exibir a blocklist de slugs reservados
(já exportada do domínio, `RESERVED_TENANT_SLUGS`) para o operador saber o que não pode usar.
