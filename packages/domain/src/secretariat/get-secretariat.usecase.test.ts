import { describe, expect, it } from "vitest";
import { Secretariat } from "./secretariat.entity.js";
import { SecretariatNotFoundError } from "./secretariat.errors.js";
import { GetSecretariat } from "./get-secretariat.usecase.js";
import { FakeSecretariatRepository } from "./testing/fake-secretariat-repository.js";

describe("GetSecretariat", () => {
  it("returns the secretariat by id", async () => {
    const repository = new FakeSecretariatRepository([
      new Secretariat("id-1", "Saúde"),
    ]);
    const useCase = new GetSecretariat(repository);

    const secretariat = await useCase.execute("id-1");

    expect(secretariat).toMatchObject({ id: "id-1", name: "Saúde" });
  });

  it("throws when the id does not exist (AC8)", async () => {
    const useCase = new GetSecretariat(new FakeSecretariatRepository());

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(
      SecretariatNotFoundError,
    );
  });
});
