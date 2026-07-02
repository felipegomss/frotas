import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import {
  DuplicateSecretariatNameError,
  MembershipNotFoundError,
  SecretariatNotFoundError,
} from '@frotas/domain';
import type { Response } from 'express';

type DomainError =
  | MembershipNotFoundError
  | SecretariatNotFoundError
  | DuplicateSecretariatNameError;

/**
 * Maps domain errors to HTTP at the edge (roadmap fase 4). No active membership
 * in the requested tenant → 403 (ADR 0010: no membership, no session token).
 * Not-found / duplicate-name domain errors → 404 / 409.
 */
@Catch(
  MembershipNotFoundError,
  SecretariatNotFoundError,
  DuplicateSecretariatNameError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof MembershipNotFoundError) {
      response.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Sem vínculo ativo nesta prefeitura.',
      });
      return;
    }
    if (exception instanceof SecretariatNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Secretaria não encontrada.',
      });
      return;
    }
    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message: 'Já existe uma secretaria com este nome.',
    });
  }
}
