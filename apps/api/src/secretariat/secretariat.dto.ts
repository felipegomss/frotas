import { createZodDto } from 'nestjs-zod';
import {
  CreateSecretariatRequest,
  UpdateSecretariatRequest,
} from '@frotas/contracts';

/** Nest DTOs backed by the shared Zod contracts (validated by ZodValidationPipe). */
export class CreateSecretariatDto extends createZodDto(
  CreateSecretariatRequest,
) {}

export class UpdateSecretariatDto extends createZodDto(
  UpdateSecretariatRequest,
) {}
