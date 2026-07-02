import { parseTenantSlug } from "@frotas/domain";
import type { PrismaClient } from "./generated/client/client.js";
import { provisionTenant } from "./tenant-runner.js";

// Seed slugs go through the SAME domain validation as real provisioning
// (pattern + reserved blocklist, F02/AC9) so the fixture can never fabricate
// a tenant the ProvisionTenant use case would reject ("demo" is reserved).
export const SEED_TENANT = parseTenantSlug("prefdemo");
export const SEED_TENANT_B = parseTenantSlug("prefdemo2");

/** Identity fields that must differ between the dev seed and the e2e fixture. */
export interface SeedDemoOptions {
  authSub: string;
  cpf: string;
  email: string;
  name?: string;
}

export interface SeededDemo {
  identityId: string;
  identitySub: string;
  tenantDemoId: string;
  tenantDemo2Id: string;
}

/**
 * Idempotent demo data (control plane + tenant schemas), shared by the dev seed
 * and the e2e fixture so the two never drift. Creates one manager identity with
 * an active membership ONLY in the primary seed tenant, plus two tenants with
 * distinct vehicles to prove isolation. `authSub`/`cpf`/`email` are
 * parameterized because dev and tests must use different identities.
 */
export async function seedDemoData(
  prisma: PrismaClient,
  opts: SeedDemoOptions,
): Promise<SeededDemo> {
  // Idempotent: drop tenant schemas and control-plane rows before recreating.
  await prisma.$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${SEED_TENANT.schemaName}" CASCADE`,
  );
  await prisma.$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${SEED_TENANT_B.schemaName}" CASCADE`,
  );
  // Memberships of the seed tenants AND of the identity being recreated —
  // otherwise a leftover membership to an old tenant blocks the identity delete.
  await prisma.membership.deleteMany({
    where: {
      OR: [
        { tenant: { slug: { in: [SEED_TENANT.value, SEED_TENANT_B.value] } } },
        {
          identity: {
            OR: [
              { authSub: opts.authSub },
              { cpf: opts.cpf },
              { email: opts.email },
            ],
          },
        },
      ],
    },
  });
  await prisma.tenant.deleteMany({
    where: { slug: { in: [SEED_TENANT.value, SEED_TENANT_B.value] } },
  });
  await prisma.identity.deleteMany({
    where: {
      OR: [{ authSub: opts.authSub }, { cpf: opts.cpf }, { email: opts.email }],
    },
  });

  // Control plane: one manager with a membership ONLY in the primary tenant.
  const identity = await prisma.identity.create({
    data: {
      cpf: opts.cpf,
      email: opts.email,
      name: opts.name ?? "Gestor Demo",
      authSub: opts.authSub,
      status: "active",
    },
  });
  const tenantDemo = await prisma.tenant.create({
    data: {
      slug: SEED_TENANT.value,
      schemaName: SEED_TENANT.schemaName,
      name: "Prefeitura Demo",
      status: "active",
    },
  });
  const tenantDemo2 = await prisma.tenant.create({
    data: {
      slug: SEED_TENANT_B.value,
      schemaName: SEED_TENANT_B.schemaName,
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

  // Tenant schemas + distinct secretariats/vehicles (proves isolation end to end).
  // Secretariats first: vehicles.secretariat_id is a FK into this table.
  await provisionTenant(prisma, SEED_TENANT.value);
  await provisionTenant(prisma, SEED_TENANT_B.value);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL search_path TO "${SEED_TENANT.schemaName}"`,
    );
    const [secretariat] = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO secretariats (name) VALUES ('Saúde') RETURNING id`;
    const [vehicle] = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO vehicles (plate, model, year, type, secretariat_id, status, current_mileage)
      VALUES
        ('ABC1D23', 'Fiat Strada', 2022, 'pickup', ${secretariat.id}::uuid, 'available', 15000),
        ('EFG4H56', 'VW Saveiro', 2021, 'pickup', ${secretariat.id}::uuid, 'available', 42000)
      RETURNING id`;
    const [driver] = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO drivers (name, cnh_category, cnh_expiry, secretariat_id, status)
      VALUES ('João Silva', 'D', '2027-05-31', ${secretariat.id}::uuid, 'active')
      RETURNING id`;
    await tx.$executeRaw`
      INSERT INTO driver_authorized_vehicles (driver_id, vehicle_id)
      VALUES (${driver.id}::uuid, ${vehicle.id}::uuid)`;
  });
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL search_path TO "${SEED_TENANT_B.schemaName}"`,
    );
    const [secretariat] = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO secretariats (name) VALUES ('Educação') RETURNING id`;
    await tx.$executeRaw`
      INSERT INTO vehicles (plate, model, year, type, secretariat_id, status, current_mileage)
      VALUES ('ZZZ9Z99', 'VW Gol', 2020, 'car', ${secretariat.id}::uuid, 'available', 9000)`;
    await tx.$executeRaw`
      INSERT INTO drivers (name, cnh_category, cnh_expiry, secretariat_id, status)
      VALUES ('Maria Souza', 'B', '2028-09-30', ${secretariat.id}::uuid, 'active')`;
  });

  return {
    identityId: identity.id,
    identitySub: opts.authSub,
    tenantDemoId: tenantDemo.id,
    tenantDemo2Id: tenantDemo2.id,
  };
}
