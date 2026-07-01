import { SignJWT } from 'jose';
import { SessionTokenService } from './session-token.service';
import type { SessionPrincipal } from './session-principal';

const principal: SessionPrincipal = {
  identityId: 'id-1',
  tenantId: 't-a',
  schemaName: 'tenant_demo',
  role: 'manager',
};

describe('SessionTokenService', () => {
  beforeAll(() => {
    process.env.SESSION_TOKEN_SECRET = 'test-session-secret-please-change';
  });

  it('signs and verifies a session principal round-trip (AC1)', async () => {
    const service = new SessionTokenService();

    const token = await service.sign(principal);
    const verified = await service.verify(token);

    expect(verified).toEqual(principal);
  });

  it('rejects a tampered token (AC6)', async () => {
    const service = new SessionTokenService();
    const token = await service.sign(principal);
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'bb' : 'aa');

    await expect(service.verify(tampered)).rejects.toThrow();
  });

  it('rejects a token signed with a different secret (AC6)', async () => {
    const signer = new SessionTokenService();
    const token = await signer.sign(principal);

    process.env.SESSION_TOKEN_SECRET = 'a-completely-different-secret-value';
    const verifier = new SessionTokenService();

    await expect(verifier.verify(token)).rejects.toThrow();

    process.env.SESSION_TOKEN_SECRET = 'test-session-secret-please-change';
  });

  it('rejects a correctly-signed token missing required claims (I2)', async () => {
    const service = new SessionTokenService();
    const secret = new TextEncoder().encode(process.env.SESSION_TOKEN_SECRET);
    // Correct secret + issuer/audience, but no tid/sch/role claims.
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('id-1')
      .setIssuer('frotas-api')
      .setAudience('frotas-tenant-session')
      .setExpirationTime('5m')
      .sign(secret);

    await expect(service.verify(token)).rejects.toThrow();
  });
});

describe('SessionTokenService — secret strength (M3)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.SESSION_TOKEN_SECRET;

  const restore = (key: string, value: string | undefined): void => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  };

  afterEach(() => {
    restore('NODE_ENV', originalEnv);
    restore('SESSION_TOKEN_SECRET', originalSecret);
  });

  it('(a) throws in production with the placeholder secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_TOKEN_SECRET = 'dev-only-change-me';
    expect(() => new SessionTokenService()).toThrow();
  });

  it('(a) throws in production with a too-short secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_TOKEN_SECRET = 'short';
    expect(() => new SessionTokenService()).toThrow();
  });

  it('(b) constructs in production with a strong secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_TOKEN_SECRET = 'x'.repeat(40);
    expect(() => new SessionTokenService()).not.toThrow();
  });

  it('(c) allows the placeholder outside production (dev)', () => {
    process.env.NODE_ENV = 'development';
    process.env.SESSION_TOKEN_SECRET = 'dev-only-change-me';
    expect(() => new SessionTokenService()).not.toThrow();
  });
});
