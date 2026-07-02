import { cookies } from "next/headers";

// The API-signed session token lives ONLY in this httpOnly cookie — never in
// localStorage or a client store, so client JS cannot read it (ADR 0010).
export const SESSION_COOKIE = "frotas_session";

// 8h — matches a work shift; the API token itself is the authority on expiry.
const MAX_AGE_SECONDS = 60 * 60 * 8;

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
}

/** Cookie flags (pure/testable): httpOnly always; secure only in production. */
export function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SESSION_CONTEXT_COOKIE);
}

// Display-only context for the shell (tenant name + role). NOT an authority:
// the API decides the tenant from the signed token; this only fills the UI.
export const SESSION_CONTEXT_COOKIE = "frotas_session_ctx";

export interface SessionContext {
  tenantName: string;
  role: string;
}

export async function setSessionContext(ctx: SessionContext): Promise<void> {
  const store = await cookies();
  store.set(SESSION_CONTEXT_COOKIE, JSON.stringify(ctx), sessionCookieOptions());
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const store = await cookies();
  const raw = store.get(SESSION_CONTEXT_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionContext>;
    if (
      typeof parsed.tenantName !== "string" ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }
    return { tenantName: parsed.tenantName, role: parsed.role };
  } catch {
    return null;
  }
}
