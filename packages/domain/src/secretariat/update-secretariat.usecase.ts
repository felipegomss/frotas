import { Secretariat } from "./secretariat.entity.js";
import {
  DuplicateSecretariatNameError,
  SecretariatNotFoundError,
} from "./secretariat.errors.js";
import type { SecretariatRepository } from "./secretariat.repository.js";

export class UpdateSecretariat {
  constructor(private readonly secretariats: SecretariatRepository) {}

  async execute(id: string, name: string): Promise<Secretariat> {
    const secretariat = await this.secretariats.findById(id);
    if (!secretariat) throw new SecretariatNotFoundError(id);

    const existing = await this.secretariats.findByName(name.trim());
    if (existing && existing.id !== id) {
      throw new DuplicateSecretariatNameError(name.trim());
    }

    secretariat.rename(name);
    await this.secretariats.save(secretariat);
    return secretariat;
  }
}
