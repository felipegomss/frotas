"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  fetchDevIdpToken,
  listPrefectures,
  startSession,
} from "@/lib/auth-dev";
import {
  getAppBaseDomain,
  getDevIdpSub,
  getDevTenantSlug,
} from "@/lib/config";
import { isValidDevOtp } from "@/lib/otp";
import { setSessionContext, setSessionToken } from "@/lib/session";
import { tenantSlugFromHost } from "@/lib/tenant-host";

export type LoginError = { ok: false; message: string };

/**
 * Dev login espelhando produção: valida o OTP no servidor (nunca confia no
 * cliente), resolve a prefeitura pelo SUBDOMÍNIO do Host (F02) — o usuário não
 * escolhe tenant — e troca IdP token + tenant pela sessão assinada da API
 * (ADR 0010). O subdomínio apenas seleciona entre as memberships da própria
 * identidade; a autoridade é o token assinado.
 */
export async function loginWithOtpAction(
  sub: string,
  otp: string,
): Promise<LoginError> {
  if (!isValidDevOtp(otp)) {
    return { ok: false, message: "Código inválido. Verifique e tente de novo." };
  }

  const host = (await headers()).get("host") ?? "";
  const slug = tenantSlugFromHost(host, getAppBaseDomain()) ?? getDevTenantSlug();
  if (!slug) {
    return {
      ok: false,
      message:
        "Endereço sem prefeitura. Acesse pelo endereço da sua prefeitura " +
        "(ex.: suaprefeitura.dominio.com.br).",
    };
  }

  try {
    const idpToken = await fetchDevIdpToken(sub || getDevIdpSub());
    const prefectures = await listPrefectures(idpToken);
    const prefecture = prefectures.find((p) => p.slug === slug);
    if (!prefecture) {
      return {
        ok: false,
        message: `Sua identidade não tem acesso à prefeitura "${slug}".`,
      };
    }

    const session = await startSession(idpToken, prefecture.id);
    await setSessionToken(session.token);
    // Display-only (shell header); the signed token remains the authority.
    await setSessionContext({
      tenantName: session.tenant.name,
      role: session.role,
    });
  } catch {
    return {
      ok: false,
      message:
        "Não foi possível concluir o login. Confira se a API e o IdP de " +
        "desenvolvimento estão no ar.",
    };
  }

  redirect("/veiculos");
}
