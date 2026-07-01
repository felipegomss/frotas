import type { ActiveMembership } from '@frotas/domain';

/** Prisma membership row joined with its tenant (control-plane, typed). */
export interface MembershipRow {
  identityId: string;
  tenantId: string;
  role: string;
  tenant: {
    slug: string;
    name: string;
    schemaName: string;
  };
}

/** Maps a control-plane membership row to the domain ActiveMembership. */
export function toActiveMembership(row: MembershipRow): ActiveMembership {
  return {
    identityId: row.identityId,
    tenantId: row.tenantId,
    tenantSlug: row.tenant.slug,
    tenantName: row.tenant.name,
    schemaName: row.tenant.schemaName,
    role: row.role,
  };
}
