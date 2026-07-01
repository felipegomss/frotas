import { createPrismaClient, provisionTenant } from '@frotas/db';

export interface SeededData {
  identitySub: string;
  identityId: string;
  tenantDemoId: string;
  tenantDemo2Id: string;
}

const SUB = 'idp-sub-e2e';

/**
 * Deterministic control-plane + tenant data for the auth e2e:
 * - one identity (authSub = SUB) with an active membership ONLY in `demo`;
 * - two tenants (`demo`, `demo2`) with distinct vehicles, to prove isolation.
 * Idempotent: drops and rebuilds so re-runs are safe.
 */
export async function seedTestData(): Promise<SeededData> {
  const prisma = createPrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "tenant_demo" CASCADE`,
    );
    await prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "tenant_demo2" CASCADE`,
    );
    await prisma.membership.deleteMany({
      where: { tenant: { slug: { in: ['demo', 'demo2'] } } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { in: ['demo', 'demo2'] } },
    });
    await prisma.identity.deleteMany({ where: { authSub: SUB } });

    const identity = await prisma.identity.create({
      data: {
        cpf: '00000000191',
        email: 'e2e@demo.gov.br',
        name: 'E2E User',
        authSub: SUB,
        status: 'active',
      },
    });
    const tenantDemo = await prisma.tenant.create({
      data: {
        slug: 'demo',
        schemaName: 'tenant_demo',
        name: 'Prefeitura Demo',
        status: 'active',
      },
    });
    const tenantDemo2 = await prisma.tenant.create({
      data: {
        slug: 'demo2',
        schemaName: 'tenant_demo2',
        name: 'Prefeitura Demo 2',
        status: 'active',
      },
    });
    // Membership ONLY in demo — demo2 must be forbidden for this identity.
    await prisma.membership.create({
      data: {
        identityId: identity.id,
        tenantId: tenantDemo.id,
        role: 'manager',
        status: 'active',
      },
    });

    await provisionTenant(prisma, 'demo');
    await provisionTenant(prisma, 'demo2');
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_demo"`);
      await tx.$executeRawUnsafe(
        `INSERT INTO vehicles (plate, model, status, current_mileage)
           VALUES ('ABC1D23', 'Fiat Strada', 'available', 15000)`,
      );
    });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_demo2"`);
      await tx.$executeRawUnsafe(
        `INSERT INTO vehicles (plate, model, status, current_mileage)
           VALUES ('ZZZ9Z99', 'VW Gol', 'available', 9000)`,
      );
    });

    return {
      identitySub: SUB,
      identityId: identity.id,
      tenantDemoId: tenantDemo.id,
      tenantDemo2Id: tenantDemo2.id,
    };
  } finally {
    await prisma.$disconnect();
  }
}
