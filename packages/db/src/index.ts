import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client.js";

// Public surface of the control-plane client: PrismaClient, Prisma namespace,
// enums and model types are all re-exported from the generated barrel.
export * from "./generated/client/client.js";
export { applyTenantTemplate, provisionTenant } from "./tenant-runner.js";
export {
  seedDemoData,
  type SeedDemoOptions,
  type SeededDemo,
} from "./seed-demo.js";

/**
 * Builds a control-plane PrismaClient wired to the Postgres driver adapter.
 * Prisma 7 is Rust-free, so an adapter (PrismaPg) is mandatory — the connection
 * string is passed here, never through schema.prisma.
 */
export function createPrismaClient(
  connectionString: string | undefined = process.env.DATABASE_URL,
): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // The pg driver adapter does not honor the `?schema=` search param, so the
  // control-plane schema (admin) must be passed to the adapter explicitly,
  // otherwise queries resolve against the default search_path.
  const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg(
    { connectionString },
    schema ? { schema } : undefined,
  );
  return new PrismaClient({ adapter });
}
