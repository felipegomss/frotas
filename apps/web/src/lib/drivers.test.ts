import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateDriverRequest } from "@frotas/contracts";

// The lib composes requireSession (bearer) + apiFetch (HTTP). Mock both so the
// test asserts the request shaping (route, method, body, bearer) without network.
const apiFetch = vi.fn();
vi.mock("./api-client", () => ({
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));
vi.mock("./require-session", () => ({
  requireSession: () => Promise.resolve("sess-token"),
}));

import {
  createDriver,
  deleteDriver,
  getDriver,
  listDrivers,
  updateDriver,
} from "./drivers";

describe("drivers lib (AC14-AC17)", () => {
  beforeEach(() => apiFetch.mockReset().mockResolvedValue(undefined));
  afterEach(() => vi.restoreAllMocks());

  it("lists drivers via GET /motoristas with the bearer (AC14)", async () => {
    await listDrivers();
    expect(apiFetch).toHaveBeenCalledWith("/motoristas", {
      bearer: "sess-token",
    });
  });

  it("creates via POST /motoristas with the payload (AC15)", async () => {
    const body = {
      name: "João",
      cnhCategory: "D" as const,
      cnhExpiry: "2027-05-31",
      secretariatId: "11111111-1111-4111-8111-111111111111",
      authorizedVehicleIds: [],
    };
    await createDriver(body);
    expect(apiFetch).toHaveBeenCalledWith("/motoristas", {
      method: "POST",
      body,
      bearer: "sess-token",
    });
  });

  it("updates via PUT /motoristas/:id and encodes the id (AC16)", async () => {
    await updateDriver("a b", {
      name: "João",
      cnhCategory: "D",
      cnhExpiry: "2027-05-31",
      secretariatId: "11111111-1111-4111-8111-111111111111",
      authorizedVehicleIds: [],
    });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("/motoristas/a%20b");
    expect(init).toMatchObject({ method: "PUT", bearer: "sess-token" });
  });

  it("gets and deletes via the id-scoped routes (AC17)", async () => {
    await getDriver("x");
    expect(apiFetch).toHaveBeenCalledWith("/motoristas/x", {
      bearer: "sess-token",
    });
    apiFetch.mockClear();
    await deleteDriver("x");
    expect(apiFetch).toHaveBeenCalledWith("/motoristas/x", {
      method: "DELETE",
      bearer: "sess-token",
    });
  });
});

describe("CreateDriverRequest parsing (AC15)", () => {
  const valid = {
    name: "João Silva",
    cnhCategory: "D",
    cnhExpiry: "2027-05-31",
    secretariatId: "11111111-1111-4111-8111-111111111111",
  };

  it("accepts a valid payload and defaults authorizedVehicleIds to []", () => {
    const parsed = CreateDriverRequest.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.authorizedVehicleIds).toEqual([]);
  });

  it("rejects an empty name, bad category and bad expiry", () => {
    expect(
      CreateDriverRequest.safeParse({ ...valid, name: "  " }).success,
    ).toBe(false);
    expect(
      CreateDriverRequest.safeParse({ ...valid, cnhCategory: "Z" }).success,
    ).toBe(false);
    expect(
      CreateDriverRequest.safeParse({ ...valid, cnhExpiry: "31/05/2027" })
        .success,
    ).toBe(false);
  });
});
