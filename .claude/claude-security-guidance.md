# Threat model do projeto (estende o plugin security-guidance)

Sistema multi-tenant de setor público. Além das classes comuns (injeção, XSS, SSRF,
segredos, IDOR, path traversal), trate como P0 as invariantes abaixo:

- Vazamento entre tenants: qualquer caminho onde dado de uma prefeitura possa ser lido/gravado
  no contexto de outra. O tenant vem só da claim assinada do token, validada no servidor.
- search_path de sessão (não transacional) com pool de conexão: vaza tenant. Exija SET LOCAL
  em transação.
- Nome de schema interpolado de input do usuário em $queryRawUnsafe: SQL injection. Exija slug
  validado por regex e resolvido pelo registro de tenants.
- Segredos no repo, PII em log, upload sem escopo de tenant na key/URL assinada.
Reporte por severidade e proponha a correção mínima. Referência: specs/arquitetura/seguranca.md.
