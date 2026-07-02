import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let token: string | null = null;
vi.mock("./session", () => ({
  getSessionToken: () => Promise.resolve(token),
}));

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));

import { requireSession } from "./require-session";

describe("requireSession (AC1)", () => {
  beforeEach(() => {
    token = null;
    redirect.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it("redirects to /login when there is no session token", async () => {
    await expect(requireSession()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the token when a session exists", async () => {
    token = "sess-token";
    await expect(requireSession()).resolves.toBe("sess-token");
    expect(redirect).not.toHaveBeenCalled();
  });
});
