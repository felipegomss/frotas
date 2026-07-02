import { Driver, type DriverUpdateAttributes } from "./driver.entity.js";
import { DriverNotFoundError } from "./driver.errors.js";
import type { DriverRepository } from "./driver.repository.js";

export class UpdateDriver {
  constructor(private readonly drivers: DriverRepository) {}

  async execute(
    id: string,
    attrs: Partial<DriverUpdateAttributes>,
  ): Promise<Driver> {
    const driver = await this.drivers.findById(id);
    if (!driver) throw new DriverNotFoundError(id);

    driver.update(attrs);
    await this.drivers.save(driver);
    return driver;
  }
}
