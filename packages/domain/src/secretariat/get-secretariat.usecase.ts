import { Secretariat } from "./secretariat.entity.js";
import { SecretariatNotFoundError } from "./secretariat.errors.js";
import type { SecretariatRepository } from "./secretariat.repository.js";

export class GetSecretariat {
  constructor(private readonly secretariats: SecretariatRepository) {}

  async execute(id: string): Promise<Secretariat> {
    const secretariat = await this.secretariats.findById(id);
    if (!secretariat) throw new SecretariatNotFoundError(id);
    return secretariat;
  }
}
