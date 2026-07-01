---
name: criar-release
description: Prepara e cria uma tag/release seguindo SemVer. Use quando o usuário pedir para "criar uma release", "tagear", "subir pra produção" ou similar.
---
Método: specs/convencoes/versionamento.md (regra de incremento) e
specs/checklists/release.md (checklist de pré-voo).

Passos:
1. Rode `git fetch --tags` e leia a última tag existente (git describe --tags --abbrev=0).
2. Rode `git log <ultima-tag>..HEAD --oneline` para listar as mudanças desde então.
3. Classifique o incremento (PATCH/MINOR/MAJOR) usando a regra do guideline — preste atenção
   especial a mudanças em packages/contracts.
4. Percorra specs/checklists/release.md item a item. NÃO prossiga se algum item falhar
   (ex.: main não está verde, migration com drift).
5. Proponha o número de versão e um rascunho das release notes (agrupado por tipo de commit).
   Peça confirmação antes de criar a tag (plan mode).
6. Após aprovação: `git tag -a vX.Y.Z -m "<resumo>"` e `git push origin vX.Y.Z`.
7. Informe que isso dispara o Portão 2 (release-checks.yml) e que o deploy final em produção
   exige aprovação manual no Environment 'production'.
Qual é a próxima versão e o que mudou vêm do estado real do repositório (tags, commits),
nunca de um número fixado em arquivo de orientação.
