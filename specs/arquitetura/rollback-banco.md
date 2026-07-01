# Rollback de banco (multi-tenant: N schemas)

## Por que aqui é diferente
Uma migration não roda em "um banco", roda em um schema `admin` mais um schema por prefeitura.
Reverter uma migration já aplicada em dezenas de schemas é caro e arriscado (pode falhar em
alguns e não em outros, deixando estado misto). Por isso o projeto NÃO depende de down-migration
como plano principal. O plano principal é nunca precisar reverter: expand/contract.

## Padrão expand/contract (obrigatório para mudança de schema)
Toda mudança de shape de dado que quebraria o código antigo vira DUAS migrations, em dois
deploys separados:
1. EXPAND: migration só aditiva (nova coluna nullable, nova tabela, novo índice). Código antigo
   e código novo funcionam com o schema depois desse passo. Aplique em todos os schemas
   (control-plane + todos os tenants) via o runner multi-schema.
2. Backfill: se necessário, popula o dado novo com um job idempotente (não em migration DDL longa).
3. Deploy do código novo, que passa a usar a coluna/tabela nova. Neste ponto, código antigo
   já não roda mais (deploy substituiu), mas o schema ainda tem a estrutura velha também.
4. CONTRACT: só num deploy seguinte, depois de confirmar estabilidade, remove a coluna/tabela
   antiga em outra migration.
Nunca combine "adicionar X" e "remover Y relacionado" na mesma migration.

## Consequência para rollback
Como o passo EXPAND é aditivo, reverter o CÓDIGO (rollback-codigo.md) nunca quebra porque o
schema ainda tem tudo que o código antigo espera. Rollback de banco de verdade só é necessário
se o EXPAND em si corrompeu dado ou falhou no meio do runner multi-schema.

## Se o EXPAND falhar no meio do runner multi-schema
- O runner é idempotente (rodar de novo não duplica nem quebra). Plano padrão: corrigir a causa
  e RODAR DE NOVO apenas nos schemas que falharam (roll-forward), não reverter os que já pegaram.
- Reverter de fato (DROP do que foi criado) só quando a migration provou corromper dado, e
  precisa rodar em TODOS os schemas que a receberam antes de tentar de novo.

## Backup como rede de segurança final
RDS com backup automático + PITR (specs/arquitetura/infra.md) é o último recurso para
corrupção de dado real, não para "desfazer feature". Restaurar PITR é operação rara e cara
(indisponibilidade), use só quando expand/contract e roll-forward não resolvem.
