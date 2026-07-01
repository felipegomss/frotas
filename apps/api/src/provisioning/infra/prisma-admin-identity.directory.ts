import { Injectable } from '@nestjs/common';
import type {
  AdminIdentity,
  AdminIdentityDirectory,
  NewAdminIdentity,
} from '@frotas/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { toAdminIdentity } from './identity.mapper';

/**
 * Control-plane adapter for the AdminIdentityDirectory port. CPF is the natural
 * key of an identity (ADR 0003): provisioning a second tenant for the same
 * person reuses the existing identity instead of creating a duplicate.
 */
@Injectable()
export class PrismaAdminIdentityDirectory implements AdminIdentityDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByCpf(input: NewAdminIdentity): Promise<AdminIdentity> {
    const existing = await this.prisma.client.identity.findUnique({
      where: { cpf: input.cpf },
    });
    if (existing) {
      return toAdminIdentity(existing);
    }
    const row = await this.prisma.client.identity.create({
      data: {
        cpf: input.cpf,
        email: input.email,
        name: input.name,
        authSub: input.authSub ?? null,
        status: 'active',
      },
    });
    return toAdminIdentity(row);
  }

  async ensureAdminMembership(
    identityId: string,
    tenantId: string,
  ): Promise<void> {
    await this.prisma.client.membership.upsert({
      where: {
        identityId_tenantId_role: { identityId, tenantId, role: 'admin' },
      },
      update: { status: 'active' },
      create: { identityId, tenantId, role: 'admin', status: 'active' },
    });
  }
}
