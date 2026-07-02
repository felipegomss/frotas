import { Vehicle } from "./vehicle.entity.js";
import type { VehicleRepository } from "./vehicle.repository.js";

export class ListVehicles {
  constructor(private readonly vehicles: VehicleRepository) {}

  execute(): Promise<Vehicle[]> {
    return this.vehicles.list();
  }
}
