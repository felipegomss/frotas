import { createPrismaClient } from "./index.js";
import { provisionTenant } from "./tenant-runner.js";

// Prisma 7 does not auto-load .env.
try {
  process.loadEnvFile();
} catch {
  // env already provided by the shell — ignore.
}

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  try {
    // Idempotent: rebuild the demo tenant from scratch so re-running is safe.
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "tenant_demo" CASCADE`);

    const schema = await provisionTenant(prisma, "demo");

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      await tx.$executeRawUnsafe(
        `INSERT INTO vehicles (plate, model, status, current_mileage) VALUES
           ('ABC1D23', 'Fiat Strada', 'available', 15000),
           ('EFG4H56', 'VW Saveiro', 'available', 42000)`,
      );
    });

    console.log(`Seed ok: tenant "${schema}" provisioned with 2 vehicles.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
