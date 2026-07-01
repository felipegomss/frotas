# Rollback de código

## Princípio
Reverter é redeploy de uma versão anterior conhecida-boa, nunca "consertar na frente" sob
pressão. Corrigir para a frente (roll-forward) só depois que o sistema está estável de novo.

## Homolog (deploy automático a cada merge na main)
- Rollback = reverter o PR que causou o problema (git revert) e deixar o merge normal
  redeployar. Rápido porque o pipeline de homolog já é automático.
- Alternativa mais rápida: redeploy manual do último commit bom (App Runner mantém builds
  anteriores por um tempo; ECS/Fargate mantém a task definition anterior).

## Produção (deploy por tag/release, atrás do gate)
- Rollback = apontar o serviço para a IMAGEM/task definition da tag anterior, não é preciso
  reverter código primeiro. Isso é o que torna o rollback de produção rápido (minutos, não um novo PR).
- Toda tag de release corresponde a uma imagem imutável versionada (ECR). Nunca sobrescrever
  a imagem de uma tag já publicada.
- Depois do rollback de emergência, abrir a correção como PR normal (roll-forward), passando
  pelo fluxo padrão (specs/fluxo.md), mesmo que o rollback já tenha resolvido o incidente.

## Regra de ouro
Deploy de código e deploy de banco são desacoplados (ver rollback-banco.md). Rollback de
código NUNCA deve exigir rollback de banco no mesmo movimento — se exigir, a migration não
seguiu expand/contract.
