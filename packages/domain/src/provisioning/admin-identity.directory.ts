/** Global identity of the first admin (ADR 0003: one person, one identity). */
export interface AdminIdentity {
  id: string;
  cpf: string;
  email: string;
  name: string;
}

export interface NewAdminIdentity {
  cpf: string;
  email: string;
  name: string;
  /** IdP subject, when already known (dev fake issuer / Cognito later). */
  authSub?: string | null;
}

/**
 * PORT: control-plane identity/membership writes needed by provisioning.
 * CPF is the natural key of an identity (ADR 0003), so provisioning a second
 * tenant for the same person must reuse the existing identity.
 */
export interface AdminIdentityDirectory {
  findOrCreateByCpf(input: NewAdminIdentity): Promise<AdminIdentity>;
  /** Idempotent: an active `admin` membership in the tenant, created if absent. */
  ensureAdminMembership(identityId: string, tenantId: string): Promise<void>;
}
