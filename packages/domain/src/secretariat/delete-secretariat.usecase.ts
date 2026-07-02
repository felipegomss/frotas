import { SecretariatNotFoundError } from "./secretariat.errors.js";
import type { SecretariatRepository } from "./secretariat.repository.js";

export class DeleteSecretariat {
  constructor(private readonly secretariats: SecretariatRepository) {}

  async execute(id: string): Promise<void> {
    const secretariat = await this.secretariats.findById(id);
    if (!secretariat) throw new SecretariatNotFoundError(id);
    await this.secretariats.delete(id);
  }
}
