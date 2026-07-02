import type { Driver } from "../driver.entity.js";
import type { DriverRepository } from "../driver.repository.js";

/** In-memory port implementation for domain tests (no framework, no Prisma). */
export class FakeDriverRepository implements DriverRepository {
  constructor(private readonly rows: Driver[] = []) {}

  list(): Promise<Driver[]> {
    return Promise.resolve(
      [...this.rows].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  findById(id: string): Promise<Driver | null> {
    return Promise.resolve(this.rows.find((d) => d.id === id) ?? null);
  }

  save(driver: Driver): Promise<void> {
    const index = this.rows.findIndex((d) => d.id === driver.id);
    if (index >= 0) {
      this.rows[index] = driver;
    } else {
      this.rows.push(driver);
    }
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    const index = this.rows.findIndex((d) => d.id === id);
    if (index >= 0) this.rows.splice(index, 1);
    return Promise.resolve();
  }
}
