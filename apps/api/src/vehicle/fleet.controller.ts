import { Controller, Get, UseGuards } from '@nestjs/common';
import { ListAvailableVehicles } from '@frotas/domain';
import type { VehicleListItem } from '@frotas/contracts';
import { SessionGuard } from '../auth/session.guard';

// Route in Portuguese (frontier: /frota), class in English (interior).
@Controller('frota')
@UseGuards(SessionGuard)
export class FleetController {
  constructor(private readonly listAvailableVehicles: ListAvailableVehicles) {}

  // GET /frota — available vehicles of the tenant from the signed session claim.
  // Maps the domain entity to the shared contract (no domain type on the wire).
  @Get()
  async listAvailable(): Promise<VehicleListItem[]> {
    const vehicles = await this.listAvailableVehicles.execute();
    return vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      status: v.status,
      currentMileage: v.currentMileage,
    }));
  }
}
