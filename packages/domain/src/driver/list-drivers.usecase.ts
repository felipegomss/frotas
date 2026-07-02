import { Driver } from "./driver.entity.js";
import type { DriverRepository } from "./driver.repository.js";

export class ListDrivers {
  constructor(private readonly drivers: DriverRepository) {}

  execute(): Promise<Driver[]> {
    return this.drivers.list();
  }
}
