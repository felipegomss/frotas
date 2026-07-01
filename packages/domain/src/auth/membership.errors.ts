/**
 * Raised when an identity has no active membership in the requested tenant.
 * The API maps it to HTTP 403 (ADR 0010: no membership → no session token).
 */
export class MembershipNotFoundError extends Error {
  constructor(identityId: string, tenantId: string) {
    super(
      `No active membership for identity ${identityId} in tenant ${tenantId}`,
    );
    this.name = "MembershipNotFoundError";
  }
}
