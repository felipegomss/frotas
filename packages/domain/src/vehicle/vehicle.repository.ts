import { Vehicle } from "./vehicle.entity";
// PORT: the domain depends on this, never on the ORM. The Prisma adapter implements it.
export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  listAvailable(secretariatId: string): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<void>;
}
