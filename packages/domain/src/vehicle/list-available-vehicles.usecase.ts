import { Vehicle } from "./vehicle.entity.js";
import { VehicleRepository } from "./vehicle.repository.js";

/**
 * Lists the available vehicles of the current tenant.
 * Depends only on the VehicleRepository port — no ORM, no tenant plumbing.
 */
export class ListAvailableVehicles {
  constructor(private readonly vehicles: VehicleRepository) {}

  execute(): Promise<Vehicle[]> {
    return this.vehicles.listAvailable();
  }
}
