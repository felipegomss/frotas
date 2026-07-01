import { createZodDto } from 'nestjs-zod';
import { StartSessionRequest } from '@frotas/contracts';

/** Nest DTO backed by the shared Zod contract (validated by ZodValidationPipe). */
export class StartSessionDto extends createZodDto(StartSessionRequest) {}
