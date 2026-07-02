// Dev-only credentials for the fake login. Mirrors the prod flow (e-mail + senha
// + 2FA) so the UX can be exercised end to end, but the values are fixed until
// the real Cognito flow lands (ADR 0010). Shown on screen on purpose — these are
// dev-only and carry no security meaning. Validation runs on the server.
export const DEV_EMAIL = "gestor@demo.gov.br";
export const DEV_PASSWORD = "frota123";

export function isValidDevCredentials(
  email: string,
  password: string,
): boolean {
  return email.trim().toLowerCase() === DEV_EMAIL && password === DEV_PASSWORD;
}
