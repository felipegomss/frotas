import { InvalidTenantSlugError } from "./provisioning.errors.js";

/**
 * Whitelist for tenant slugs: lowercase letter first, then lowercase letters,
 * digits or hyphens, 2-29 chars total. Keeps `tenant_<slug>` a safe Postgres
 * identifier (max 36 of the 63-byte limit) with no quoting surprises.
 */
const TENANT_SLUG_PATTERN = /^[a-z][a-z0-9-]{1,28}$/;

/**
 * The ONLY shape a tenant schema name can have, derived from the slug
 * whitelist above. Every place that interpolates a schema name into SQL
 * (TenantContext, provisioner adapter) must validate against THIS pattern —
 * a single source of truth so the whitelists can never drift.
 */
export const TENANT_SCHEMA_NAME_PATTERN = /^tenant_[a-z][a-z0-9-]{1,28}$/;

export interface TenantSlug {
  value: string;
  /** Postgres schema derived from the slug (e.g. `tenant_lages`). */
  schemaName: string;
}

/** Validates a raw slug and derives the schema name (throws on failure). */
export function parseTenantSlug(raw: string): TenantSlug {
  if (!TENANT_SLUG_PATTERN.test(raw)) {
    throw new InvalidTenantSlugError(raw);
  }
  return { value: raw, schemaName: `tenant_${raw}` };
}
