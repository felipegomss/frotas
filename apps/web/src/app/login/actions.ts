"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  fetchDevIdpToken,
  listPrefectures,
  startSession,
} from "@/lib/auth-dev";
import { getAppBaseDomain, getDevIdpSub, getDevTenantSlug } from "@/lib/config";
import { isValidDevCredentials } from "@/lib/dev-credentials";
import { isValidDevOtp } from "@/lib/otp";
import { setSessionContext, setSessionToken } from "@/lib/session";
import { tenantSlugFromHost } from "@/lib/tenant-host";

export type LoginOk = { ok: true };
export type LoginError = { ok: false; message: string };

/**
 * Etapa 1 (e-mail + senha) — validada NO SERVIDOR, nunca no cliente. Não emite
 * sessão: apenas libera o desafio 2FA, espelhando o Cognito (senha -> MFA).
 * Em dev as credenciais são fixas (@frotas dev-credentials) até o Cognito entrar.
 */
export async function verifyCredentialsAction(
  email: string,
  password: string,
): Promise<LoginOk | LoginError> {
  if (!isValidDevCredentials(email, password)) {
    return { ok: false, message: "E-mail ou senha inválidos." };
  }
  return { ok: true };
}

/**
 * Etapa 2 (2FA) — valida o OTP no servidor, resolve a prefeitura pelo SUBDOMÍNIO
 * (F02) e troca IdP token + tenant pela sessão assinada da API (ADR 0010). O
 * subdomínio só seleciona entre as memberships da identidade; a autoridade é o
 * token assinado. Em prod o Cognito garante que a senha já foi verificada antes
 * do MFA; aqui a etapa 1 é o gate equivalente.
 */
export async function loginWithOtpAction(otp: string): Promise<LoginError> {
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
    const idpToken = await fetchDevIdpToken(getDevIdpSub());
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
