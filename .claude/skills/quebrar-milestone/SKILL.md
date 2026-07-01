---
name: quebrar-milestone
description: Decompõe um milestone em um backlog de features (fatias verticais) ordenado por dependência. Use ao INICIAR um milestone, antes de planejar features individuais.
---
Método: specs/convencoes/sequenciamento.md (ordenação) e specs/convencoes/features.md (fatiamento).
Conteúdo do milestone: specs/produto/milestones.md.
Passos:
1. Leia o milestone alvo em specs/produto/milestones.md (escopo, DoD, dependências) e as EFs referenciadas.
2. Confirme que a base técnica e os milestones dos quais ele depende estão prontos (deduza do
   repositório: specs/features/ existentes, testes passando, commits). Não puxe feature bloqueada.
3. Proponha um backlog de fatias verticais, ordenado por dependência e risco, começando pelo
   walking skeleton. Cada item: objetivo em 1 linha + dependência + módulo/EF.
4. Grave em specs/features/<Mx>/_backlog.md e peça aprovação (plan mode).
Qual milestone é o alvo vem do chat ou do estado do repositório, NUNCA de arquivo de orientação.
