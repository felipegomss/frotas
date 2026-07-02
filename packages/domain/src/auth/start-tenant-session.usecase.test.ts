import { describe, expect, it } from "vitest";
import type { MembershipDirectory } from "./membership.directory.js";
import { MembershipNotFoundError } from "./membership.errors.js";
import type { ActiveMembership } from "./membership.js";
import { StartTenantSession } from "./start-tenant-session.usecase.js";

// In-memory port implementation for the domain test (no framework, no Prisma).
class FakeMembershipDirectory implements MembershipDirectory {
  constructor(private readonly memberships: ActiveMembership[]) {}
  listActive(identityId: string): Promise<ActiveMembership[]> {
    return Promise.resolve(
      this.memberships.filter((m) => m.identityId === identityId),
    );
  }
  findActive(
    identityId: string,
    tenantId: string,
  ): Promise<ActiveMembership | null> {
    return Promise.resolve(
      this.memberships.find(
        (m) => m.identityId === identityId && m.tenantId === tenantId,
      ) ?? null,
    );
  }
}

describe("StartTenantSession", () => {
  const membershipA: ActiveMembership = {
    identityId: "id-1",
    tenantId: "t-a",
    tenantSlug: "prefdemo",
    tenantName: "Prefeitura Demo",
    schemaName: "tenant_prefdemo",
    role: "manager",
  };

  it("returns the session claim for an active membership (AC1)", async () => {
    const useCase = new StartTenantSession(
      new FakeMembershipDirectory([membershipA]),
    );

    const claim = await useCase.execute("id-1", "t-a");

    expect(claim).toEqual(membershipA);
  });

  it("throws when the identity has no active membership in the tenant (AC3)", async () => {
    const useCase = new StartTenantSession(
      new FakeMembershipDirectory([membershipA]),
    );

    await expect(useCase.execute("id-1", "t-other")).rejects.toBeInstanceOf(
      MembershipNotFoundError,
    );
  });
});
