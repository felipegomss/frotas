# Segurança e conformidade

## Regra de ouro do multi-tenant
- O tenant SEMPRE vem da claim assinada do token, validada no servidor. Nunca do cliente.
- Acesso a dado de tenant usa SET LOCAL search_path DENTRO de transação (nunca de sessão),
  porque com pool de conexão um search_path de sessão vaza entre requests de tenants diferentes.

## LGPD
Homologação só com dados sintéticos/mascarados. Retenção, consentimento, direito à exclusão,
e encarregado (DPO). Isolamento por schema facilita exportar/apagar por prefeitura.

## Auditoria inviolável
Tabela audit_log append-only (RLS bloqueia update/delete) com hash encadeado (cada registro
carrega o hash do anterior; adulteração quebra a cadeia). Espelho em S3 Object Lock (WORM).

## Demais controles
2FA no login, RBAC (role no membership + guards), criptografia em repouso (KMS),
backup automático com PITR, TLS em tudo, WAF + rate limit.

## Assinatura
Eletrônica simples (captura + trilha) resolve a ordem de uso. Validade jurídica plena = ICP-Brasil
(BRy/Certisign/gov.br), custo e escopo à parte.
