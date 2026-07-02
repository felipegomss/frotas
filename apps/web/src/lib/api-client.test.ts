import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiFetch,
  buildRequestInit,
  messageForStatus,
} from "./api-client";

describe("buildRequestInit", () => {
  it("sends JSON with the bearer when a body and token are given (AC3-AC6)", () => {
    const init = buildRequestInit({
      method: "POST",
      body: { plate: "ABC1D23" },
      bearer: "sess-token",
    });

    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      authorization: "Bearer sess-token",
    });
    expect(init.body).toBe(JSON.stringify({ plate: "ABC1D23" }));
  });

  it("omits the body and content-type on a GET without body", () => {
    const init = buildRequestInit({ method: "GET", bearer: "sess-token" });

    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty("content-type");
    expect(init.headers).toMatchObject({ authorization: "Bearer sess-token" });
  });

  it("omits authorization when no bearer is given", () => {
    const init = buildRequestInit({ method: "GET" });

    expect(init.headers).not.toHaveProperty("authorization");
  });
});

describe("messageForStatus (AC8)", () => {
  it("maps known statuses to readable pt-BR messages", () => {
    expect(messageForStatus(400)).toMatch(/inválid/i);
    expect(messageForStatus(401)).toMatch(/sess|autentic/i);
    expect(messageForStatus(404)).toMatch(/não encontrad/i);
    expect(messageForStatus(409)).toMatch(/conflito|já existe/i);
    expect(messageForStatus(500)).toMatch(/erro/i);
  });
});

describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.API_BASE_URL;
  });

  it("returns parsed JSON on a 2xx response (AC3)", async () => {
    process.env.API_BASE_URL = "http://api.local";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: "1", plate: "ABC1D23" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await apiFetch<{ id: string }[]>("/veiculos", {
      bearer: "t",
    });

    expect(data).toEqual([{ id: "1", plate: "ABC1D23" }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.local/veiculos");
    expect((init as RequestInit).method).toBe("GET");
  });

  it("throws an ApiError with the mapped message on a 409 (AC8)", async () => {
    process.env.API_BASE_URL = "http://api.local";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Já existe" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(
      apiFetch("/veiculos", { method: "POST", body: {}, bearer: "t" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("exposes the status on the thrown ApiError", async () => {
    process.env.API_BASE_URL = "http://api.local";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 404 })),
    );

    await expect(apiFetch("/veiculos/x", { bearer: "t" })).rejects.toMatchObject(
      { status: 404 },
    );
  });
});
