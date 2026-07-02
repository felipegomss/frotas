"use server";

import { redirect } from "next/navigation";
import type { PrefecturesResponse } from "@frotas/contracts";
import {
  fetchDevIdpToken,
  listPrefectures,
  startSession,
} from "@/lib/auth-dev";
import { getDevIdpSub } from "@/lib/config";
import { isValidDevOtp } from "@/lib/otp";
import { setSessionContext, setSessionToken } from "@/lib/session";

export type VerifyOtpResult =
  | { ok: true; prefectures: PrefecturesResponse }
  | { ok: false; message: string };

/**
 * Dev 2FA: validates the OTP server-side (never trusts the client) and, when
 * valid, lists the prefectures the identity may act in. Mirrors the prod flow
 * (identify -> code -> tenant); the code is fixed until Cognito lands (ADR 0010).
 */
export async function verifyOtpAction(
  sub: string,
  otp: string,
): Promise<VerifyOtpResult> {
  if (!isValidDevOtp(otp)) {
    return { ok: false, message: "Código inválido. Verifique e tente de novo." };
  }
  try {
    const idpToken = await fetchDevIdpToken(sub || getDevIdpSub());
    const prefectures = await listPrefectures(idpToken);
    return { ok: true, prefectures };
  } catch {
    return {
      ok: false,
      message:
        "Não foi possível carregar as prefeituras. Confira se a API e o IdP " +
        "de desenvolvimento estão no ar.",
    };
  }
}

/**
 * Dev login: exchanges a fake-IdP token + chosen tenant for the API session
 * token and stores it in the httpOnly cookie. The OTP travels with the form and
 * is re-validated here — the earlier step is only UX.
 */
export async function loginAction(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const sub = String(formData.get("sub") || getDevIdpSub());
  const otp = String(formData.get("otp") ?? "");
  if (!tenantId || !isValidDevOtp(otp)) redirect("/login");

  const idpToken = await fetchDevIdpToken(sub);
  const session = await startSession(idpToken, tenantId);
  await setSessionToken(session.token);
  // Display-only (shell header); the signed token remains the authority.
  await setSessionContext({
    tenantName: session.tenant.name,
    role: session.role,
  });
  redirect("/veiculos");
}
