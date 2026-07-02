import { describe, expect, it } from "vitest";
import { Vehicle } from "./vehicle.entity.js";
import { ListVehicles } from "./list-vehicles.usecase.js";
import { FakeVehicleRepository } from "./testing/fake-vehicle-repository.js";

const attrs = {
  model: "Fiat Strada",
  year: 2022,
  type: "pickup" as const,
  secretariatId: "secretariat-1",
  currentMileage: 1000,
};

describe("ListVehicles", () => {
  it("returns all vehicles ordered by plate, regardless of status (AC4)", async () => {
    const repository = new FakeVehicleRepository([
      new Vehicle("id-2", { ...attrs, plate: "ZZZ9Z99" }),
      new Vehicle("id-1", { ...attrs, plate: "ABC1D23", status: "inactive" }),
    ]);
    const useCase = new ListVehicles(repository);

    const vehicles = await useCase.execute();

    expect(vehicles.map((v) => v.plate)).toEqual(["ABC1D23", "ZZZ9Z99"]);
  });
});
