import { Module } from '@nestjs/common';
import {
  CreateSecretariat,
  DeleteSecretariat,
  GetSecretariat,
  ListSecretariats,
  UpdateSecretariat,
  type IdGenerator,
  type SecretariatRepository,
} from '@frotas/domain';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantContext } from '../tenant/tenant-context';
import { SecretariatsController } from './secretariats.controller';
import { PrismaSecretariatRepository } from './infra/prisma-secretariat.repository';
import { CryptoIdGenerator } from './infra/crypto-id-generator';

// Injection tokens for the domain ports (TS interfaces have no runtime value).
export const SECRETARIAT_REPOSITORY = Symbol('SecretariatRepository');
export const ID_GENERATOR = Symbol('IdGenerator');

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SecretariatsController],
  providers: [
    TenantContext,
    {
      provide: SECRETARIAT_REPOSITORY,
      useClass: PrismaSecretariatRepository,
    },
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
    {
      provide: CreateSecretariat,
      useFactory: (repo: SecretariatRepository, ids: IdGenerator) =>
        new CreateSecretariat(repo, ids),
      inject: [SECRETARIAT_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: ListSecretariats,
      useFactory: (repo: SecretariatRepository) => new ListSecretariats(repo),
      inject: [SECRETARIAT_REPOSITORY],
    },
    {
      provide: GetSecretariat,
      useFactory: (repo: SecretariatRepository) => new GetSecretariat(repo),
      inject: [SECRETARIAT_REPOSITORY],
    },
    {
      provide: UpdateSecretariat,
      useFactory: (repo: SecretariatRepository) => new UpdateSecretariat(repo),
      inject: [SECRETARIAT_REPOSITORY],
    },
    {
      provide: DeleteSecretariat,
      useFactory: (repo: SecretariatRepository) => new DeleteSecretariat(repo),
      inject: [SECRETARIAT_REPOSITORY],
    },
  ],
})
export class SecretariatModule {}
