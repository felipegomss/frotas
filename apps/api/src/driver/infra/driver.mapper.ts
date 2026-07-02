import { Driver, type CnhCategory, type DriverStatus } from '@frotas/domain';

/** Raw row shape returned by the tenant `drivers` table (snake_case columns). */
export interface DriverRow {
  id: string;
  name: string;
  cnh_category: string;
  cnh_expiry: string;
  secretariat_id: string;
  status: string;
  authorized_vehicle_ids: string[];
}

/** Maps a raw tenant row (with its aggregated authorizations) into the entity. */
export function toDriver(row: DriverRow): Driver {
  return new Driver(row.id, {
    name: row.name,
    cnhCategory: row.cnh_category as CnhCategory,
    cnhExpiry: row.cnh_expiry,
    secretariatId: row.secretariat_id,
    status: row.status as DriverStatus,
    authorizedVehicleIds: row.authorized_vehicle_ids,
  });
}
