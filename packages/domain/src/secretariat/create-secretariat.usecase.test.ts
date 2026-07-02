import { describe, expect, it } from "vitest";
import { DuplicateSecretariatNameError } from "./secretariat.errors.js";
import { CreateSecretariat } from "./create-secretariat.usecase.js";
import { FakeIdGenerator } from "./testing/fake-id-generator.js";
import { FakeSecretariatRepository } from "./testing/fake-secretariat-repository.js";

describe("CreateSecretariat", () => {
  it("creates a secretariat with a generated id (AC1)", async () => {
    const useCase = new CreateSecretariat(
      new FakeSecretariatRepository(),
      new FakeIdGenerator(),
    );

    const secretariat = await useCase.execute("Saúde");

    expect(secretariat).toMatchObject({ id: "id-1", name: "Saúde" });
  });

  it("rejects a duplicate name (AC2)", async () => {
    const repository = new FakeSecretariatRepository();
    const useCase = new CreateSecretariat(repository, new FakeIdGenerator());
    await useCase.execute("Saúde");

    await expect(useCase.execute("Saúde")).rejects.toBeInstanceOf(
      DuplicateSecretariatNameError,
    );
  });
});
