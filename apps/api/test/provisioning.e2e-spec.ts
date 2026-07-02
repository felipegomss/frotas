import { Test, TestingModule } from '@nestjs/testing';

// Env must be set before the module (and PrismaService) is constructed.
process.env.DATABASE_URL ??=
  'postgresql://frotas:frotas@localhost:5432/frotas?schema=admin';

import {
  chainEntry,
  ProvisionTenant,
  TenantAlreadyActiveError,
  verifyChain,
  type AuditRecord,
} from '@frotas/domain';
import { ProvisioningModule } from '../src/provisioning/provisioning.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RawSqlTenantSchemaProvisioner } from '../src/provisioning/infra/raw-sql-tenant-schema.provisioner';
import { PrismaTenantDirectory } from '../src/provisioning/infra/prisma-tenant.directory';
import { PrismaAdminIdentityDirectory } from '../src/provisioning/infra/prisma-admin-identity.directory';

const SLUG = 'e2eprov';
const SLUG2 = 'e2eprov2';
const CPF = '00000000272';
const input = {
  slug: SLUG,
  name: 'Prefeitura E2E',
  admin: { cpf: CPF, email: 'admin@e2e.gov.br', name: 'Admin E2E' },
};

interface CountRow {
  count: bigint;
}
interface AuditRow {
  actor_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  prev_hash: string | null;
  hash: string;
  created_at: Date;
}

