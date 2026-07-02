import { describe, expect, it } from "vitest";
import { Secretariat } from "./secretariat.entity.js";
import { SecretariatNotFoundError } from "./secretariat.errors.js";
import { DeleteSecretariat } from "./delete-secretariat.usecase.js";
import { FakeSecretariatRepository } from "./testing/fake-secretariat-repository.js";

describe("DeleteSecretariat", () => {
  it("deletes an existing secretariat (AC9)", async () => {
    const repository = new FakeSecretariatRepository([
      new Secretariat("id-1", "Saúde"),
    ]);
    const useCase = new DeleteSecretariat(repository);

    await useCase.execute("id-1");

    expect(await repository.findById("id-1")).toBeNull();
  });

  it("throws when the id does not exist (AC8)", async () => {
    const useCase = new DeleteSecretariat(new FakeSecretariatRepository());

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(
      SecretariatNotFoundError,
    );
  });
});
