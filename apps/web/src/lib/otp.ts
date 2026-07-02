// Dev 2FA code. The login flow mirrors prod (identify -> OTP -> tenant), but
// until the real Cognito flow lands (ADR 0010) the code is fixed.
export const DEV_OTP = "000000";
export const DEV_OTP_LENGTH = DEV_OTP.length;

export function isValidDevOtp(code: string): boolean {
  return code === DEV_OTP;
}
