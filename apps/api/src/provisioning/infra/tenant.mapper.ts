import type { Tenant } from '@frotas/db';
import type { TenantRecord, TenantStatus } from '@frotas/domain';

/** Maps the control-plane row to the domain record (no Prisma type leaks). */
export function toTenantRecord(row: Tenant): TenantRecord {
  return {
    id: row.id,
    slug: row.slug,
    schemaName: row.schemaName,
    name: row.name,
    // A tenant row only ever holds a lifecycle status; the column is a plain
    // text in Postgres, so narrow it at the boundary.
    status: row.status as TenantStatus,
  };
}
