/**
 * Extracts the tenant slug from the request Host (<slug>.<base-domain> — F02).
 * `<slug>.localhost` is supported for local dev. This only SELECTS the tenant
 * pre-login; the authority is always the API-signed session token (ADR 0010).
 * Infra subdomains (www, api…) simply won't match any membership at login, so
 * no blocklist filtering happens here. Returns null when the host has no
 * tenant subdomain.
 */
export function tenantSlugFromHost(
  host: string,
  baseDomain: string,
): string | null {
  const hostname = host.toLowerCase().split(":")[0] ?? "";
  if (!hostname) return null;

  const base = baseDomain.toLowerCase();
  let prefix: string | null = null;

  if (base && hostname.endsWith(`.${base}`)) {
    prefix = hostname.slice(0, -(base.length + 1));
  } else if (hostname.endsWith(".localhost")) {
    prefix = hostname.slice(0, -".localhost".length);
  }

  if (!prefix || prefix.includes(".")) return null;
  return prefix;
}
