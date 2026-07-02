import { describe, expect, it } from "vitest";
import { Driver } from "./driver.entity.js";
import { DriverNotFoundError } from "./driver.errors.js";
import { GetDriver } from "./get-driver.usecase.js";
import { DeleteDriver } from "./delete-driver.usecase.js";
import { ListDrivers } from "./list-drivers.usecase.js";
import { FakeDriverRepository } from "./testing/fake-driver-repository.js";

const attrs = {
  cnhCategory: "B" as const,
  cnhExpiry: "2027-05-31",
  secretariatId: "secretariat-1",
};

describe("GetDriver / DeleteDriver / ListDrivers", () => {
  it("gets an existing driver and throws for a missing id (AC7)", async () => {
    const repository = new FakeDriverRepository([
      new Driver("id-1", { ...attrs, name: "João Silva" }),
    ]);

    expect((await new GetDriver(repository).execute("id-1")).name).toBe(
      "João Silva",
    );
    await expect(
      new GetDriver(repository).execute("missing"),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });

  it("deletes an existing driver and throws for a missing id (AC7, AC8)", async () => {
    const repository = new FakeDriverRepository([
      new Driver("id-1", { ...attrs, name: "João Silva" }),
    ]);

    await new DeleteDriver(repository).execute("id-1");
    expect(await repository.findById("id-1")).toBeNull();
    await expect(
      new DeleteDriver(repository).execute("id-1"),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });

  it("lists drivers ordered by name (AC3 at the port level)", async () => {
    const repository = new FakeDriverRepository([
      new Driver("id-1", { ...attrs, name: "Zeca" }),
      new Driver("id-2", { ...attrs, name: "Ana" }),
    ]);

    expect(
      (await new ListDrivers(repository).execute()).map((d) => d.name),
    ).toEqual(["Ana", "Zeca"]);
  });
});
