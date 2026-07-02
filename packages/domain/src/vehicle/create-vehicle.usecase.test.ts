import { describe, expect, it } from "vitest";
import { DuplicatePlateError } from "./vehicle.errors.js";
import { CreateVehicle } from "./create-vehicle.usecase.js";
import { FakeIdGenerator } from "../shared/testing/fake-id-generator.js";
import { FakeVehicleRepository } from "./testing/fake-vehicle-repository.js";

const attrs = {
  plate: "abc1d23",
  model: "Fiat Strada",
  year: 2022,
  type: "pickup" as const,
  secretariatId: "secretariat-1",
  currentMileage: 15000,
};

describe("CreateVehicle", () => {
  it("creates a vehicle with a generated id, defaulting to available (AC1)", async () => {
    const useCase = new CreateVehicle(
      new FakeVehicleRepository(),
      new FakeIdGenerator(),
    );

    const vehicle = await useCase.execute(attrs);

    expect(vehicle).toMatchObject({
      id: "id-1",
      plate: "ABC1D23",
      status: "available",
    });
  });

  it("rejects a duplicate plate (AC2)", async () => {
    const repository = new FakeVehicleRepository();
    const useCase = new CreateVehicle(repository, new FakeIdGenerator());
    await useCase.execute(attrs);

    await expect(
      useCase.execute({ ...attrs, model: "VW Saveiro" }),
    ).rejects.toBeInstanceOf(DuplicatePlateError);
  });
});
