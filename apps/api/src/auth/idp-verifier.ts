import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

// DI token for the JWKS key resolver. In prod it is a remote JWKS (Cognito);
// in dev/test it is a local key set from a fake OIDC issuer — same verification.
export const IDP_JWKS = Symbol('IDP_JWKS');

/** Builds the remote JWKS resolver for production (Cognito). */
export function buildRemoteJwks(): JWTVerifyGetKey {
  const url = process.env.IDP_JWKS_URL;
  if (!url) {
    throw new Error('IDP_JWKS_URL is not set');
  }
  return createRemoteJWKSet(new URL(url));
}

/**
 * Verifies an IdP (OIDC) token with jose + JWKS. Only proves identity (`sub`);
 * the tenant is resolved from memberships afterwards, never from this token.
 */
@Injectable()
export class IdpVerifier {
  private readonly issuer: string;
  private readonly audience: string;

  constructor(@Inject(IDP_JWKS) private readonly getKey: JWTVerifyGetKey) {
    const issuer = process.env.IDP_ISSUER;
    const audience = process.env.IDP_AUDIENCE;
    // Fail-closed: without issuer/audience, jose would skip those checks and
    // accept any token signed by a JWKS key (confused-deputy / token reuse).
    if (!issuer || !audience) {
      throw new Error('IDP_ISSUER and IDP_AUDIENCE must be set');
    }
    this.issuer = issuer;
    this.audience = audience;
  }

  async verify(token: string): Promise<{ sub: string }> {
    try {
      const { payload } = await jwtVerify(token, this.getKey, {
        issuer: this.issuer,
        audience: this.audience,
      });
      if (!payload.sub) {
        throw new Error('token without sub');
      }
      return { sub: payload.sub };
    } catch {
      throw new UnauthorizedException('Token de identidade inválido.');
    }
  }
}
