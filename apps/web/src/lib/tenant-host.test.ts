import { describe, expect, it } from "vitest";
import { tenantSlugFromHost } from "./tenant-host";

// The tenant is captured from the subdomain (<slug>.<base-domain>, F02); this
// only SELECTS the tenant pre-login — authority stays with the signed token.
describe("tenantSlugFromHost", () => {
  const base = "frotas.com.br";

  it("extracts the slug from <slug>.<base-domain>", () => {
    expect(tenantSlugFromHost("demo.frotas.com.br", base)).toBe("demo");
    expect(tenantSlugFromHost("santa-rita.frotas.com.br", base)).toBe(
      "santa-rita",
    );
  });

  it("ignores the port", () => {
    expect(tenantSlugFromHost("demo.frotas.com.br:443", base)).toBe(
      "demo",
    );
    expect(tenantSlugFromHost("demo.localhost:3002", base)).toBe("demo");
  });

  it("supports <slug>.localhost for local dev", () => {
    expect(tenantSlugFromHost("demo.localhost", base)).toBe("demo");
  });

  it("returns null for the bare domain or bare localhost", () => {
    expect(tenantSlugFromHost("frotas.com.br", base)).toBeNull();
    expect(tenantSlugFromHost("localhost:3002", base)).toBeNull();
  });

  it("does not blocklist infra subdomains — they just won't match a membership", () => {
    // www/api never resolve to a provisioned tenant, so login fails naturally.
    expect(tenantSlugFromHost("www.frotas.com.br", base)).toBe("www");
  });

  it("returns null for nested or unrelated hosts", () => {
    expect(tenantSlugFromHost("a.b.frotas.com.br", base)).toBeNull();
    expect(tenantSlugFromHost("demo.outrodominio.com", base)).toBeNull();
    expect(tenantSlugFromHost("", base)).toBeNull();
  });

  it("is case-insensitive on the host", () => {
    expect(tenantSlugFromHost("Demo.FrOtAs.com.BR", base)).toBe("demo");
  });
});
