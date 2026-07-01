import { chainEntry } from "../audit/audit-chain.js";
import type {
  AdminIdentityDirectory,
  NewAdminIdentity,
} from "./admin-identity.directory.js";
import { TenantAlreadyActiveError } from "./provisioning.errors.js";
import { parseTenantSlug } from "./tenant-slug.js";
import type { TenantDirectory, TenantRecord } from "./tenant.directory.js";
import type { TenantSchemaProvisioner } from "./tenant-schema.provisioner.js";

export interface ProvisionTenantInput {
  slug: string;
  name: string;
  admin: NewAdminIdentity;
}

export interface ProvisionTenantResult {
  tenantId: string;
  schemaName: string;
  adminIdentityId: string;
}

/**
 * Real onboarding of a prefecture (M0-F02): registers the tenant, provisions
 * its schema atomically (template + admin local user + genesis audit record),
 * binds the first admin and marks the tenant active. A failure after the
 * tenant is registered marks it `failed`; re-running the same slug retries
 * from scratch (the provisioner drops leftovers). Depends only on ports.
 *
 * Assumes a SINGLE operator per slug (the M0 ops CLI): there is no lock, so
 * two concurrent runs of the same slug can race on the find/create check and
 * on the leftover drop. The self-service flow (post-M0) must add a per-slug
 * advisory lock. A retry reuses the existing tenant record, so `input.name`
 * is only honored on first registration.
 */
export class ProvisionTenant {
  constructor(
    private readonly tenants: TenantDirectory,
    private readonly admins: AdminIdentityDirectory,
    private readonly provisioner: TenantSchemaProvisioner,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ProvisionTenantInput): Promise<ProvisionTenantResult> {
    const slug = parseTenantSlug(input.slug);

    const existing = await this.tenants.findBySlug(slug.value);
    if (existing?.status === "active") {
      throw new TenantAlreadyActiveError(slug.value);
    }
    const tenant: TenantRecord =
      existing ??
      (await this.tenants.createProvisioning({
        slug: slug.value,
        schemaName: slug.schemaName,
        name: input.name,
      }));

    try {
      const admin = await this.admins.findOrCreateByCpf(input.admin);
      const genesis = chainEntry(null, {
        actorId: admin.id,
        action: "tenant.provisioned",
        entity: "tenant",
        entityId: tenant.id,
        createdAt: this.now().toISOString(),
      });
      await this.provisioner.provision({
        schemaName: tenant.schemaName,
        adminIdentityId: admin.id,
        genesis,
      });
      await this.admins.ensureAdminMembership(admin.id, tenant.id);
      await this.tenants.markActive(tenant.id);
      return {
        tenantId: tenant.id,
        schemaName: tenant.schemaName,
        adminIdentityId: admin.id,
      };
    } catch (error) {
      // Never let a bookkeeping failure mask the real cause of the outage.
      await this.tenants.markFailed(tenant.id).catch(() => undefined);
      throw error;
    }
  }
}
