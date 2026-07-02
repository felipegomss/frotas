import { redirect } from "next/navigation";
import { getSessionToken } from "./session";

/**
 * Guards tenant pages: returns the session token or redirects to /login when
 * there is none. The tenant itself is decided by the API from the signed token.
 */
export async function requireSession(): Promise<string> {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  return token;
}
