import { Controller, Get } from '@nestjs/common';
import { ListAvailableVehicles, type Vehicle } from '@frotas/domain';

// Route in Portuguese (frontier), code in English (interior).
@Controller('frota')
export class FrotaController {
  constructor(private readonly listAvailableVehicles: ListAvailableVehicles) {}

  // GET /frota — available vehicles of the tenant (from X-Tenant-Schema).
  @Get()
  listAvailable(): Promise<Vehicle[]> {
    return this.listAvailableVehicles.execute();
  }
}
