import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  CreateVehicle,
  DeleteVehicle,
  GetVehicle,
  ListVehicles,
  UpdateVehicle,
} from '@frotas/domain';
import type {
  VehicleDetailListResponse,
  VehicleResponse,
} from '@frotas/contracts';
import { SessionGuard } from '../auth/session.guard';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicle.dto';

// Route in Portuguese (frontier: /veiculos), class in English (interior).
@Controller('veiculos')
@UseGuards(SessionGuard)
export class VehiclesController {
  constructor(
    private readonly createVehicle: CreateVehicle,
    private readonly listVehicles: ListVehicles,
    private readonly getVehicle: GetVehicle,
    private readonly updateVehicle: UpdateVehicle,
    private readonly deleteVehicle: DeleteVehicle,
  ) {}

  @Post()
  async create(@Body() body: CreateVehicleDto): Promise<VehicleResponse> {
    const vehicle = await this.createVehicle.execute(body);
    return toResponse(vehicle);
  }

  @Get()
  async list(): Promise<VehicleDetailListResponse> {
    const vehicles = await this.listVehicles.execute();
    return vehicles.map(toResponse);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<VehicleResponse> {
    const vehicle = await this.getVehicle.execute(id);
    return toResponse(vehicle);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateVehicleDto,
  ): Promise<VehicleResponse> {
    const vehicle = await this.updateVehicle.execute(id, body);
    return toResponse(vehicle);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteVehicle.execute(id);
  }
}

// Maps the domain entity to the shared contract (no domain type on the wire).
function toResponse(vehicle: {
  id: string;
  plate: string;
  model: string;
  year: number;
  type: string;
  secretariatId: string;
  status: string;
  currentMileage: number;
}): VehicleResponse {
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    model: vehicle.model,
    year: vehicle.year,
    type: vehicle.type as VehicleResponse['type'],
    secretariatId: vehicle.secretariatId,
    status: vehicle.status,
    currentMileage: vehicle.currentMileage,
  };
}
