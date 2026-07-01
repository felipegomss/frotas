# Threat model do projeto (estende o plugin security-guidance)

Multi-tenant de setor público. Além das classes comuns (injeção, XSS, SSRF, segredos, IDOR,
path traversal), trate como P0:
- Vazamento entre tenants: qualquer caminho onde dado de uma prefeitura vaze para outra.
  Tenant vem só da claim assinada do token, validada no servidor.
- search_path de sessão (não transacional) com pool: vaza tenant. Exija SET LOCAL em transação.
- Schema interpolado de input em $queryRawUnsafe: SQL injection. Exija slug validado por regex,
  resolvido pelo registro de tenants.
- Segredo no repo, PII em log, upload sem escopo de tenant na key/URL assinada.
Referência: specs/arquitetura/seguranca.md.
