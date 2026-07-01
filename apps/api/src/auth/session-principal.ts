import type { Request } from 'express';

/**
 * The authenticated tenant session, carried by the API-signed session token
 * (ADR 0010). `schemaName` is the sole source of truth for the tenant boundary.
 */
export interface SessionPrincipal {
  identityId: string;
  tenantId: string;
  schemaName: string;
  role: string;
}

/** The identity proven by the IdP token (before a tenant is chosen). */
export interface IdpIdentity {
  sub: string;
}

/** Express request augmented by the auth guards. */
export interface AuthedRequest extends Request {
  identity?: IdpIdentity;
  principal?: SessionPrincipal;
}

/** Extracts the raw token from an `Authorization: Bearer <token>` header. */
export function extractBearer(req: Request): string | null {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}
