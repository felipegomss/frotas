import { describe, expect, it } from "vitest";
import { verifyChain } from "../audit/audit-chain.js";
import type { AuditRecord } from "../audit/audit-entry.js";
import type {
  AdminIdentity,
  AdminIdentityDirectory,
  NewAdminIdentity,
} from "./admin-identity.directory.js";
import {
  InvalidTenantSlugError,
  ReservedTenantSlugError,
  TenantAlreadyActiveError,
} from "./provisioning.errors.js";
import { ProvisionTenant } from "./provision-tenant.usecase.js";
import type { TenantDirectory, TenantRecord } from "./tenant.directory.js";
import type {
  TenantSchemaProvisioner,
  TenantSchemaProvisionInput,
} from "./tenant-schema.provisioner.js";

// In-memory ports (no framework, no Prisma) that record what happened.
class FakeTenantDirectory implements TenantDirectory {
  created: TenantRecord[] = [];
  statusChanges: Array<{ tenantId: string; status: string }> = [];
  constructor(private readonly existing: TenantRecord[] = []) {}

  findBySlug(slug: string): Promise<TenantRecord | null> {
    return Promise.resolve(this.existing.find((t) => t.slug === slug) ?? null);
  }
  createProvisioning(input: {
    slug: string;
    schemaName: string;
    name: string;
  }): Promise<TenantRecord> {
    const record: TenantRecord = {
      id: `tenant-${this.created.length + 1}`,
      status: "provisioning",
      ...input,
    };
    this.created.push(record);
    return Promise.resolve(record);
  }
  markActive(tenantId: string): Promise<void> {
    this.statusChanges.push({ tenantId, status: "active" });
    return Promise.resolve();
  }
  markFailed(tenantId: string): Promise<void> {
    this.statusChanges.push({ tenantId, status: "failed" });
    return Promise.resolve();
  }
}

class FakeAdminIdentityDirectory implements AdminIdentityDirectory {
  memberships: Array<{ identityId: string; tenantId: string }> = [];
  constructor(private readonly existing: AdminIdentity[] = []) {}

  findOrCreateByCpf(input: NewAdminIdentity): Promise<AdminIdentity> {
    const found = this.existing.find((i) => i.cpf === input.cpf);
    return Promise.resolve(
      found ?? {
        id: "identity-new",
        cpf: input.cpf,
        email: input.email,
        name: input.name,
      },
    );
  }
  ensureAdminMembership(identityId: string, tenantId: string): Promise<void> {
    this.memberships.push({ identityId, tenantId });
    return Promise.resolve();
  }
}

class FakeSchemaProvisioner implements TenantSchemaProvisioner {
  calls: TenantSchemaProvisionInput[] = [];
  constructor(private readonly failWith?: Error) {}

  provision(input: TenantSchemaProvisionInput): Promise<void> {
    if (this.failWith) {
      return Promise.reject(this.failWith);
    }
    this.calls.push(input);
    return Promise.resolve();
  }
}

const NOW = new Date("2026-07-01T12:00:00.000Z");
const input = {
  slug: "lages",
  name: "Prefeitura de Lages",
  admin: { cpf: "12345678901", email: "admin@lages.gov.br", name: "Admin" },
};

const makeUseCase = (deps: {
  tenants?: FakeTenantDirectory;
  admins?: FakeAdminIdentityDirectory;
  provisioner?: FakeSchemaProvisioner;
}) => {
  const tenants = deps.tenants ?? new FakeTenantDirectory();
  const admins = deps.admins ?? new FakeAdminIdentityDirectory();
  const provisioner = deps.provisioner ?? new FakeSchemaProvisioner();
  return {
    tenants,
    admins,
    provisioner,
    useCase: new ProvisionTenant(tenants, admins, provisioner, () => NOW),
  };
};

