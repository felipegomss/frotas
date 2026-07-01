import type { ActiveMembership } from "./membership.js";

/**
 * PORT: read access to the control-plane memberships. The domain depends on this
 * interface; the Prisma adapter (control-plane, typed) implements it. Returns
 * domain data (ActiveMembership), never Prisma types.
 */
export interface MembershipDirectory {
  /** Active memberships of an identity, for tenant selection. */
  listActive(identityId: string): Promise<ActiveMembership[]>;
  /** The active membership of an identity in a given tenant, or null. */
  findActive(
    identityId: string,
    tenantId: string,
  ): Promise<ActiveMembership | null>;
}
