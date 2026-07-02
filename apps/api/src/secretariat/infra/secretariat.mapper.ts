import { Secretariat } from '@frotas/domain';

/** Raw row shape returned by the tenant `secretariats` table (snake_case columns). */
export interface SecretariatRow {
  id: string;
  name: string;
}

/** Maps a raw tenant row into the domain entity. */
export function toSecretariat(row: SecretariatRow): Secretariat {
  return new Secretariat(row.id, row.name);
}
