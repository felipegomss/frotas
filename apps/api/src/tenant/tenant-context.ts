import {
  BadRequestException,
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { AuthedRequest } from '../auth/session-principal';

// A tenant schema is created as `tenant_<slug>` by the tenant-runner.
const TENANT_SCHEMA_PATTERN = /^tenant_[a-z0-9_]+$/;

/**
 * Per-request tenant boundary. The schema comes ONLY from the verified session
 * principal (ADR 0010) that `SessionGuard` puts on the request — never from a
 * client header. This closes the header-spoofing vector that phase 1 carried.
 *
 * The value is validated here because it is interpolated into
 * `SET LOCAL search_path` (an identifier cannot be a bound parameter).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly req: AuthedRequest) {}

  get schema(): string {
    const principal = this.req.principal;
    if (!principal) {
      throw new UnauthorizedException('Sessão de tenant ausente.');
    }
    if (!TENANT_SCHEMA_PATTERN.test(principal.schemaName)) {
      throw new BadRequestException('Schema de tenant inválido.');
    }
    return principal.schemaName;
  }
}
