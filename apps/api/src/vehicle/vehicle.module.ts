import { Module } from '@nestjs/common';
import {
  CreateVehicle,
  DeleteVehicle,
  GetVehicle,
  ListAvailableVehicles,
  ListVehicles,
  UpdateVehicle,
  type IdGenerator,
  type VehicleRepository,
} from '@frotas/domain';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantContext } from '../tenant/tenant-context';
import { CryptoIdGenerator } from '../common/crypto-id-generator';
import { FleetController } from './fleet.controller';
import { VehiclesController } from './vehicles.controller';
import { PrismaVehicleRepository } from './infra/prisma-vehicle.repository';

// Injection tokens for the domain ports (TS interfaces have no runtime value).
export const VEHICLE_REPOSITORY = Symbol('VehicleRepository');
export const ID_GENERATOR = Symbol('IdGenerator');

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FleetController, VehiclesController],
  providers: [
    TenantContext,
    { provide: VEHICLE_REPOSITORY, useClass: PrismaVehicleRepository },
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
    {
      provide: ListAvailableVehicles,
      useFactory: (repo: VehicleRepository) => new ListAvailableVehicles(repo),
      inject: [VEHICLE_REPOSITORY],
    },
    {
      provide: CreateVehicle,
      useFactory: (repo: VehicleRepository, ids: IdGenerator) =>
        new CreateVehicle(repo, ids),
      inject: [VEHICLE_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: ListVehicles,
      useFactory: (repo: VehicleRepository) => new ListVehicles(repo),
      inject: [VEHICLE_REPOSITORY],
    },
    {
      provide: GetVehicle,
      useFactory: (repo: VehicleRepository) => new GetVehicle(repo),
      inject: [VEHICLE_REPOSITORY],
    },
    {
      provide: UpdateVehicle,
      useFactory: (repo: VehicleRepository) => new UpdateVehicle(repo),
      inject: [VEHICLE_REPOSITORY],
    },
    {
      provide: DeleteVehicle,
      useFactory: (repo: VehicleRepository) => new DeleteVehicle(repo),
      inject: [VEHICLE_REPOSITORY],
    },
  ],
})
export class VehicleModule {}
