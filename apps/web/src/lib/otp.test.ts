import { describe, expect, it } from "vitest";
import { DEV_OTP_LENGTH, isValidDevOtp } from "./otp";

// Dev 2FA: the flow mirrors prod (identify -> OTP -> tenant), but the code is
// fixed until Cognito lands (ADR 0010).
describe("isValidDevOtp", () => {
  it("accepts the fixed dev code 000000", () => {
    expect(isValidDevOtp("000000")).toBe(true);
  });

  it("rejects any other code, empty or malformed input", () => {
    expect(isValidDevOtp("123456")).toBe(false);
    expect(isValidDevOtp("00000")).toBe(false);
    expect(isValidDevOtp("0000000")).toBe(false);
    expect(isValidDevOtp("")).toBe(false);
    expect(isValidDevOtp("00 000")).toBe(false);
  });

  it("exposes the code length for the OTP input", () => {
    expect(DEV_OTP_LENGTH).toBe(6);
  });
});
