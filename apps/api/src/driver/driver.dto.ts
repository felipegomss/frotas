import { createZodDto } from 'nestjs-zod';
import { CreateDriverRequest, UpdateDriverRequest } from '@frotas/contracts';

/** Nest DTOs backed by the shared Zod contracts (validated by ZodValidationPipe). */
export class CreateDriverDto extends createZodDto(CreateDriverRequest) {}

export class UpdateDriverDto extends createZodDto(UpdateDriverRequest) {}
