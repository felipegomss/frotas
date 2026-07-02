import { Injectable } from '@nestjs/common';
import { applyTenantTemplate } from '@frotas/db';
import {
  TENANT_SCHEMA_NAME_PATTERN,
  type TenantSchemaProvisioner,
  type TenantSchemaProvisionInput,
} from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Tenant-schema adapter (ADR 0005): raw SQL inside ONE transaction, so the
 * schema, template, admin local user and genesis audit record are
 * all-or-nothing (DDL is transactional in Postgres). Only called for tenants
 * that are not active, which makes dropping leftovers of a failed attempt
 * safe. The genesis append needs no lock: the schema is created in this same
 * transaction, so nothing else can be writing to its audit_log (ADR 0012).
 */
@Injectable()
export class RawSqlTenantSchemaProvisioner implements TenantSchemaProvisioner {
  constructor(private readonly prisma: PrismaService) {}

  async provision(input: TenantSchemaProvisionInput): Promise<void> {
    const { schemaName, adminIdentityId, genesis } = input;
    // Defense in depth: the domain already whitelists the slug, but this
    // string is interpolated into DDL, so the adapter re-checks it.
    if (!TENANT_SCHEMA_NAME_PATTERN.test(schemaName)) {
      throw new Error(`Unsafe tenant schema name: ${schemaName}`);
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
      );
      // Creates the schema, scopes search_path to it and applies the template.
      await applyTenantTemplate(tx, schemaName);
      await tx.$executeRaw`
        INSERT INTO users (identity_id, position, status)
        VALUES (${adminIdentityId}::uuid, 'admin', 'active')`;
      await tx.$executeRaw`
        INSERT INTO audit_log
          (actor_id, action, entity, entity_id, prev_hash, hash, created_at)
        VALUES
          (${genesis.actorId}::uuid, ${genesis.action}, ${genesis.entity},
           ${genesis.entityId}::uuid, ${genesis.prevHash}, ${genesis.hash},
           ${genesis.createdAt}::timestamptz)`;
    });
  }
}
