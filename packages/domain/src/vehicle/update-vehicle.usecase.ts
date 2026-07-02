import { Vehicle, type VehicleUpdateAttributes } from "./vehicle.entity.js";
import { DuplicatePlateError, VehicleNotFoundError } from "./vehicle.errors.js";
import type { VehicleRepository } from "./vehicle.repository.js";

export class UpdateVehicle {
  constructor(private readonly vehicles: VehicleRepository) {}

  async execute(
    id: string,
    attrs: Partial<VehicleUpdateAttributes>,
  ): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new VehicleNotFoundError(id);

    if (attrs.plate !== undefined) {
      const plate = Vehicle.normalizePlate(attrs.plate);
      const existing = await this.vehicles.findByPlate(plate);
      if (existing && existing.id !== id) {
        throw new DuplicatePlateError(plate);
      }
    }

    vehicle.update(attrs);
    await this.vehicles.save(vehicle);
    return vehicle;
  }
}
