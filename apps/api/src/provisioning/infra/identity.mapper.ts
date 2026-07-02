import type { Identity } from '@frotas/db';
import type { AdminIdentity } from '@frotas/domain';

/** Maps the control-plane row to the domain identity (no Prisma type leaks). */
export function toAdminIdentity(row: Identity): AdminIdentity {
  return {
    id: row.id,
    cpf: row.cpf,
    email: row.email,
    name: row.name,
  };
}
