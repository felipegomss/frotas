import { describe, it, expect } from "vitest";
import { Vehicle } from "./vehicle.entity.js";
import { VehicleRepository } from "./vehicle.repository.js";
import { ListAvailableVehicles } from "./list-available-vehicles.usecase.js";

class FakeVehicleRepository implements VehicleRepository {
  constructor(private readonly vehicles: Vehicle[]) {}
  findById(id: string): Promise<Vehicle | null> {
    return Promise.resolve(this.vehicles.find((v) => v.id === id) ?? null);
  }
  listAvailable(): Promise<Vehicle[]> {
    return Promise.resolve(
      this.vehicles.filter((v) => v.status === "available"),
    );
  }
  save(): Promise<void> {
    return Promise.resolve();
  }
}

describe("ListAvailableVehicles", () => {
  it("returns only the available vehicles from the port", async () => {
    const repo = new FakeVehicleRepository([
      new Vehicle("1", "ABC1D23", "available", 1000),
      new Vehicle("2", "EFG4H56", "in_maintenance", 2000),
      new Vehicle("3", "IJK7L89", "available", 3000),
    ]);
    const useCase = new ListAvailableVehicles(repo);

    const result = await useCase.execute();

    expect(result.map((v) => v.id)).toEqual(["1", "3"]);
    expect(result.every((v) => v.status === "available")).toBe(true);
  });

  it("returns an empty list when the tenant has no available vehicles", async () => {
    const useCase = new ListAvailableVehicles(new FakeVehicleRepository([]));
    expect(await useCase.execute()).toEqual([]);
  });
});
