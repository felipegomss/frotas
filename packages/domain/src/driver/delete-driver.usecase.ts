import { DriverNotFoundError } from "./driver.errors.js";
import type { DriverRepository } from "./driver.repository.js";

export class DeleteDriver {
  constructor(private readonly drivers: DriverRepository) {}

  async execute(id: string): Promise<void> {
    const driver = await this.drivers.findById(id);
    if (!driver) throw new DriverNotFoundError(id);
    await this.drivers.delete(id);
  }
}
