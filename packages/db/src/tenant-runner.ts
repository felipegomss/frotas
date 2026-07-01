import { readFileSync } from "node:fs";
import { PrismaClient } from "./generated/client/client.js";
export async function provisionTenant(prisma: PrismaClient, slug: string) {
  const schema = `tenant_${slug}`;
  const sql = readFileSync(new URL("../prisma/tenant-template.sql", import.meta.url), "utf8");
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    await tx.$executeRawUnsafe(sql);
    // TODO: base seed + mark tenant as 'active'
  });
  return schema;
}
