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
}
