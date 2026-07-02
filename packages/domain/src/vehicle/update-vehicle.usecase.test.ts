import { describe, expect, it } from "vitest";
import { Vehicle } from "./vehicle.entity.js";
import { DuplicatePlateError, VehicleNotFoundError } from "./vehicle.errors.js";
import { UpdateVehicle } from "./update-vehicle.usecase.js";
import { FakeVehicleRepository } from "./testing/fake-vehicle-repository.js";

const attrs = {
  model: "Fiat Strada",
  year: 2022,
  type: "pickup" as const,
  secretariatId: "secretariat-1",
  currentMileage: 1000,
};

describe("UpdateVehicle", () => {
  it("edits model, year, type, secretariat and status (AC7)", async () => {
    const repository = new FakeVehicleRepository([
      new Vehicle("id-1", { ...attrs, plate: "ABC1D23" }),
    ]);
    const useCase = new UpdateVehicle(repository);

    const vehicle = await useCase.execute("id-1", {
      model: "VW Saveiro",
      year: 2023,
      type: "car",
      secretariatId: "secretariat-2",
      status: "inactive",
    });

    expect(vehicle).toMatchObject({
      model: "VW Saveiro",
      year: 2023,
      type: "car",
      secretariatId: "secretariat-2",
      status: "inactive",
    });
    expect((await repository.findById("id-1"))?.model).toBe("VW Saveiro");
  });

  it("allows editing the plate when it does not collide", async () => {
    const repository = new FakeVehicleRepository([
      new Vehicle("id-1", { ...attrs, plate: "ABC1D23" }),
    ]);
    const useCase = new UpdateVehicle(repository);

    const vehicle = await useCase.execute("id-1", { plate: "ZZZ9Z99" });

    expect(vehicle.plate).toBe("ZZZ9Z99");
  });

  it("throws when the id does not exist (AC8)", async () => {
    const useCase = new UpdateVehicle(new FakeVehicleRepository());

    await expect(
      useCase.execute("missing", { model: "VW Saveiro" }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it("rejects a plate used by another vehicle (AC10)", async () => {
    const repository = new FakeVehicleRepository([
      new Vehicle("id-1", { ...attrs, plate: "ABC1D23" }),
      new Vehicle("id-2", { ...attrs, plate: "ZZZ9Z99" }),
    ]);
    const useCase = new UpdateVehicle(repository);

    await expect(
      useCase.execute("id-1", { plate: "ZZZ9Z99" }),
    ).rejects.toBeInstanceOf(DuplicatePlateError);
  });

  it("allows keeping the same plate it already has", async () => {
    const repository = new FakeVehicleRepository([
      new Vehicle("id-1", { ...attrs, plate: "ABC1D23" }),
    ]);
    const useCase = new UpdateVehicle(repository);

    const vehicle = await useCase.execute("id-1", { plate: "ABC1D23" });

    expect(vehicle.plate).toBe("ABC1D23");
  });
});
