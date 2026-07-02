import type { Secretariat } from "../secretariat.entity.js";
import type { SecretariatRepository } from "../secretariat.repository.js";

/** In-memory port implementation for domain tests (no framework, no Prisma). */
export class FakeSecretariatRepository implements SecretariatRepository {
  constructor(private readonly rows: Secretariat[] = []) {}

  list(): Promise<Secretariat[]> {
    return Promise.resolve(
      [...this.rows].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  findById(id: string): Promise<Secretariat | null> {
    return Promise.resolve(this.rows.find((r) => r.id === id) ?? null);
  }

  findByName(name: string): Promise<Secretariat | null> {
    return Promise.resolve(this.rows.find((r) => r.name === name) ?? null);
  }

  save(secretariat: Secretariat): Promise<void> {
    const index = this.rows.findIndex((r) => r.id === secretariat.id);
    if (index >= 0) {
      this.rows[index] = secretariat;
    } else {
      this.rows.push(secretariat);
    }
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    const index = this.rows.findIndex((r) => r.id === id);
    if (index >= 0) this.rows.splice(index, 1);
    return Promise.resolve();
  }
}
