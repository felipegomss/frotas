import { describe, it, expect } from "vitest";
import { Vehicle } from "./vehicle.entity.js";
import { ListAvailableVehicles } from "./list-available-vehicles.usecase.js";
import { FakeVehicleRepository } from "./testing/fake-vehicle-repository.js";

const attrs = {
  model: "Fiat Strada",
  year: 2022,
  type: "pickup" as const,
  secretariatId: "secretariat-1",
};

describe("ListAvailableVehicles", () => {
  it("returns only the available vehicles from the port", async () => {
    const repo = new FakeVehicleRepository([
      new Vehicle("1", { ...attrs, plate: "ABC1D23", currentMileage: 1000 }),
      new Vehicle("2", {
        ...attrs,
        plate: "EFG4H56",
        currentMileage: 2000,
        status: "inactive",
      }),
      new Vehicle("3", { ...attrs, plate: "IJK7L89", currentMileage: 3000 }),
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
