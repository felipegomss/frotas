import type { MembershipDirectory } from "./membership.directory.js";
import { MembershipNotFoundError } from "./membership.errors.js";
import type { ActiveMembership } from "./membership.js";

/**
 * Validates that an identity may open a session in a tenant and returns the data
 * for the signed session claim (ADR 0010). Depends only on the
 * MembershipDirectory port — no IdP, no Prisma, no HTTP.
 */
export class StartTenantSession {
  constructor(private readonly memberships: MembershipDirectory) {}

  async execute(
    identityId: string,
    tenantId: string,
  ): Promise<ActiveMembership> {
    const membership = await this.memberships.findActive(identityId, tenantId);
    if (!membership) {
      throw new MembershipNotFoundError(identityId, tenantId);
    }
    return membership;
  }
}
