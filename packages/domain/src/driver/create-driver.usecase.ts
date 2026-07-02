import type { IdGenerator } from "../shared/id-generator.js";
import { Driver, type DriverAttributes } from "./driver.entity.js";
import type { DriverRepository } from "./driver.repository.js";

export class CreateDriver {
  constructor(
    private readonly drivers: DriverRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(attrs: DriverAttributes): Promise<Driver> {
    const driver = new Driver(this.ids.newId(), attrs);
    await this.drivers.save(driver);
    return driver;
  }
}
