import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { StartTenantSession, type MembershipDirectory } from '@frotas/domain';
import { PrismaModule } from '../prisma/prisma.module';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { AuthService } from './auth.service';
import { SessionController } from './session.controller';
import { SessionTokenService } from './session-token.service';
import { SessionGuard } from './session.guard';
import { IdpGuard } from './idp.guard';
import { IDP_JWKS, IdpVerifier, buildRemoteJwks } from './idp-verifier';
import {
  MEMBERSHIP_DIRECTORY,
  PrismaMembershipDirectory,
} from './infra/prisma-membership.directory';

@Module({
  imports: [PrismaModule],
  controllers: [SessionController],
  providers: [
    // Prod JWKS resolver (Cognito). Overridden by a local key set in tests.
    { provide: IDP_JWKS, useFactory: buildRemoteJwks },
    IdpVerifier,
    IdpGuard,
    SessionTokenService,
    SessionGuard,
    { provide: MEMBERSHIP_DIRECTORY, useClass: PrismaMembershipDirectory },
    {
      provide: StartTenantSession,
      useFactory: (directory: MembershipDirectory) =>
        new StartTenantSession(directory),
      inject: [MEMBERSHIP_DIRECTORY],
    },
    AuthService,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
  exports: [SessionGuard, SessionTokenService],
})
export class AuthModule {}
