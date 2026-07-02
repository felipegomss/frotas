import type { IdGenerator } from "../shared/id-generator.js";
import { Vehicle, type VehicleAttributes } from "./vehicle.entity.js";
import { DuplicatePlateError } from "./vehicle.errors.js";
import type { VehicleRepository } from "./vehicle.repository.js";

export class CreateVehicle {
  constructor(
    private readonly vehicles: VehicleRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(attrs: VehicleAttributes): Promise<Vehicle> {
    const vehicle = new Vehicle(this.ids.newId(), attrs);
    if (await this.vehicles.findByPlate(vehicle.plate)) {
      throw new DuplicatePlateError(vehicle.plate);
    }
    await this.vehicles.save(vehicle);
    return vehicle;
  }
}
