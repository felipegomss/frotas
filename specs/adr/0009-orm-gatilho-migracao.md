# ADR 0009 - ORM: Prisma agora, gatilho de migração
Aceito. Prisma no control-plane e (via SQL cru) no dado de tenant, atrás de portas (hexagonal).
Na escala atual (dezenas a baixas centenas de prefeituras) Prisma serve. Gatilho para avaliar
Kysely/MikroORM: nº de prefeituras crescer a ponto de conexão-por-tenant pesar. Troca só no adaptador.
