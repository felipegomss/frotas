import type { PrismaClient } from "./generated/client/client.js";
import { provisionTenant } from "./tenant-runner.js";

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
 * an active membership ONLY in "demo", plus two tenants with distinct vehicles
 * to prove isolation. `authSub`/`cpf`/`email` are parameterized because dev and
 * tests must use different identities.
 */
export async function seedDemoData(
  prisma: PrismaClient,
  opts: SeedDemoOptions,
): Promise<SeededDemo> {
  // Idempotent: drop tenant schemas and control-plane rows before recreating.
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "tenant_demo" CASCADE`);
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "tenant_demo2" CASCADE`);
  await prisma.membership.deleteMany({
    where: { tenant: { slug: { in: ["demo", "demo2"] } } },
  });
  await prisma.tenant.deleteMany({
    where: { slug: { in: ["demo", "demo2"] } },
  });
  await prisma.identity.deleteMany({
    where: {
      OR: [{ authSub: opts.authSub }, { cpf: opts.cpf }, { email: opts.email }],
    },
  });

  // Control plane: one manager with a membership ONLY in "demo".
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
      slug: "demo",
      schemaName: "tenant_demo",
      name: "Prefeitura Demo",
      status: "active",
    },
  });
  const tenantDemo2 = await prisma.tenant.create({
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

  // Tenant schemas + distinct secretariats/vehicles (proves isolation end to end).
  // Secretariats first: vehicles.secretariat_id is a FK into this table.
  await provisionTenant(prisma, "demo");
  await provisionTenant(prisma, "demo2");
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_demo"`);
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
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_demo2"`);
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
