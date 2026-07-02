import { Injectable, Scope } from '@nestjs/common';
import { Prisma } from '@frotas/db';
import {
  DuplicatePlateError,
  SecretariatNotFoundError,
  Vehicle,
  type VehicleRepository,
} from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenant/tenant-context';
import {
  isPostgresError,
  POSTGRES_FOREIGN_KEY_VIOLATION,
  POSTGRES_UNIQUE_VIOLATION,
} from '../../common/postgres-error';
import { toVehicle, type VehicleRow } from './vehicle.mapper';

/**
 * Tenant data adapter (ADR 0005): tenant tables are NOT Prisma models. Access is
 * raw SQL inside a transaction that scopes `search_path` to the tenant schema,
 * then rows are mapped to the domain entity. Request-scoped because it depends
 * on the per-request TenantContext.
 */
@Injectable({ scope: Scope.REQUEST })
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  // Opens a transaction pinned to the tenant schema. `schema` is validated by
  // TenantContext (^tenant_[a-z0-9_]+$) before it reaches this interpolation.
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

  private static readonly COLUMNS =
    'id, plate, model, year, type, secretariat_id, status, current_mileage';

  list(): Promise<Vehicle[]> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<VehicleRow[]>(
        `SELECT ${PrismaVehicleRepository.COLUMNS} FROM vehicles ORDER BY plate`,
      );
      return rows.map(toVehicle);
    });
  }

  listAvailable(): Promise<Vehicle[]> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<VehicleRow[]>(
        `SELECT ${PrismaVehicleRepository.COLUMNS}
           FROM vehicles
          WHERE status = 'available'
          ORDER BY plate`,
      );
      return rows.map(toVehicle);
    });
  }

  findById(id: string): Promise<Vehicle | null> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRaw<VehicleRow[]>`
        SELECT id, plate, model, year, type, secretariat_id, status, current_mileage
          FROM vehicles
         WHERE id = ${id}
         LIMIT 1`;
      return rows.length > 0 ? toVehicle(rows[0]) : null;
    });
  }

  findByPlate(plate: string): Promise<Vehicle | null> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRaw<VehicleRow[]>`
        SELECT id, plate, model, year, type, secretariat_id, status, current_mileage
          FROM vehicles
         WHERE plate = ${plate}
         LIMIT 1`;
      return rows.length > 0 ? toVehicle(rows[0]) : null;
    });
  }

  save(vehicle: Vehicle): Promise<void> {
    return this.withTenant(async (tx) => {
      try {
        await tx.$executeRaw`
          INSERT INTO vehicles
            (id, plate, model, year, type, secretariat_id, status, current_mileage)
          VALUES
            (${vehicle.id}, ${vehicle.plate}, ${vehicle.model}, ${vehicle.year},
             ${vehicle.type}, ${vehicle.secretariatId}, ${vehicle.status},
             ${vehicle.currentMileage})
          ON CONFLICT (id) DO UPDATE SET
            plate = EXCLUDED.plate,
            model = EXCLUDED.model,
            year = EXCLUDED.year,
            type = EXCLUDED.type,
            secretariat_id = EXCLUDED.secretariat_id,
            status = EXCLUDED.status,
            current_mileage = EXCLUDED.current_mileage`;
      } catch (error) {
        if (isPostgresError(error, POSTGRES_UNIQUE_VIOLATION)) {
          throw new DuplicatePlateError(vehicle.plate);
        }
        if (isPostgresError(error, POSTGRES_FOREIGN_KEY_VIOLATION)) {
          throw new SecretariatNotFoundError(vehicle.secretariatId);
        }
        throw error;
      }
    });
  }

  delete(id: string): Promise<void> {
    return this.withTenant(async (tx) => {
      await tx.$executeRaw`DELETE FROM vehicles WHERE id = ${id}`;
    });
  }
}
