import type { IdGenerator } from "./id-generator.js";
import { Secretariat } from "./secretariat.entity.js";
import { DuplicateSecretariatNameError } from "./secretariat.errors.js";
import type { SecretariatRepository } from "./secretariat.repository.js";

export class CreateSecretariat {
  constructor(
    private readonly secretariats: SecretariatRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(name: string): Promise<Secretariat> {
    const secretariat = new Secretariat(this.ids.newId(), name);
    if (await this.secretariats.findByName(secretariat.name)) {
      throw new DuplicateSecretariatNameError(secretariat.name);
    }
    await this.secretariats.save(secretariat);
    return secretariat;
  }
}
