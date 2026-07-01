import { Vehicle, type VehicleStatus } from '@frotas/domain';

/** Raw row shape returned by the tenant `vehicles` table (snake_case columns). */
export interface VehicleRow {
  id: string;
  plate: string;
  status: string;
  current_mileage: number | string;
}

/** Maps a raw tenant row into the domain entity. */
export function toVehicle(row: VehicleRow): Vehicle {
  return new Vehicle(
    row.id,
    row.plate,
    row.status as VehicleStatus,
    Number(row.current_mileage),
  );
}
