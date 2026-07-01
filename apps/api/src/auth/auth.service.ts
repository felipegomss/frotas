import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { StartTenantSession, type MembershipDirectory } from '@frotas/domain';
import type { PrefecturesResponse, SessionResponse } from '@frotas/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { SessionTokenService } from './session-token.service';
import { MEMBERSHIP_DIRECTORY } from './infra/prisma-membership.directory';

/**
 * Orchestrates the session flow (ADR 0010): map the IdP `sub` to a control-plane
 * identity, then delegate the authorization rule to the domain use case and mint
 * the signed session token.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEMBERSHIP_DIRECTORY)
    private readonly directory: MembershipDirectory,
    private readonly startTenantSession: StartTenantSession,
    private readonly sessionToken: SessionTokenService,
  ) {}

  async listPrefectures(sub: string): Promise<PrefecturesResponse> {
    const identityId = await this.identityIdFromSub(sub);
    const memberships = await this.directory.listActive(identityId);
    return memberships.map((m) => ({
      id: m.tenantId,
      slug: m.tenantSlug,
      name: m.tenantName,
      role: m.role,
    }));
  }

  async startSession(sub: string, tenantId: string): Promise<SessionResponse> {
    const identityId = await this.identityIdFromSub(sub);
    const membership = await this.startTenantSession.execute(
      identityId,
      tenantId,
    );
    const token = await this.sessionToken.sign({
      identityId: membership.identityId,
      tenantId: membership.tenantId,
      schemaName: membership.schemaName,
      role: membership.role,
    });
    return {
      token,
      tenant: {
        id: membership.tenantId,
        slug: membership.tenantSlug,
        name: membership.tenantName,
      },
      role: membership.role,
    };
  }

  // Control-plane lookup: the IdP `sub` maps to Identity.authSub.
  private async identityIdFromSub(sub: string): Promise<string> {
    const identity = await this.prisma.client.identity.findFirst({
      where: { authSub: sub, status: 'active' },
      select: { id: true },
    });
    if (!identity) {
      throw new UnauthorizedException('Identidade não encontrada.');
    }
    return identity.id;
  }
}
