import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionTokenService } from './session-token.service';
import { extractBearer, type AuthedRequest } from './session-principal';

/**
 * Guards tenant-data routes. Verifies the API-signed session token and puts the
 * principal (with the tenant `schemaName`) on the request. `TenantContext` reads
 * only from here — the tenant never comes from a client header.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionToken: SessionTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractBearer(req);
    if (!token) {
      throw new UnauthorizedException('Cabeçalho Authorization ausente.');
    }
    req.principal = await this.sessionToken.verify(token);
    return true;
  }
}
