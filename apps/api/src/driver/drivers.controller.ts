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
  CreateDriver,
  DeleteDriver,
  Driver,
  GetDriver,
  ListDrivers,
  UpdateDriver,
} from '@frotas/domain';
import type { DriverListResponse, DriverResponse } from '@frotas/contracts';
import { SessionGuard } from '../auth/session.guard';
import { CreateDriverDto, UpdateDriverDto } from './driver.dto';

// Route in Portuguese (frontier: /motoristas), class in English (interior).
@Controller('motoristas')
@UseGuards(SessionGuard)
export class DriversController {
  constructor(
    private readonly createDriver: CreateDriver,
    private readonly listDrivers: ListDrivers,
    private readonly getDriver: GetDriver,
    private readonly updateDriver: UpdateDriver,
    private readonly deleteDriver: DeleteDriver,
  ) {}

  @Post()
  async create(@Body() body: CreateDriverDto): Promise<DriverResponse> {
    const driver = await this.createDriver.execute(body);
    return toResponse(driver);
  }

  @Get()
  async list(): Promise<DriverListResponse> {
    const drivers = await this.listDrivers.execute();
    return drivers.map(toResponse);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<DriverResponse> {
    const driver = await this.getDriver.execute(id);
    return toResponse(driver);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDriverDto,
  ): Promise<DriverResponse> {
    const driver = await this.updateDriver.execute(id, body);
    return toResponse(driver);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteDriver.execute(id);
  }
}

// Maps the domain entity to the shared contract (no domain type on the wire).
function toResponse(driver: Driver): DriverResponse {
  return {
    id: driver.id,
    name: driver.name,
    cnhCategory: driver.cnhCategory,
    cnhExpiry: driver.cnhExpiry,
    secretariatId: driver.secretariatId,
    status: driver.status,
    authorizedVehicleIds: driver.authorizedVehicleIds,
  };
}
