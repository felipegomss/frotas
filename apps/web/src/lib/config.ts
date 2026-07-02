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

// Base domain whose subdomains identify the tenant (<slug>.<base> — F02).
export function getAppBaseDomain(): string {
  return process.env.APP_BASE_DOMAIN ?? "";
}

// Dev-only fallback when the host has no tenant subdomain (bare localhost).
// In production the subdomain is mandatory.
export function getDevTenantSlug(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  return process.env.DEV_TENANT_SLUG ?? "demo";
}
