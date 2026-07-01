import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

// A tenant schema is created as `tenant_<slug>` by the tenant-runner.
const TENANT_SCHEMA_PATTERN = /^tenant_[a-z0-9_]+$/;

/**
 * Per-request tenant boundary. Phase 1: the schema comes from the
 * `X-Tenant-Schema` header. Phase 2 will resolve it from the signed token —
 * only this class changes, adapters keep using `schema`.
 *
 * The value is validated here because it is interpolated into
 * `SET LOCAL search_path` (an identifier cannot be a bound parameter).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  readonly schema: string;

  constructor(@Inject(REQUEST) req: Request) {
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
