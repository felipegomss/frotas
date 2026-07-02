import type { IdGenerator } from "../id-generator.js";

/** Deterministic id sequence for domain tests. */
export class FakeIdGenerator implements IdGenerator {
  private counter = 0;

  newId(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }
}
