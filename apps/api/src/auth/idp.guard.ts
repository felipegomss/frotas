import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IdpVerifier } from './idp-verifier';
import { extractBearer, type AuthedRequest } from './session-principal';

/**
 * Guards routes that authenticate the identity via the IdP token (POST /sessao,
 * GET /sessao/prefeituras). Populates `req.identity` with the verified `sub`.
 */
@Injectable()
export class IdpGuard implements CanActivate {
  constructor(private readonly idp: IdpVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractBearer(req);
    if (!token) {
      throw new UnauthorizedException('Cabeçalho Authorization ausente.');
    }
    req.identity = await this.idp.verify(token);
    return true;
  }
}
