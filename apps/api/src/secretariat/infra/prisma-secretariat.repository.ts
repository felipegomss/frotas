import { Injectable, Scope } from '@nestjs/common';
import { Prisma } from '@frotas/db';
import {
  DuplicateSecretariatNameError,
  Secretariat,
  type SecretariatRepository,
} from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenant/tenant-context';
import { toSecretariat, type SecretariatRow } from './secretariat.mapper';

// SQLSTATE for a Postgres unique_violation — stable across Postgres/driver versions.
const POSTGRES_UNIQUE_VIOLATION = '23505';

/** Shape of `error.meta` that the pg driver adapter attaches to a raw-query failure. */
interface DriverAdapterErrorMeta {
  driverAdapterError?: {
    cause?: {
      originalCode?: string;
    };
  };
}

/** True when a raw query failed on the `secretariats.name` unique constraint. */
function isDuplicateNameViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2010') return false;
  const meta = error.meta as DriverAdapterErrorMeta | undefined;
  return (
    meta?.driverAdapterError?.cause?.originalCode === POSTGRES_UNIQUE_VIOLATION
  );
}

/**
 * Tenant data adapter (ADR 0005): `secretariats` is a tenant table, not a Prisma
 * model. Access is raw SQL inside a transaction that scopes `search_path` to the
 * tenant schema, then rows are mapped to the domain entity. Request-scoped
 * because it depends on the per-request TenantContext.
 */
@Injectable({ scope: Scope.REQUEST })
export class PrismaSecretariatRepository implements SecretariatRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  private withTenant<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL search_path TO "${this.tenant.schema}"`,
      );
      return fn(tx);
    });
  }

  list(): Promise<Secretariat[]> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<SecretariatRow[]>(
        `SELECT id, name FROM secretariats ORDER BY name`,
      );
      return rows.map(toSecretariat);
    });
  }

  findById(id: string): Promise<Secretariat | null> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRaw<SecretariatRow[]>`
        SELECT id, name FROM secretariats WHERE id = ${id} LIMIT 1`;
      return rows.length > 0 ? toSecretariat(rows[0]) : null;
    });
  }

  findByName(name: string): Promise<Secretariat | null> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRaw<SecretariatRow[]>`
        SELECT id, name FROM secretariats WHERE name = ${name} LIMIT 1`;
      return rows.length > 0 ? toSecretariat(rows[0]) : null;
    });
  }

  save(secretariat: Secretariat): Promise<void> {
    return this.withTenant(async (tx) => {
      try {
        await tx.$executeRaw`
          INSERT INTO secretariats (id, name)
          VALUES (${secretariat.id}, ${secretariat.name})
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`;
      } catch (error) {
        if (isDuplicateNameViolation(error)) {
          throw new DuplicateSecretariatNameError(secretariat.name);
        }
        throw error;
      }
    });
  }

  delete(id: string): Promise<void> {
    return this.withTenant(async (tx) => {
      await tx.$executeRaw`DELETE FROM secretariats WHERE id = ${id}`;
    });
  }
}
