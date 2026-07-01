import type { AuditRecord } from "../audit/audit-entry.js";

export interface TenantSchemaProvisionInput {
  schemaName: string;
  /** Identity of the first admin, seeded as a local user in the new schema. */
  adminIdentityId: string;
  /** Genesis audit record (`tenant.provisioned`, null prevHash — ADR 0012). */
  genesis: AuditRecord;
}

/**
 * PORT: creates the tenant schema itself. The adapter must be ALL-OR-NOTHING
 * (one transaction): drop any leftover schema, create it, apply the template,
 * seed the admin's local user row and append the genesis audit record. It is
 * only called for tenants that are not active, so dropping leftovers is safe.
 * Audit appends must be serialized per schema (ADR 0012).
 */
export interface TenantSchemaProvisioner {
  provision(input: TenantSchemaProvisionInput): Promise<void>;
}
