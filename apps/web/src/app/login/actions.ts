"use server";

import { redirect } from "next/navigation";
import { fetchDevIdpToken, startSession } from "@/lib/auth-dev";
import { getDevIdpSub } from "@/lib/config";
import { setSessionToken } from "@/lib/session";

/**
 * Dev login: exchanges a fake-IdP token + chosen tenant for the API session
 * token and stores it in the httpOnly cookie. Progressive form action (no client
 * JS). Replaced by a real Cognito flow post-MVP.
 */
export async function loginAction(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const sub = String(formData.get("sub") || getDevIdpSub());
  if (!tenantId) redirect("/login");

  const idpToken = await fetchDevIdpToken(sub);
  const session = await startSession(idpToken, tenantId);
  await setSessionToken(session.token);
  redirect("/veiculos");
}