describe('Tenant provisioning (e2e)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let useCase: ProvisionTenant;

  const wipe = async () => {
    for (const schema of [`tenant_${SLUG}`, `tenant_${SLUG2}`]) {
      await prisma.client.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
      );
    }
    await prisma.client.membership.deleteMany({
      where: { tenant: { slug: { in: [SLUG, SLUG2] } } },
    });
    await prisma.client.tenant.deleteMany({
      where: { slug: { in: [SLUG, SLUG2] } },
    });
    await prisma.client.identity.deleteMany({ where: { cpf: CPF } });
  };

  const schemaExists = async (schema: string): Promise<boolean> => {
    const rows = await prisma.client.$queryRaw<CountRow[]>`
      SELECT count(*) AS count FROM information_schema.schemata
       WHERE schema_name = ${schema}`;
    return Number(rows[0]?.count ?? 0) > 0;
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ProvisioningModule],
    }).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    useCase = moduleRef.get(ProvisionTenant);
    await wipe();
  });

  afterAll(async () => {
    await wipe();
    await moduleRef.close();
  });

  it('AC1: provisions the schema from the template and activates the tenant', async () => {
    const result = await useCase.execute(input);

    expect(result.schemaName).toBe(`tenant_${SLUG}`);
    await expect(schemaExists(`tenant_${SLUG}`)).resolves.toBe(true);

    const tables = await prisma.client.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables
       WHERE table_schema = ${`tenant_${SLUG}`} ORDER BY table_name`;
    expect(tables.map((t) => t.table_name)).toEqual(
      expect.arrayContaining(['vehicles', 'users', 'audit_log', 'refuelings']),
    );

    const tenant = await prisma.client.tenant.findUnique({
      where: { slug: SLUG },
    });
    expect(tenant?.status).toBe('active');
  });

  it('AC2: creates the admin identity, membership and local user', async () => {
    const identity = await prisma.client.identity.findUnique({
      where: { cpf: CPF },
    });
    expect(identity).toMatchObject({ email: 'admin@e2e.gov.br' });

    const tenant = await prisma.client.tenant.findUnique({
      where: { slug: SLUG },
    });
    const membership = await prisma.client.membership.findFirst({
      where: { identityId: identity!.id, tenantId: tenant!.id },
    });
    expect(membership).toMatchObject({ role: 'admin', status: 'active' });

    const users = await prisma.client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_${SLUG}"`);
      return tx.$queryRaw<Array<{ identity_id: string; status: string }>>`
        SELECT identity_id, status FROM users`;
    });
    expect(users).toEqual([
      expect.objectContaining({ identity_id: identity!.id, status: 'active' }),
    ]);
  });

  it('AC2: provisioning a second tenant for the same CPF reuses the identity', async () => {
    await useCase.execute({
      ...input,
      slug: SLUG2,
      name: 'Prefeitura E2E 2',
    });

    const identities = await prisma.client.identity.findMany({
      where: { cpf: CPF },
    });
    expect(identities).toHaveLength(1);

    const memberships = await prisma.client.membership.findMany({
      where: { identityId: identities[0].id, role: 'admin' },
    });
    expect(memberships).toHaveLength(2);
  });

  it('AC3: the new schema holds a verifiable genesis audit record', async () => {
    const identity = await prisma.client.identity.findUnique({
      where: { cpf: CPF },
    });
    const rows = await prisma.client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "tenant_${SLUG}"`);
      return tx.$queryRaw<AuditRow[]>`
        SELECT actor_id, action, entity, entity_id, prev_hash, hash, created_at
          FROM audit_log ORDER BY id`;
    });

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row).toMatchObject({
      actor_id: identity!.id,
      action: 'tenant.provisioned',
      entity: 'tenant',
      prev_hash: null,
    });

    const record: AuditRecord = {
      actorId: row.actor_id,
      action: row.action,
      entity: row.entity,
      entityId: row.entity_id,
      createdAt: row.created_at.toISOString(),
      prevHash: row.prev_hash,
      hash: row.hash,
    };
    expect(verifyChain([record])).toEqual({ valid: true });
  });

  it('AC5: refuses to provision a slug that is already active, leaving data intact', async () => {
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      TenantAlreadyActiveError,
    );

    await expect(schemaExists(`tenant_${SLUG}`)).resolves.toBe(true);
    const tenant = await prisma.client.tenant.findUnique({
      where: { slug: SLUG },
    });
    expect(tenant?.status).toBe('active');
  });

  it('AC6: a mid-transaction failure leaves no half-created schema', async () => {
    const provisioner = moduleRef.get(RawSqlTenantSchemaProvisioner);
    const genesis = chainEntry(null, {
      actorId: null,
      action: 'tenant.provisioned',
      entity: 'tenant',
      entityId: null,
      createdAt: new Date().toISOString(),
    });

    // A non-uuid admin id makes the local-user INSERT fail AFTER the schema
    // and template ran — the whole transaction must roll back. Asserting the
    // uuid-cast error proves the failure happened past schema creation, so the
    // absence of the schema below really exercises the rollback.
    await expect(
      provisioner.provision({
        schemaName: 'tenant_e2efail',
        adminIdentityId: 'not-a-uuid',
        genesis,
      }),
    ).rejects.toThrow(/invalid input syntax for type uuid/);

    await expect(schemaExists('tenant_e2efail')).resolves.toBe(false);
  });

  it('AC6/AC7: a failed provisioning marks the tenant failed and can be retried', async () => {
    const tenants = moduleRef.get(PrismaTenantDirectory);
    const admins = moduleRef.get(PrismaAdminIdentityDirectory);
    const failingUseCase = new ProvisionTenant(tenants, admins, {
      provision: () => Promise.reject(new Error('boom')),
    });
    const retryInput = {
      ...input,
      slug: SLUG2,
      name: 'Prefeitura E2E 2',
    };

    // Start from a clean slate for SLUG2, then fail its provisioning.
    await prisma.client.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "tenant_${SLUG2}" CASCADE`,
    );
    await prisma.client.membership.deleteMany({
      where: { tenant: { slug: SLUG2 } },
    });
    await prisma.client.tenant.deleteMany({ where: { slug: SLUG2 } });

    await expect(failingUseCase.execute(retryInput)).rejects.toThrow('boom');
    const failed = await prisma.client.tenant.findUnique({
      where: { slug: SLUG2 },
    });
    expect(failed?.status).toBe('failed');
    await expect(schemaExists(`tenant_${SLUG2}`)).resolves.toBe(false);

    // Retry with the real use case: same slug recovers and ends active.
    const result = await useCase.execute(retryInput);
    expect(result.tenantId).toBe(failed!.id);
    const recovered = await prisma.client.tenant.findUnique({
      where: { slug: SLUG2 },
    });
    expect(recovered?.status).toBe('active');
    await expect(schemaExists(`tenant_${SLUG2}`)).resolves.toBe(true);
  });
});
