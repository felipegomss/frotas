import { describe, expect, it } from "vitest";
import { Secretariat } from "./secretariat.entity.js";
import {
  DuplicateSecretariatNameError,
  SecretariatNotFoundError,
} from "./secretariat.errors.js";
import { UpdateSecretariat } from "./update-secretariat.usecase.js";
import { FakeSecretariatRepository } from "./testing/fake-secretariat-repository.js";

describe("UpdateSecretariat", () => {
  it("renames the secretariat (AC7)", async () => {
    const repository = new FakeSecretariatRepository([
      new Secretariat("id-1", "Saúde"),
    ]);
    const useCase = new UpdateSecretariat(repository);

    const secretariat = await useCase.execute("id-1", "Educação");

    expect(secretariat.name).toBe("Educação");
    expect((await repository.findById("id-1"))?.name).toBe("Educação");
  });

  it("throws when the id does not exist (AC8)", async () => {
    const useCase = new UpdateSecretariat(new FakeSecretariatRepository());

    await expect(useCase.execute("missing", "Educação")).rejects.toBeInstanceOf(
      SecretariatNotFoundError,
    );
  });

  it("rejects renaming to a name used by another secretariat (AC10)", async () => {
    const repository = new FakeSecretariatRepository([
      new Secretariat("id-1", "Saúde"),
      new Secretariat("id-2", "Educação"),
    ]);
    const useCase = new UpdateSecretariat(repository);

    await expect(useCase.execute("id-1", "Educação")).rejects.toBeInstanceOf(
      DuplicateSecretariatNameError,
    );
  });

  it("allows renaming to the same name it already has", async () => {
    const repository = new FakeSecretariatRepository([
      new Secretariat("id-1", "Saúde"),
    ]);
    const useCase = new UpdateSecretariat(repository);

    const secretariat = await useCase.execute("id-1", "Saúde");

    expect(secretariat.name).toBe("Saúde");
  });
});
