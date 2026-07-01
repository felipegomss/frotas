import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import type { SessionPrincipal } from './session-principal';

// Bind the session token to this API so a shared secret can't be reused to
// forge tokens accepted by another internal service.
const SESSION_ISSUER = 'frotas-api';
const SESSION_AUDIENCE = 'frotas-tenant-session';

/**
 * Mints and verifies the API-signed session token (ADR 0010). The token carries
 * the active tenant claim (`sch`) derived from the memberships — never from the
 * client. HS256 with a server secret; the tenant boundary rides in this claim.
 */
@Injectable()
export class SessionTokenService {
  private readonly secret: Uint8Array;
  private readonly ttl: string;

  constructor() {
    const secret = process.env.SESSION_TOKEN_SECRET;
    if (!secret) {
      throw new Error('SESSION_TOKEN_SECRET is not set');
    }
    this.secret = new TextEncoder().encode(secret);
    this.ttl = process.env.SESSION_TOKEN_TTL ?? '1h';
  }

  sign(principal: SessionPrincipal): Promise<string> {
    return new SignJWT({
      tid: principal.tenantId,
      sch: principal.schemaName,
      role: principal.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(principal.identityId)
      .setIssuer(SESSION_ISSUER)
      .setAudience(SESSION_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(this.ttl)
      .sign(this.secret);
  }

  async verify(token: string): Promise<SessionPrincipal> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      });
      const { sub, tid, sch, role } = payload;
      // Reject tokens missing any required claim (avoids "undefined" coercion).
      if (
        typeof sub !== 'string' ||
        typeof tid !== 'string' ||
        typeof sch !== 'string' ||
        typeof role !== 'string'
      ) {
        throw new Error('session token missing required claims');
      }
      return {
        identityId: sub,
        tenantId: tid,
        schemaName: sch,
        role,
      };
    } catch {
      throw new UnauthorizedException('Token de sessão inválido.');
    }
  }
}
