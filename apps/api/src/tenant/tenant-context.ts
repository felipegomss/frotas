import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

// A tenant schema is created as `tenant_<slug>` by the tenant-runner.
const TENANT_SCHEMA_PATTERN = /^tenant_[a-z0-9_]+$/;

/**
 * Per-request tenant boundary. Phase 1: the schema comes from the
 * `X-Tenant-Schema` header. Phase 2 will resolve it from the signed token —
 * only this class changes, adapters keep using `schema`.
 *
 * SECURITY: a client header is spoofable, so header-based tenant resolution is
 * a broken-isolation vector on its own. It is disabled unless the deployment
 * explicitly opts in with `ALLOW_HEADER_TENANT=1` (dev-only scaffolding). In
 * any environment without that flag, tenant routes cannot serve tenant data.
 * Phase 2 replaces this with a tenant derived from the authenticated principal.
 *
 * The value is validated here because it is interpolated into
 * `SET LOCAL search_path` (an identifier cannot be a bound parameter).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  readonly schema: string;

  constructor(@Inject(REQUEST) req: Request) {
    if (process.env.ALLOW_HEADER_TENANT !== '1') {
      throw new ForbiddenException(
        'Resolução de tenant por header desabilitada (fase 1). ' +
          'Defina ALLOW_HEADER_TENANT=1 apenas em desenvolvimento.',
      );
    }

    const header = req.headers['x-tenant-schema'];
    const value = Array.isArray(header) ? header[0] : header;
    if (!value || !TENANT_SCHEMA_PATTERN.test(value)) {
      throw new BadRequestException(
        'Cabeçalho X-Tenant-Schema ausente ou inválido.',
      );
    }
    this.schema = value;
  }
}
