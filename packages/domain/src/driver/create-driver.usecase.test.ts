import { describe, expect, it } from "vitest";
import { CreateDriver } from "./create-driver.usecase.js";
import { FakeIdGenerator } from "../shared/testing/fake-id-generator.js";
import { FakeDriverRepository } from "./testing/fake-driver-repository.js";

const attrs = {
  name: "João Silva",
  cnhCategory: "D" as const,
  cnhExpiry: "2027-05-31",
  secretariatId: "secretariat-1",
};

describe("CreateDriver", () => {
  it("creates a driver with a generated id, defaulting to active (AC1)", async () => {
    const useCase = new CreateDriver(
      new FakeDriverRepository(),
      new FakeIdGenerator(),
    );

    const driver = await useCase.execute(attrs);

    expect(driver).toMatchObject({
      id: "id-1",
      name: "João Silva",
      status: "active",
    });
    expect(driver.authorizedVehicleIds).toEqual([]);
  });

  it("keeps the informed authorized-vehicle set (AC11)", async () => {
    const repository = new FakeDriverRepository();
    const useCase = new CreateDriver(repository, new FakeIdGenerator());

    const driver = await useCase.execute({
      ...attrs,
      authorizedVehicleIds: ["v1", "v2"],
    });

    expect(
      (await repository.findById(driver.id))?.authorizedVehicleIds,
    ).toEqual(["v1", "v2"]);
  });
});
