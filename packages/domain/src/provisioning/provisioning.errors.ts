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

/** Raised when provisioning targets a slug whose tenant is already active. */
export class TenantAlreadyActiveError extends Error {
  constructor(slug: string) {
    super(`Tenant "${slug}" is already active`);
    this.name = "TenantAlreadyActiveError";
  }
}
