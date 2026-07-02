import { describe, expect, it } from "vitest";
import { Secretariat } from "./secretariat.entity.js";

describe("Secretariat", () => {
  it("trims the name on construction", () => {
    const secretariat = new Secretariat("id-1", "  Saúde  ");

    expect(secretariat.name).toBe("Saúde");
  });

  it("rejects an empty or blank name on construction", () => {
    expect(() => new Secretariat("id-1", "")).toThrow();
    expect(() => new Secretariat("id-1", "   ")).toThrow();
  });

  it("renames, trimming the new name", () => {
    const secretariat = new Secretariat("id-1", "Saúde");

    secretariat.rename("  Educação  ");

    expect(secretariat.name).toBe("Educação");
  });

  it("rejects renaming to an empty or blank name", () => {
    const secretariat = new Secretariat("id-1", "Saúde");

    expect(() => secretariat.rename("")).toThrow();
    expect(() => secretariat.rename("   ")).toThrow();
  });
});
