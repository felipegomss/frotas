import { Vehicle } from "./vehicle.entity.js";
import { VehicleNotFoundError } from "./vehicle.errors.js";
import type { VehicleRepository } from "./vehicle.repository.js";

export class GetVehicle {
  constructor(private readonly vehicles: VehicleRepository) {}

  async execute(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new VehicleNotFoundError(id);
    return vehicle;
  }
}
