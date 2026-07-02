/**
 * Raised when a tenant slug fails validation. The slug becomes the Postgres
 * schema name interpolated into DDL, so this validation is a security boundary
 * — anything outside the whitelist never reaches an adapter.
 */
export class InvalidTenantSlugError extends Error {
  constructor(slug: string) {
    super(
      `Invalid tenant slug ${JSON.stringify(slug)}: expected lowercase letters, ` +
        `digits or hyphens, starting with a letter (2-29 chars)`,
    );
    this.name = "InvalidTenantSlugError";
  }
}

/**
 * Raised when a slug is well-formed but reserved (it would also be an
 * infrastructure/application subdomain — see RESERVED_TENANT_SLUGS). Distinct
 * from InvalidTenantSlugError so the onboarding UI can give a specific message.
 */
export class ReservedTenantSlugError extends Error {
  constructor(slug: string) {
    super(`Tenant slug ${JSON.stringify(slug)} is reserved and cannot be used`);
    this.name = "ReservedTenantSlugError";
  }
}

/** Raised when provisioning targets a slug whose tenant is already active. */
export class TenantAlreadyActiveError extends Error {
  constructor(slug: string) {
    super(`Tenant "${slug}" is already active`);
    this.name = "TenantAlreadyActiveError";
  }
}
