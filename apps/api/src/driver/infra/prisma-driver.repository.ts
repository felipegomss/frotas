import { Injectable, Scope } from '@nestjs/common';
import { Prisma } from '@frotas/db';
import {
  Driver,
  DriverRepository,
  SecretariatNotFoundError,
  VehicleNotFoundError,
} from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenant/tenant-context';
import {
  isPostgresError,
  POSTGRES_FOREIGN_KEY_VIOLATION,
} from '../../common/postgres-error';
import { toDriver, type DriverRow } from './driver.mapper';

/**
 * Tenant data adapter (ADR 0005): `drivers` and `driver_authorized_vehicles`
 * are tenant tables, not Prisma models. Access is raw SQL inside a transaction
 * scoped to the tenant schema. `save` writes the driver AND its authorized set
 * atomically, wrapping each FK-bearing step separately so a 23503 maps to the
 * right aggregate (secretariat vs vehicle) without matching constraint names.
 */
@Injectable({ scope: Scope.REQUEST })
export class PrismaDriverRepository implements DriverRepository {
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

  // Aggregates the authorized-vehicle ids per driver; the FILTER keeps the array
  // empty (not [null]) when a driver has no authorizations.
  private static readonly SELECT = `
    SELECT d.id, d.name, d.cnh_category, d.cnh_expiry::text AS cnh_expiry,
           d.secretariat_id, d.status,
           COALESCE(
             array_agg(dav.vehicle_id::text) FILTER (WHERE dav.vehicle_id IS NOT NULL),
             '{}'
           ) AS authorized_vehicle_ids
      FROM drivers d
      LEFT JOIN driver_authorized_vehicles dav ON dav.driver_id = d.id`;

  list(): Promise<Driver[]> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<DriverRow[]>(
        `${PrismaDriverRepository.SELECT} GROUP BY d.id ORDER BY d.name`,
      );
      return rows.map(toDriver);
    });
  }

  findById(id: string): Promise<Driver | null> {
    return this.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<DriverRow[]>(
        `${PrismaDriverRepository.SELECT} WHERE d.id = $1 GROUP BY d.id`,
        id,
      );
      return rows.length > 0 ? toDriver(rows[0]) : null;
    });
  }

  save(driver: Driver): Promise<void> {
    return this.withTenant(async (tx) => {
      try {
        await tx.$executeRaw`
          INSERT INTO drivers
            (id, name, cnh_category, cnh_expiry, secretariat_id, status)
          VALUES
            (${driver.id}, ${driver.name}, ${driver.cnhCategory},
             ${driver.cnhExpiry}::date, ${driver.secretariatId}, ${driver.status})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            cnh_category = EXCLUDED.cnh_category,
            cnh_expiry = EXCLUDED.cnh_expiry,
            secretariat_id = EXCLUDED.secretariat_id,
            status = EXCLUDED.status`;
      } catch (error) {
        if (isPostgresError(error, POSTGRES_FOREIGN_KEY_VIOLATION)) {
          throw new SecretariatNotFoundError(driver.secretariatId);
        }
        throw error;
      }

      // Replace the authorized set wholesale (same transaction → atomic).
      await tx.$executeRaw`
        DELETE FROM driver_authorized_vehicles WHERE driver_id = ${driver.id}`;
      for (const vehicleId of driver.authorizedVehicleIds) {
        try {
          await tx.$executeRaw`
            INSERT INTO driver_authorized_vehicles (driver_id, vehicle_id)
            VALUES (${driver.id}, ${vehicleId})`;
        } catch (error) {
          if (isPostgresError(error, POSTGRES_FOREIGN_KEY_VIOLATION)) {
            throw new VehicleNotFoundError(vehicleId);
          }
          throw error;
        }
      }
    });
  }

  delete(id: string): Promise<void> {
    return this.withTenant(async (tx) => {
      await tx.$executeRaw`DELETE FROM drivers WHERE id = ${id}`;
    });
  }
}
