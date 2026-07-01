import { Module } from '@nestjs/common';
import { ListAvailableVehicles, type VehicleRepository } from '@frotas/domain';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantContext } from '../tenant/tenant-context';
import { FleetController } from './fleet.controller';
import { PrismaVehicleRepository } from './infra/prisma-vehicle.repository';

// Injection token for the domain port (a TS interface has no runtime value).
export const VEHICLE_REPOSITORY = Symbol('VehicleRepository');

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FleetController],
  providers: [
    TenantContext,
    { provide: VEHICLE_REPOSITORY, useClass: PrismaVehicleRepository },
    {
      provide: ListAvailableVehicles,
      useFactory: (repo: VehicleRepository) => new ListAvailableVehicles(repo),
      inject: [VEHICLE_REPOSITORY],
    },
  ],
})
export class VehicleModule {}
