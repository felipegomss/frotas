import { Driver } from "./driver.entity.js";
// PORT: the domain depends on this, never on the ORM. The Prisma adapter implements it.
export interface DriverRepository {
  list(): Promise<Driver[]>;
  findById(id: string): Promise<Driver | null>;
  // Saves the driver AND its authorized-vehicle set atomically. The tenant
  // boundary is an infrastructure concern (search_path), not a domain argument.
  save(driver: Driver): Promise<void>;
  delete(id: string): Promise<void>;
}
