import { describe, expect, it } from "vitest";
import { Driver } from "./driver.entity.js";
import { DriverNotFoundError } from "./driver.errors.js";
import { UpdateDriver } from "./update-driver.usecase.js";
import { FakeDriverRepository } from "./testing/fake-driver-repository.js";

const attrs = {
  name: "João Silva",
  cnhCategory: "D" as const,
  cnhExpiry: "2027-05-31",
  secretariatId: "secretariat-1",
};

describe("UpdateDriver", () => {
  it("edits fields and replaces the authorized set (AC6, AC11)", async () => {
    const repository = new FakeDriverRepository([
      new Driver("id-1", { ...attrs, authorizedVehicleIds: ["v1", "v2"] }),
    ]);
    const useCase = new UpdateDriver(repository);

    const driver = await useCase.execute("id-1", {
      name: "Maria Souza",
      cnhCategory: "AB",
      secretariatId: "secretariat-2",
      status: "inactive",
      authorizedVehicleIds: ["v3"],
    });

    expect(driver).toMatchObject({
      name: "Maria Souza",
      cnhCategory: "AB",
      secretariatId: "secretariat-2",
      status: "inactive",
    });
    expect(driver.authorizedVehicleIds).toEqual(["v3"]);
    expect((await repository.findById("id-1"))?.name).toBe("Maria Souza");
  });

  it("throws when the id does not exist (AC7)", async () => {
    const useCase = new UpdateDriver(new FakeDriverRepository());

    await expect(
      useCase.execute("missing", { name: "Maria Souza" }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });
});