describe("ProvisionTenant", () => {
  it("provisions schema, admin and marks the tenant active (AC1/AC2)", async () => {
    const { useCase, tenants, admins, provisioner } = makeUseCase({});

    const result = await useCase.execute(input);

    expect(result).toEqual({
      tenantId: "tenant-1",
      schemaName: "tenant_lages",
      adminIdentityId: "identity-new",
    });
    expect(tenants.created).toHaveLength(1);
    expect(tenants.created[0]).toMatchObject({
      slug: "lages",
      schemaName: "tenant_lages",
      name: "Prefeitura de Lages",
      status: "provisioning",
    });
    expect(provisioner.calls).toHaveLength(1);
    expect(provisioner.calls[0]).toMatchObject({
      schemaName: "tenant_lages",
      adminIdentityId: "identity-new",
    });
    expect(admins.memberships).toEqual([
      { identityId: "identity-new", tenantId: "tenant-1" },
    ]);
    expect(tenants.statusChanges).toEqual([
      { tenantId: "tenant-1", status: "active" },
    ]);
  });

  it("chains a genesis audit record for the provisioning (AC3)", async () => {
    const { useCase, provisioner } = makeUseCase({});

    await useCase.execute(input);

    const genesis = provisioner.calls[0]?.genesis as AuditRecord;
    expect(genesis).toMatchObject({
      actorId: "identity-new",
      action: "tenant.provisioned",
      entity: "tenant",
      entityId: "tenant-1",
      createdAt: NOW.toISOString(),
      prevHash: null,
    });
    expect(verifyChain([genesis])).toEqual({ valid: true });
  });

  it("reuses an existing identity found by CPF (AC2)", async () => {
    const existing: AdminIdentity = {
      id: "identity-existing",
      cpf: input.admin.cpf,
      email: "other@mail.gov.br",
      name: "Existing",
    };
    const admins = new FakeAdminIdentityDirectory([existing]);
    const { useCase } = makeUseCase({ admins });

    const result = await useCase.execute(input);

    expect(result.adminIdentityId).toBe("identity-existing");
    expect(admins.memberships).toEqual([
      { identityId: "identity-existing", tenantId: "tenant-1" },
    ]);
  });

  it.each([
    "Lages",
    "la ges",
    'la"ges',
    "la;ges",
    "lagés",
    "1lages",
    "-lages",
    "l",
    "a".repeat(30),
  ])(
    "rejects the invalid slug %j without touching any port (AC4)",
    async (slug) => {
      const { useCase, tenants, provisioner } = makeUseCase({});

      await expect(useCase.execute({ ...input, slug })).rejects.toBeInstanceOf(
        InvalidTenantSlugError,
      );

      expect(tenants.created).toHaveLength(0);
      expect(tenants.statusChanges).toHaveLength(0);
      expect(provisioner.calls).toHaveLength(0);
    },
  );

  it.each(["www", "api", "admin", "status", "well-known", "demo"])(
    "rejects the reserved slug %j without touching any port (AC9)",
    async (slug) => {
      const { useCase, tenants, provisioner } = makeUseCase({});

      await expect(useCase.execute({ ...input, slug })).rejects.toBeInstanceOf(
        ReservedTenantSlugError,
      );

      expect(tenants.created).toHaveLength(0);
      expect(tenants.statusChanges).toHaveLength(0);
      expect(provisioner.calls).toHaveLength(0);
    },
  );

  it("rejects a slug that already belongs to an active tenant (AC5)", async () => {
    const tenants = new FakeTenantDirectory([
      {
        id: "tenant-live",
        slug: "lages",
        schemaName: "tenant_lages",
        name: "Prefeitura de Lages",
        status: "active",
      },
    ]);
    const { useCase, provisioner } = makeUseCase({ tenants });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      TenantAlreadyActiveError,
    );

    expect(tenants.created).toHaveLength(0);
    expect(tenants.statusChanges).toHaveLength(0);
    expect(provisioner.calls).toHaveLength(0);
  });

  it("marks the tenant failed and rethrows when provisioning breaks (AC6)", async () => {
    const boom = new Error("template exploded");
    const provisioner = new FakeSchemaProvisioner(boom);
    const { useCase, tenants } = makeUseCase({ provisioner });

    await expect(useCase.execute(input)).rejects.toBe(boom);

    expect(tenants.statusChanges).toEqual([
      { tenantId: "tenant-1", status: "failed" },
    ]);
  });

  it("retries a failed tenant reusing its record and ends active (AC7)", async () => {
    const failed: TenantRecord = {
      id: "tenant-failed",
      slug: "lages",
      schemaName: "tenant_lages",
      name: "Prefeitura de Lages",
      status: "failed",
    };
    const tenants = new FakeTenantDirectory([failed]);
    const { useCase, provisioner } = makeUseCase({ tenants });

    const result = await useCase.execute(input);

    expect(result.tenantId).toBe("tenant-failed");
    expect(tenants.created).toHaveLength(0);
    expect(provisioner.calls).toHaveLength(1);
    expect(tenants.statusChanges).toEqual([
      { tenantId: "tenant-failed", status: "active" },
    ]);
  });
});
