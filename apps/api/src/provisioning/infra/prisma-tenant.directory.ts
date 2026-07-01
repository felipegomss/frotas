import { Injectable } from '@nestjs/common';
import type { TenantDirectory, TenantRecord } from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { toTenantRecord } from './tenant.mapper';

/**
 * Control-plane adapter for the TenantDirectory port (typed Prisma on the
 * `admin` schema, ADR 0005). Rows are mapped to domain records at the boundary.
 */
@Injectable()
export class PrismaTenantDirectory implements TenantDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<TenantRecord | null> {
    const row = await this.prisma.client.tenant.findUnique({
      where: { slug },
    });
    return row ? toTenantRecord(row) : null;
  }

  async createProvisioning(input: {
    slug: string;
    schemaName: string;
    name: string;
  }): Promise<TenantRecord> {
    const row = await this.prisma.client.tenant.create({
      data: { ...input, status: 'provisioning' },
    });
    return toTenantRecord(row);
  }

  async markActive(tenantId: string): Promise<void> {
    await this.prisma.client.tenant.update({
      where: { id: tenantId },
      data: { status: 'active' },
    });
  }

  async markFailed(tenantId: string): Promise<void> {
    await this.prisma.client.tenant.update({
      where: { id: tenantId },
      data: { status: 'failed' },
    });
  }
}
