import { Driver } from "./driver.entity.js";
import { DriverNotFoundError } from "./driver.errors.js";
import type { DriverRepository } from "./driver.repository.js";

export class GetDriver {
  constructor(private readonly drivers: DriverRepository) {}

  async execute(id: string): Promise<Driver> {
    const driver = await this.drivers.findById(id);
    if (!driver) throw new DriverNotFoundError(id);
    return driver;
  }
}
