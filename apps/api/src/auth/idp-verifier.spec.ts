import type { JWTVerifyGetKey } from 'jose';
import { IdpVerifier } from './idp-verifier';

// A resolver is required by the constructor but never invoked in these tests.
const dummyResolver = (() =>
  Promise.reject(new Error('unused'))) as unknown as JWTVerifyGetKey;

describe('IdpVerifier (fail-closed config)', () => {
  const original = {
    issuer: process.env.IDP_ISSUER,
    audience: process.env.IDP_AUDIENCE,
  };

  afterEach(() => {
    process.env.IDP_ISSUER = original.issuer;
    process.env.IDP_AUDIENCE = original.audience;
  });

  it('throws when IDP_ISSUER is missing', () => {
    delete process.env.IDP_ISSUER;
    process.env.IDP_AUDIENCE = 'frotas-api';
    expect(() => new IdpVerifier(dummyResolver)).toThrow();
  });

  it('throws when IDP_AUDIENCE is missing', () => {
    process.env.IDP_ISSUER = 'https://issuer.local';
    delete process.env.IDP_AUDIENCE;
    expect(() => new IdpVerifier(dummyResolver)).toThrow();
  });

  it('constructs when both are set', () => {
    process.env.IDP_ISSUER = 'https://issuer.local';
    process.env.IDP_AUDIENCE = 'frotas-api';
    expect(() => new IdpVerifier(dummyResolver)).not.toThrow();
  });
});
