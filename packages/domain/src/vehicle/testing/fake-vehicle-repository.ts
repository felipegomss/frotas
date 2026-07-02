import type { Vehicle } from "../vehicle.entity.js";
import type { VehicleRepository } from "../vehicle.repository.js";

/** In-memory port implementation for domain tests (no framework, no Prisma). */
export class FakeVehicleRepository implements VehicleRepository {
  constructor(private readonly rows: Vehicle[] = []) {}

  list(): Promise<Vehicle[]> {
    return Promise.resolve(
      [...this.rows].sort((a, b) => a.plate.localeCompare(b.plate)),
    );
  }

  findById(id: string): Promise<Vehicle | null> {
    return Promise.resolve(this.rows.find((v) => v.id === id) ?? null);
  }

  findByPlate(plate: string): Promise<Vehicle | null> {
    return Promise.resolve(this.rows.find((v) => v.plate === plate) ?? null);
  }

  listAvailable(): Promise<Vehicle[]> {
    return Promise.resolve(this.rows.filter((v) => v.status === "available"));
  }

  save(vehicle: Vehicle): Promise<void> {
    const index = this.rows.findIndex((v) => v.id === vehicle.id);
    if (index >= 0) {
      this.rows[index] = vehicle;
    } else {
      this.rows.push(vehicle);
    }
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    const index = this.rows.findIndex((v) => v.id === id);
    if (index >= 0) this.rows.splice(index, 1);
    return Promise.resolve();
  }
}
