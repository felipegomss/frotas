import { createPrismaClient } from "./index.js";
import { provisionTenant } from "./tenant-runner.js";

// Prisma 7 does not auto-load .env.
try {
  process.loadEnvFile();
} catch {
  // env already provided by the shell — ignore.
}

// Dev IdP subject: matches the `sub` of the token issued by the local fake OIDC
// issuer. In prod this is the Cognito `sub` stored on Identity.authSub.
const DEV_SUB = "dev-sub-gestor";

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  try {
    // Idempotent: rebuild control-plane rows and tenant schemas from scratch.
    await prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "tenant_demo" CASCADE`,
    );
    await prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "tenant_demo2" CASCADE`,
    );
    await prisma.membership.deleteMany({
      where: { tenant: { slug: { in: ["demo", "demo2"] } } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { in: ["demo", "demo2"] } },
    });
    await prisma.identity.deleteMany({
      where: {
        OR: [
          { authSub: DEV_SUB },
          { cpf: "11111111111" },
          { email: "gestor@demo.gov.br" },
        ],
      },
    });

    // Control plane: one manager with a membership ONLY in "demo".
    const identity = await prisma.identity.create({
      data: {
        cpf: "11111111111",
        email: "gestor@demo.gov.br",
        name: "Gestor Demo",
        authSub: DEV_SUB,
        status: "active",
      },
    });
    const tenantDemo = await prisma.tenant.create({
      data: {
        slug: "demo",
        schemaName: "tenant_demo",
        name: "Prefeitura Demo",
        status: "active",
      },
    });
    await prisma.tenant.create({
      data: {
        slug: "demo2",
        schemaName: "tenant_demo2",
        name: "Prefeitura Demo 2",
        status: "active",
      },
    });
    await prisma.membership.create({
      data: {
        identityId: identity.id,
        tenantId: tenantDemo.id,
        role: "manager",
        status: "active",
      },
    });

    // Tenant schemas + distinct vehicles (proves isolation end to end).
    await provisionTenant(prisma, "demo");
    await provisionTenant(prisma, "demo2");
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_demo"`);
      await tx.$executeRawUnsafe(
        `INSERT INTO vehicles (plate, model, status, current_mileage) VALUES
           ('ABC1D23', 'Fiat Strada', 'available', 15000),
           ('EFG4H56', 'VW Saveiro', 'available', 42000)`,
      );
    });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_demo2"`);
      await tx.$executeRawUnsafe(
        `INSERT INTO vehicles (plate, model, status, current_mileage) VALUES
           ('ZZZ9Z99', 'VW Gol', 'available', 9000)`,
      );
    });

    console.log(
      'Seed ok: identity "gestor@demo.gov.br" (member of demo), ' +
        "tenants demo + demo2 provisioned with vehicles.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
