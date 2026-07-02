import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import {
  DriverNotFoundError,
  DuplicatePlateError,
  DuplicateSecretariatNameError,
  MembershipNotFoundError,
  SecretariatInUseError,
  SecretariatNotFoundError,
  VehicleNotFoundError,
} from '@frotas/domain';
import type { Response } from 'express';

type DomainError =
  | MembershipNotFoundError
  | SecretariatNotFoundError
  | DuplicateSecretariatNameError
  | SecretariatInUseError
  | VehicleNotFoundError
  | DuplicatePlateError
  | DriverNotFoundError;

/**
 * Maps domain errors to HTTP at the edge (roadmap fase 4). No active membership
 * in the requested tenant → 403 (ADR 0010: no membership, no session token).
 * Not-found → 404. Duplicate-name/plate and in-use → 409.
 */
@Catch(
  MembershipNotFoundError,
  SecretariatNotFoundError,
  DuplicateSecretariatNameError,
  SecretariatInUseError,
  VehicleNotFoundError,
  DuplicatePlateError,
  DriverNotFoundError,
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
    if (exception instanceof VehicleNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Veículo não encontrado.',
      });
      return;
    }
    if (exception instanceof DriverNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Motorista não encontrado.',
      });
      return;
    }
    if (exception instanceof SecretariatInUseError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Secretaria possui registros vinculados.',
      });
      return;
    }
    if (exception instanceof DuplicatePlateError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Já existe um veículo com esta placa.',
      });
      return;
    }
    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message: 'Já existe uma secretaria com este nome.',
    });
  }
}
