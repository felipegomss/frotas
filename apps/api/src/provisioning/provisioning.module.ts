import { Module } from '@nestjs/common';
import {
  ProvisionTenant,
  type AdminIdentityDirectory,
  type TenantDirectory,
  type TenantSchemaProvisioner,
} from '@frotas/domain';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAdminIdentityDirectory } from './infra/prisma-admin-identity.directory';
import { PrismaTenantDirectory } from './infra/prisma-tenant.directory';
import { RawSqlTenantSchemaProvisioner } from './infra/raw-sql-tenant-schema.provisioner';

/**
 * Real prefecture onboarding (M0-F02). No controller on purpose: there is no
 * platform-operator authentication yet, so provisioning is reachable only via
 * the ops CLI (`pnpm --filter api provision`) — never through HTTP.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaTenantDirectory,
    PrismaAdminIdentityDirectory,
    RawSqlTenantSchemaProvisioner,
    {
      provide: ProvisionTenant,
      useFactory: (
        tenants: TenantDirectory,
        admins: AdminIdentityDirectory,
        provisioner: TenantSchemaProvisioner,
      ) => new ProvisionTenant(tenants, admins, provisioner),
      inject: [
        PrismaTenantDirectory,
        PrismaAdminIdentityDirectory,
        RawSqlTenantSchemaProvisioner,
      ],
    },
  ],
  exports: [ProvisionTenant],
})
export class ProvisioningModule {}
