import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { MembershipNotFoundError } from '@frotas/domain';
import type { Response } from 'express';

/**
 * Maps domain errors to HTTP at the edge (roadmap fase 4). No active membership
 * in the requested tenant → 403 (ADR 0010: no membership, no session token).
 */
@Catch(MembershipNotFoundError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(_exception: MembershipNotFoundError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Sem vínculo ativo nesta prefeitura.',
    });
  }
}
