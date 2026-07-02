import { createZodDto } from 'nestjs-zod';
import { CreateVehicleRequest, UpdateVehicleRequest } from '@frotas/contracts';

/** Nest DTOs backed by the shared Zod contracts (validated by ZodValidationPipe). */
export class CreateVehicleDto extends createZodDto(CreateVehicleRequest) {}

export class UpdateVehicleDto extends createZodDto(UpdateVehicleRequest) {}
