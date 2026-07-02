# ADR 0014 - Motorista é agregado próprio (drivers), desacoplado de users/identity
Aceito.

Decisão. O motorista é um agregado de domínio próprio (`driver`), persistido na tabela `drivers`
do **schema do tenant** (dado de tenant por SQL cru, ADR 0005; nunca model do Prisma). Veículos
autorizados são um M:N em `driver_authorized_vehicles`. Os FKs `driver_id` de `usage_orders` e
`refuelings` apontam para `drivers(id)`.

Motivo. No MVP o motorista é cadastrado pelo gestor e **não** tem login (o app do motorista é M0-F09).
A `users` exige `identity_id NOT NULL` (pessoa com login, criada no provisionamento para o admin) e
não carrega nome/CNH/secretaria. Um agregado próprio mantém o domínio limpo, espelha `vehicle` 1:1
(molde hexagonal) e mantém a fronteira: identidade/login é control-plane; motorista é dado de tenant.
Alternativas rejeitadas: (a) estender `users` com `identity_id` nullable + campos de CNH — mistura
"pessoa com login" e "motorista sem login", enfraquece a invariante de identidade (ADR 0003);
(b) tratar motorista como `identity`+`membership` — força login para todo motorista, o que o MVP não
tem.

Reversibilidade. Média. O vínculo motorista↔login (quando M0-F09 chegar) entra como `identity_id`
nullable em `drivers`, sem desfazer esta decisão. Gatilho de reavaliação: se todo motorista passar a
exigir conta de login (autenticação obrigatória no app), reavaliar unificar `driver` e o perfil de
`users`/`identity`.
