import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JWTVerifyGetKey,
  type KeyLike,
} from 'jose';

export interface IdpKit {
  /** Local JWKS resolver, injected in place of the remote Cognito JWKS. */
  jwks: JWTVerifyGetKey;
  /** Signs a valid IdP token for `sub`. */
  sign(sub: string): Promise<string>;
  /** Signs a token with a key NOT in the JWKS — its signature won't verify. */
  signWithForeignKey(sub: string): Promise<string>;
  /** Signs a valid-key token but with overridden issuer/audience claims. */
  signWithClaims(
    sub: string,
    claims: { issuer?: string; audience?: string },
  ): Promise<string>;
}

/**
 * Builds a fake OIDC issuer for tests: a local key pair whose public JWK backs
 * the resolver, so the API runs the SAME jose verification it uses in prod.
 */
export async function makeIdpKit(
  issuer: string,
  audience: string,
): Promise<IdpKit> {
  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    extractable: true,
  });
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test-key';
  jwk.alg = 'RS256';
  const jwks = createLocalJWKSet({ keys: [jwk] });

  const foreign = await generateKeyPair('RS256', { extractable: true });

  const build = (
    sub: string,
    key: KeyLike,
    claims: { issuer?: string; audience?: string } = {},
  ): Promise<string> =>
    new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setSubject(sub)
      .setIssuer(claims.issuer ?? issuer)
      .setAudience(claims.audience ?? audience)
      .setExpirationTime('5m')
      .sign(key);

  return {
    jwks,
    sign: (sub) => build(sub, privateKey),
    signWithForeignKey: (sub) => build(sub, foreign.privateKey),
    signWithClaims: (sub, claims) => build(sub, privateKey, claims),
  };
}
