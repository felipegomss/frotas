export type TenantStatus = "provisioning" | "active" | "failed";

/** Control-plane view of a tenant, as the domain sees it (no Prisma types). */
export interface TenantRecord {
  id: string;
  slug: string;
  schemaName: string;
  name: string;
  status: TenantStatus;
}

/**
 * PORT: control-plane tenant registry. The Prisma adapter (typed, admin schema)
 * implements it; rows are mapped to TenantRecord before crossing the boundary.
 */
export interface TenantDirectory {
  findBySlug(slug: string): Promise<TenantRecord | null>;
  /** Registers the tenant with status `provisioning`. */
  createProvisioning(input: {
    slug: string;
    schemaName: string;
    name: string;
  }): Promise<TenantRecord>;
  markActive(tenantId: string): Promise<void>;
  markFailed(tenantId: string): Promise<void>;
}
