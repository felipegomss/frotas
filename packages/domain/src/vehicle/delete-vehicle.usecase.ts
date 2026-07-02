import { VehicleNotFoundError } from "./vehicle.errors.js";
import type { VehicleRepository } from "./vehicle.repository.js";

export class DeleteVehicle {
  constructor(private readonly vehicles: VehicleRepository) {}

  async execute(id: string): Promise<void> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new VehicleNotFoundError(id);
    await this.vehicles.delete(id);
  }
}
