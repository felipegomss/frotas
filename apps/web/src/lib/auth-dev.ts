import type {
  PrefecturesResponse,
  SessionResponse,
} from "@frotas/contracts";
import { apiFetch } from "./api-client";
import { getDevIdpUrl } from "./config";

// Dev-only login helpers. In production this is replaced by a real Cognito flow
// (roadmap fase 3 web); the swap is isolated to these two functions + the login
// server action. Never used with a real IdP.

/** Mints an IdP token from the local fake OIDC issuer for the given subject. */
export async function fetchDevIdpToken(sub: string): Promise<string> {
  const url = `${getDevIdpUrl()}/token?sub=${encodeURIComponent(sub)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Não foi possível obter o token do IdP de desenvolvimento.");
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

/** Prefectures the identity may act in (an active membership). */
export function listPrefectures(idpToken: string): Promise<PrefecturesResponse> {
  return apiFetch<PrefecturesResponse>("/sessao/prefeituras", {
    bearer: idpToken,
  });
}

/** Exchanges the IdP token + chosen tenant for the API-signed session token. */
export function startSession(
  idpToken: string,
  tenantId: string,
): Promise<SessionResponse> {
  return apiFetch<SessionResponse>("/sessao", {
    method: "POST",
    body: { tenantId },
    bearer: idpToken,
  });
}
