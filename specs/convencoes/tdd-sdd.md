# Disciplina: SDD + TDD (obrigatória)

## SDD — Spec-Driven Development
- Nada de código sem spec. Uma feature começa por specs/features/<nome>.md (derivada da EF),
  com objetivo, escopo, fora de escopo e CRITÉRIOS DE ACEITE verificáveis (given/when/then).
- Todo endpoint e todo teste traça de volta a um critério de aceite.
- A skill `planejar` cria/atualiza essa spec ANTES de qualquer código.

## TDD — Test-Driven Development
- Ciclo red-green-refactor: escreva o teste que falha a partir de um critério, veja falhar,
  implemente o mínimo pra passar, refatore.
- Caso de uso: teste unitário com repositório fake (vitest) PRIMEIRO.
- Adaptador / multi-tenant: teste e2e com Postgres real (schema de teste).
- PR não passa sem teste cobrindo os critérios de aceite tocados.

## Rastreabilidade
EF (módulo) -> spec da feature (critérios) -> testes -> código. Cada camada aponta pra anterior.
