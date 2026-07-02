import { Injectable, Scope } from '@nestjs/common';
import { Prisma } from '@frotas/db';
import {
  DuplicateSecretariatNameError,
  Secretariat,
  SecretariatInUseError,
  type SecretariatRepository,
} from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenant/tenant-context';
import {
  isPostgresError,
  POSTGRES_FOREIGN_KEY_VIOLATION,
  POSTGRES_UNIQUE_VIOLATION,
} from '../../common/postgres-error';
import { toSecretariat, type SecretariatRow } from './secretariat.mapper';

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
        if (isPostgresError(error, POSTGRES_UNIQUE_VIOLATION)) {
          throw new DuplicateSecretariatNameError(secretariat.name);
        }
        throw error;
      }
    });
  }

  delete(id: string): Promise<void> {
    return this.withTenant(async (tx) => {
      try {
        await tx.$executeRaw`DELETE FROM secretariats WHERE id = ${id}`;
      } catch (error) {
        if (isPostgresError(error, POSTGRES_FOREIGN_KEY_VIOLATION)) {
          throw new SecretariatInUseError(id);
        }
        throw error;
      }
    });
  }
}
