# ADR 0005 - Dado de tenant via SQL cru + search_path
Aceito. Tabelas de tenant não são models do Prisma (nascem do tenant-template.sql).
O adaptador acessa via $queryRaw com SET LOCAL search_path em transação, e mapeia
a linha para a entidade de domínio. Prisma typed fica só no control-plane (admin).
Reversível: trocar o adaptador por Kysely no futuro não toca no domínio.
