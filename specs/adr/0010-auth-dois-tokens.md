# ADR 0010 - Autenticação: modelo de dois tokens

Status: aceito.

## Contexto e forças
O repo tem 4 clientes de 2 naturezas (API NestJS + web Next + 2 apps Expo) que precisam de um
login único (ver [[auth-cognito-decision]]). A invariante de ouro é multi-tenant: o tenant SEMPRE
vem da claim assinada validada no servidor, NUNCA do cliente (specs/arquitetura/seguranca.md), e
uma pessoa tem N memberships em N prefeituras (ADR 0003). Um IdP OIDC (Cognito) prova *identidade*,
mas não conhece o *tenant ativo* — este é dado do control-plane (memberships), escolhido por request.

## Decisão
Dois tokens:
1. **Token do IdP** (Cognito; emissor OIDC falso local em dev/test) — prova a identidade (`sub`),
   verificado na API com `jose` + JWKS. Não carrega tenant.
2. **Token de sessão assinado pela própria API** — emitido por `POST /sessao` após validar a
   membership ativa da identidade na prefeitura pedida. Carrega o tenant ativo (`schemaName`, `role`).
   Toda rota de dado de tenant exige este token; `TenantContext` deriva o schema só desta claim.

O tenant nasce das memberships (control-plane), é validado no servidor e viaja numa claim que nós
assinamos — satisfazendo a invariante sem confiar no cliente nem no provedor de identidade.

## Alternativas rejeitadas
- **Um só token (IdP) + lookup de membership a cada request:** o tenant ativo não fica "no token"
  assinado; exige seleção/lookup repetido e custom claims no provedor. Acopla o tenant ao Cognito.
- **Tenant por header (`X-Tenant-Schema`):** spoofável; quebra o isolamento. É o débito atual
  (fail-closed atrás de `ALLOW_HEADER_TENANT`, issue #2), removido pela feature M0-F01.
- **Custom claims de tenant no próprio token do Cognito:** amarra a lógica de autorização ao IdP,
  dificulta troca de provedor e a troca de prefeitura ativa sem novo login.

## Reversibilidade e gatilho de reavaliação
Reversível: o token de sessão é emitido e verificado num único módulo da API (`auth/session-token`);
trocar formato, claims ou provedor não toca no domínio nem nos adaptadores de tenant. Gatilho para
reavaliar: necessidade de refresh/revogação em escala, SSO federado com múltiplos IdPs, ou custo de
sessão que justifique sessão server-side em vez de JWT.
