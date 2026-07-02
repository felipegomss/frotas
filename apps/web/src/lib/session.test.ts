import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/headers so the cookie helpers can be exercised in node.
const store = new Map<string, { value: string; options?: unknown }>();
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => {
        const entry = store.get(name);
        return entry ? { name, value: entry.value } : undefined;
      },
      set: (name: string, value: string, options?: unknown) =>
        store.set(name, { value, options }),
      delete: (name: string) => store.delete(name),
    }),
}));

import {
  SESSION_COOKIE,
  SESSION_CONTEXT_COOKIE,
  clearSession,
  getSessionContext,
  getSessionToken,
  sessionCookieOptions,
  setSessionContext,
  setSessionToken,
} from "./session";

describe("sessionCookieOptions (AC10)", () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    vi.stubEnv("NODE_ENV", original ?? "test");
  });

  it("is always httpOnly and same-site lax, scoped to /", () => {
    const opts = sessionCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
  });

  it("is secure in production and not secure elsewhere", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionCookieOptions().secure).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(sessionCookieOptions().secure).toBe(false);
  });
});

describe("session cookie read/write/clear (AC2, AC9)", () => {
  beforeEach(() => store.clear());

  it("returns null when no session cookie is set (AC1)", async () => {
    expect(await getSessionToken()).toBeNull();
  });

  it("stores the token httpOnly and reads it back (AC2)", async () => {
    await setSessionToken("sess-token");

    const entry = store.get(SESSION_COOKIE);
    expect(entry?.value).toBe("sess-token");
    expect((entry?.options as { httpOnly?: boolean }).httpOnly).toBe(true);
    expect(await getSessionToken()).toBe("sess-token");
  });

  it("clears the session (AC9)", async () => {
    await setSessionToken("sess-token");
    await clearSession();
    expect(await getSessionToken()).toBeNull();
  });
});

describe("session display context (shell do DS)", () => {
  beforeEach(() => store.clear());

  it("returns null when no context cookie is set", async () => {
    expect(await getSessionContext()).toBeNull();
  });

  it("stores tenant name and role httpOnly and reads them back", async () => {
    await setSessionContext({ tenantName: "Prefeitura Demo", role: "manager" });

    const entry = store.get(SESSION_CONTEXT_COOKIE);
    expect((entry?.options as { httpOnly?: boolean }).httpOnly).toBe(true);
    expect(await getSessionContext()).toEqual({
      tenantName: "Prefeitura Demo",
      role: "manager",
    });
  });

  it("returns null for a malformed or incomplete cookie", async () => {
    store.set(SESSION_CONTEXT_COOKIE, { value: "not-json" });
    expect(await getSessionContext()).toBeNull();

    store.set(SESSION_CONTEXT_COOKIE, { value: JSON.stringify({ role: 1 }) });
    expect(await getSessionContext()).toBeNull();
  });

  it("clearSession also clears the display context", async () => {
    await setSessionToken("sess-token");
    await setSessionContext({ tenantName: "Prefeitura Demo", role: "manager" });
    await clearSession();
    expect(await getSessionContext()).toBeNull();
  });
});
