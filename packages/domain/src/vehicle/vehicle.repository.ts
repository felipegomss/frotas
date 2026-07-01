import { Vehicle } from "./vehicle.entity.js";
// PORT: the domain depends on this, never on the ORM. The Prisma adapter implements it.
export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  // Lists the available vehicles of the current tenant. The tenant boundary is
  // an infrastructure concern (search_path), not a domain argument.
  listAvailable(): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<void>;
}
