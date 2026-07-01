# Multi-tenant

## Modelo: schema por prefeitura + control plane compartilhado
- Schema `admin` (Prisma): identities, tenants, memberships, invites, provisioning_jobs.
- Um schema `tenant_<slug>` por prefeitura, com as tabelas de operação (nascem do template SQL).
- App compartilhada; isolamento estrutural no banco (não por tenant_id + filtro).

## Identidade e vínculos
- Identity global por CPF (uma pessoa, um login).
- memberships: N prefeituras por identidade, cada uma com um role (driver|manager|admin|auditor).
- Usuário local por tenant (tabela users no schema) com identity_id de referência
  (sem FK cross-schema: mantém o schema autossuficiente e portável via pg_dump).
- Motorista pode servir a mais de uma prefeitura (consórcio, municípios vizinhos).

## Roteamento e tenant ativo
- Subdomínio compartilhado: <slug>.dominio.com.br, resolvido por wildcard (DNS + TLS 1x).
- Tenant ativo viaja assinado no token; o backend valida contra os memberships.
- Subdomínio inexistente: 404 limpo, nunca cai num tenant padrão nem toca no banco.
- Seletor de prefeitura só aparece após autenticar e só lista as prefeituras da pessoa.

## Onboarding (self-service)
Form no admin-console -> valida slug -> job de provisionamento (idempotente e transacional):
cria tenant, cria schema + roda template, seed base, prefixo S3 + Cognito, cria admin + convite,
marca ativa. Falha faz rollback e marca "failed". Wildcard cobre o subdomínio na hora.

## Domínio próprio da prefeitura (opcional)
CNAME do órgão -> Cloudflare for SaaS (custom hostname) ou CloudFront+ACM. Não vira on-premise.
On-premise/infra dedicada só se o edital exigir (aí promove o tenant a banco/conta dedicada).

## Migração de schema
Runner multi-schema: aplica migration em todos os schemas de tenant pelo pipeline, não na mão.
