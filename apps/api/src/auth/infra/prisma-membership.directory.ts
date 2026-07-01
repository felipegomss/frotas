import { Injectable } from '@nestjs/common';
import type { ActiveMembership, MembershipDirectory } from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { toActiveMembership } from './membership.mapper';

// DI token for the domain port (a TS interface has no runtime value).
export const MEMBERSHIP_DIRECTORY = Symbol('MembershipDirectory');

/**
 * Control-plane adapter for the MembershipDirectory port. Uses typed Prisma on
 * the `admin` schema (ADR 0005 allows typed Prisma in the control plane), then
 * maps rows to the domain entity — no Prisma type crosses the boundary.
 */
@Injectable()
export class PrismaMembershipDirectory implements MembershipDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(identityId: string): Promise<ActiveMembership[]> {
    const rows = await this.prisma.client.membership.findMany({
      where: { identityId, status: 'active' },
      include: { tenant: true },
      orderBy: { tenant: { name: 'asc' } },
    });
    return rows.map(toActiveMembership);
  }

  async findActive(
    identityId: string,
    tenantId: string,
  ): Promise<ActiveMembership | null> {
    const row = await this.prisma.client.membership.findFirst({
      where: { identityId, tenantId, status: 'active' },
      include: { tenant: true },
    });
    return row ? toActiveMembership(row) : null;
  }
}
