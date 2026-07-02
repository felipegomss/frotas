import { readFileSync } from "node:fs";
import { TENANT_SCHEMA_NAME_PATTERN } from "@frotas/domain";
import type { Prisma, PrismaClient } from "./generated/client/client.js";

/**
 * Low-level primitive: creates the schema and applies the tenant template
 * INSIDE the caller's transaction (search_path stays scoped to it, ADR 0005).
 * `schema` is interpolated into DDL, so it is validated here against the single
 * source of truth in the domain — no caller can smuggle an unsafe identifier.
 */
export async function applyTenantTemplate(
  tx: Prisma.TransactionClient,
  schema: string,
): Promise<void> {
  if (!TENANT_SCHEMA_NAME_PATTERN.test(schema)) {
    throw new Error(`Unsafe tenant schema name: ${schema}`);
  }
  const sql = readFileSync(
    new URL("../prisma/tenant-template.sql", import.meta.url),
    "utf8",
  );
  await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
  await tx.$executeRawUnsafe(sql);
}

/**
 * Bare schema-by-template creation used by fixtures (seed-demo). The REAL
 * onboarding flow (M0-F02) lives in the domain use case `ProvisionTenant`
 * plus the API adapters — it adds control-plane state, the first admin and
 * the genesis audit record on top of this same template primitive.
 */
export async function provisionTenant(prisma: PrismaClient, slug: string) {
  const schema = `tenant_${slug}`;
  await prisma.$transaction(async (tx) => {
    await applyTenantTemplate(tx, schema);
  });
  return schema;
}
