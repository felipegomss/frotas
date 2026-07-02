import { describe, expect, it } from "vitest";
import { Vehicle } from "./vehicle.entity.js";

const validAttrs = {
  plate: "abc1d23",
  model: "Fiat Strada",
  year: 2022,
  type: "pickup" as const,
  secretariatId: "secretariat-1",
  currentMileage: 15000,
};

describe("Vehicle", () => {
  it("normalizes the plate to uppercase", () => {
    const vehicle = new Vehicle("id-1", validAttrs);

    expect(vehicle.plate).toBe("ABC1D23");
  });

  it("defaults status to available", () => {
    const vehicle = new Vehicle("id-1", validAttrs);

    expect(vehicle.status).toBe("available");
  });

  it("accepts a Mercosul-format plate", () => {
    const vehicle = new Vehicle("id-1", { ...validAttrs, plate: "abc9e45" });

    expect(vehicle.plate).toBe("ABC9E45");
  });

  it("rejects a plate that matches neither format", () => {
    expect(
      () => new Vehicle("id-1", { ...validAttrs, plate: "AB1234" }),
    ).toThrow();
    expect(() => new Vehicle("id-1", { ...validAttrs, plate: "" })).toThrow();
  });

  it("rejects a year outside 1900..2100", () => {
    expect(() => new Vehicle("id-1", { ...validAttrs, year: 1899 })).toThrow();
    expect(() => new Vehicle("id-1", { ...validAttrs, year: 2101 })).toThrow();
  });

  it("rejects a type outside the closed union", () => {
    expect(
      () =>
        new Vehicle("id-1", {
          ...validAttrs,
          type: "spaceship" as unknown as Vehicle["type"],
        }),
    ).toThrow();
  });

  it("rejects a negative mileage", () => {
    expect(
      () => new Vehicle("id-1", { ...validAttrs, currentMileage: -1 }),
    ).toThrow();
  });

  it("accepts inactive as an administrative status", () => {
    const vehicle = new Vehicle("id-1", { ...validAttrs, status: "inactive" });

    expect(vehicle.status).toBe("inactive");
  });

  it("accepts an operational status set by other modules (e.g. in_use)", () => {
    const vehicle = new Vehicle("id-1", { ...validAttrs, status: "in_use" });

    expect(vehicle.status).toBe("in_use");
  });

  it("rejects a status outside the known set", () => {
    expect(
      () =>
        new Vehicle("id-1", {
          ...validAttrs,
          status: "flying" as unknown as Vehicle["status"],
        }),
    ).toThrow();
  });

  it("updates model, year, type, secretariat and status", () => {
    const vehicle = new Vehicle("id-1", validAttrs);

    vehicle.update({
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
  });

  it("update can correct the mileage administratively, decrease included", () => {
    const vehicle = new Vehicle("id-1", validAttrs);

    vehicle.update({ currentMileage: 12000 });

    expect(vehicle.currentMileage).toBe(12000);
  });

  it("update rejects a negative mileage correction", () => {
    const vehicle = new Vehicle("id-1", validAttrs);

    expect(() => vehicle.update({ currentMileage: -1 })).toThrow();
  });

  it("registerMileage grows monotonically", () => {
    const vehicle = new Vehicle("id-1", validAttrs);

    vehicle.registerMileage(15500);

    expect(vehicle.currentMileage).toBe(15500);
    expect(() => vehicle.registerMileage(15000)).toThrow();
  });
});
