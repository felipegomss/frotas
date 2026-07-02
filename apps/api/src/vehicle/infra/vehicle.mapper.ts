import { Vehicle, type VehicleStatus, type VehicleType } from '@frotas/domain';

/** Raw row shape returned by the tenant `vehicles` table (snake_case columns). */
export interface VehicleRow {
  id: string;
  plate: string;
  model: string;
  year: number;
  type: string;
  secretariat_id: string;
  status: string;
  current_mileage: number | string;
}

/** Maps a raw tenant row into the domain entity. */
export function toVehicle(row: VehicleRow): Vehicle {
  return new Vehicle(row.id, {
    plate: row.plate,
    model: row.model,
    year: row.year,
    type: row.type as VehicleType,
    secretariatId: row.secretariat_id,
    currentMileage: Number(row.current_mileage),
    status: row.status as VehicleStatus,
  });
}
