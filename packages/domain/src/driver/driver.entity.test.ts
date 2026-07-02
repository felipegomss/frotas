import { describe, expect, it } from "vitest";
import { Driver } from "./driver.entity.js";

const validAttrs = {
  name: "  João Silva  ",
  cnhCategory: "D" as const,
  cnhExpiry: "2027-05-31",
  secretariatId: "secretariat-1",
};

describe("Driver", () => {
  it("trims the name and defaults status to active with no authorized vehicles", () => {
    const driver = new Driver("id-1", validAttrs);

    expect(driver.name).toBe("João Silva");
    expect(driver.status).toBe("active");
    expect(driver.authorizedVehicleIds).toEqual([]);
  });

  it("rejects an empty or blank name", () => {
    expect(() => new Driver("id-1", { ...validAttrs, name: "  " })).toThrow();
    expect(() => new Driver("id-1", { ...validAttrs, name: "" })).toThrow();
  });

  it("rejects a CNH category outside the closed union", () => {
    expect(
      () =>
        new Driver("id-1", {
          ...validAttrs,
          cnhCategory: "Z" as unknown as Driver["cnhCategory"],
        }),
    ).toThrow();
  });

  it("rejects a CNH expiry that is not a real YYYY-MM-DD date", () => {
    expect(
      () => new Driver("id-1", { ...validAttrs, cnhExpiry: "2027-13-01" }),
    ).toThrow();
    expect(
      () => new Driver("id-1", { ...validAttrs, cnhExpiry: "2027-02-31" }),
    ).toThrow();
    expect(
      () => new Driver("id-1", { ...validAttrs, cnhExpiry: "31/05/2027" }),
    ).toThrow();
  });

  it("accepts a CNH expiry in the past (alert belongs to the alerts module)", () => {
    const driver = new Driver("id-1", {
      ...validAttrs,
      cnhExpiry: "2000-01-01",
    });

    expect(driver.cnhExpiry).toBe("2000-01-01");
  });

  it("accepts inactive as an administrative status and rejects unknown ones", () => {
    expect(
      new Driver("id-1", { ...validAttrs, status: "inactive" }).status,
    ).toBe("inactive");
    expect(
      () =>
        new Driver("id-1", {
          ...validAttrs,
          status: "banned" as unknown as Driver["status"],
        }),
    ).toThrow();
  });

  it("deduplicates authorized vehicle ids", () => {
    const driver = new Driver("id-1", {
      ...validAttrs,
      authorizedVehicleIds: ["v1", "v2", "v1"],
    });

    expect(driver.authorizedVehicleIds).toEqual(["v1", "v2"]);
  });

  it("updates name, CNH, secretariat, status and replaces the authorized set", () => {
    const driver = new Driver("id-1", {
      ...validAttrs,
      authorizedVehicleIds: ["v1", "v2"],
    });

    driver.update({
      name: "Maria Souza",
      cnhCategory: "AB",
      cnhExpiry: "2030-12-31",
      secretariatId: "secretariat-2",
      status: "inactive",
      authorizedVehicleIds: ["v3"],
    });

    expect(driver).toMatchObject({
      name: "Maria Souza",
      cnhCategory: "AB",
      cnhExpiry: "2030-12-31",
      secretariatId: "secretariat-2",
      status: "inactive",
    });
    expect(driver.authorizedVehicleIds).toEqual(["v3"]);
  });

  it("update rejects an invalid CNH expiry", () => {
    const driver = new Driver("id-1", validAttrs);

    expect(() => driver.update({ cnhExpiry: "not-a-date" })).toThrow();
  });
});
