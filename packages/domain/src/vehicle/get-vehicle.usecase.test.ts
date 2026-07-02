import { describe, expect, it } from "vitest";
import { Vehicle } from "./vehicle.entity.js";
import { VehicleNotFoundError } from "./vehicle.errors.js";
import { GetVehicle } from "./get-vehicle.usecase.js";
import { FakeVehicleRepository } from "./testing/fake-vehicle-repository.js";

describe("GetVehicle", () => {
  it("returns the vehicle by id", async () => {
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
    const useCase = new GetVehicle(repository);

    const vehicle = await useCase.execute("id-1");

    expect(vehicle).toMatchObject({ id: "id-1", plate: "ABC1D23" });
  });

  it("throws when the id does not exist (AC8)", async () => {
    const useCase = new GetVehicle(new FakeVehicleRepository());

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(
      VehicleNotFoundError,
    );
  });
});
