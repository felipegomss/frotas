import { describe, expect, it } from "vitest";
import { Vehicle } from "./vehicle.entity.js";
import { VehicleNotFoundError } from "./vehicle.errors.js";
import { DeleteVehicle } from "./delete-vehicle.usecase.js";
import { FakeVehicleRepository } from "./testing/fake-vehicle-repository.js";

describe("DeleteVehicle", () => {
  it("deletes an existing vehicle (AC9)", async () => {
    const repository = new FakeVehicleRepository([
      new Vehicle("id-1", {
        plate: "ABC1D23",
        model: "Fiat Strada",
        year: 2022,
        type: "pickup",
        secretariatId: "secretariat-1",
        currentMileage: 1000,
      }),
    ]);
    const useCase = new DeleteVehicle(repository);

    await useCase.execute("id-1");

    expect(await repository.findById("id-1")).toBeNull();
  });

  it("throws when the id does not exist (AC8)", async () => {
    const useCase = new DeleteVehicle(new FakeVehicleRepository());

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(
      VehicleNotFoundError,
    );
  });
});
