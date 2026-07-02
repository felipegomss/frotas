// Server-only configuration. API_BASE_URL points the web BFF at the NestJS API
// (the two default to :3000, so dev must set distinct ports).

export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:3001";
}

// Local fake OIDC issuer (dev-idp.mjs) used only by the dev login flow.
export function getDevIdpUrl(): string {
  return process.env.DEV_IDP_URL ?? "http://localhost:9999";
}

// Subject minted by the dev IdP for the seeded manager identity.
export function getDevIdpSub(): string {
  return process.env.DEV_IDP_SUB ?? "dev-sub-gestor";
}
