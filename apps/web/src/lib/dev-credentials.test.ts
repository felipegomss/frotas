import { describe, expect, it } from "vitest";
import { DEV_EMAIL, isValidDevCredentials } from "./dev-credentials";

// Dev-only credentials mirror the prod e-mail+senha step; fixed until Cognito
// (ADR 0010). Validation runs on the server — never trust the client.
describe("isValidDevCredentials", () => {
  it("accepts the seeded dev e-mail with the fixed dev password", () => {
    expect(isValidDevCredentials(DEV_EMAIL, "frota123")).toBe(true);
  });

  it("is case-insensitive and trims the e-mail", () => {
    expect(isValidDevCredentials("  Gestor@Demo.Gov.BR ", "frota123")).toBe(
      true,
    );
  });

  it("rejects a wrong password", () => {
    expect(isValidDevCredentials(DEV_EMAIL, "errada")).toBe(false);
    expect(isValidDevCredentials(DEV_EMAIL, "")).toBe(false);
  });

  it("rejects an unknown e-mail", () => {
    expect(isValidDevCredentials("outro@demo.gov.br", "frota123")).toBe(false);
    expect(isValidDevCredentials("", "frota123")).toBe(false);
  });
});
