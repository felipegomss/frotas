import { Secretariat } from "./secretariat.entity.js";
import type { SecretariatRepository } from "./secretariat.repository.js";

export class ListSecretariats {
  constructor(private readonly secretariats: SecretariatRepository) {}

  execute(): Promise<Secretariat[]> {
    return this.secretariats.list();
  }
}
