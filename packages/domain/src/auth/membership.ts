/**
 * The active tenant binding of an identity, resolved from the control-plane
 * memberships (ADR 0003). This is the data that becomes the signed session
 * claim (ADR 0010) — the tenant is NEVER taken from the client.
 */
export interface ActiveMembership {
  identityId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  /** Postgres schema of the tenant (e.g. `tenant_demo`). Drives search_path. */
  schemaName: string;
  role: string;
}
