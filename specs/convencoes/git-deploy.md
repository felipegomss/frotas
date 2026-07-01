# Convenção de git e deploy

- Monorepo, um repo, trunk-based. main sempre implantável.
- Feature em branch curta -> PR -> CI roda lint/typecheck/test/build por afetação (Turborepo).
- Merge na main faz deploy no homolog automático. Produção sai por tag/release atrás de um
  GitHub Environment protegido com revisor obrigatório (trilha de aprovação para auditoria).
- Mudança de contrato que toca contracts+api+web entra num PR atômico só.
- Commits convencionais. Pacotes internos por workspace:* (sem versão por pacote).
- Terraform: plan no PR, apply no merge atrás de aprovação humana.
