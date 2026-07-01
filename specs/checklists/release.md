# Checklist de release (antes de criar a tag)

- [ ] main está verde: todos os checks do Portão 1 passando no último commit.
- [ ] Nenhuma feature incompleta atrás de flag foi ligada por engano.
- [ ] Determinei o próximo número de versão pela regra em specs/convencoes/versionamento.md
      (PATCH / MINOR / MAJOR), a partir da última tag existente.
- [ ] Se tocou packages/contracts: confirmei se é mudança aditiva (MINOR/PATCH) ou
      incompatível (MAJOR / salto de MINOR em pré-produção).
- [ ] Migrations do Prisma aplicadas e testadas (prisma migrate diff limpo).
- [ ] Release notes redigidas: mudanças desde a última tag, agrupadas por tipo de commit.
- [ ] Tag criada como anotada (git tag -a) e enviada (git push origin <tag>).
- [ ] release-checks.yml (Portão 2) disparou e todos os jobs concluíram.
- [ ] Gate final (Environment production) revisado com specs/checklists/revisao.md antes de aprovar.
