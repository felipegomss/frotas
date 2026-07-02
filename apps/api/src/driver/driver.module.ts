import { Module } from '@nestjs/common';
import {
  CreateDriver,
  DeleteDriver,
  GetDriver,
  ListDrivers,
  UpdateDriver,
  type DriverRepository,
  type IdGenerator,
} from '@frotas/domain';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantContext } from '../tenant/tenant-context';
import { CryptoIdGenerator } from '../common/crypto-id-generator';
import { DriversController } from './drivers.controller';
import { PrismaDriverRepository } from './infra/prisma-driver.repository';

// Injection tokens for the domain ports (TS interfaces have no runtime value).
export const DRIVER_REPOSITORY = Symbol('DriverRepository');
export const ID_GENERATOR = Symbol('IdGenerator');

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DriversController],
  providers: [
    TenantContext,
    { provide: DRIVER_REPOSITORY, useClass: PrismaDriverRepository },
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
    {
      provide: CreateDriver,
      useFactory: (repo: DriverRepository, ids: IdGenerator) =>
        new CreateDriver(repo, ids),
      inject: [DRIVER_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: ListDrivers,
      useFactory: (repo: DriverRepository) => new ListDrivers(repo),
      inject: [DRIVER_REPOSITORY],
    },
    {
      provide: GetDriver,
      useFactory: (repo: DriverRepository) => new GetDriver(repo),
      inject: [DRIVER_REPOSITORY],
    },
    {
      provide: UpdateDriver,
      useFactory: (repo: DriverRepository) => new UpdateDriver(repo),
      inject: [DRIVER_REPOSITORY],
    },
    {
      provide: DeleteDriver,
      useFactory: (repo: DriverRepository) => new DeleteDriver(repo),
      inject: [DRIVER_REPOSITORY],
    },
  ],
})
export class DriverModule {}
