import { describe, expect, it } from "vitest";
import { Secretariat } from "./secretariat.entity.js";
import { ListSecretariats } from "./list-secretariats.usecase.js";
import { FakeSecretariatRepository } from "./testing/fake-secretariat-repository.js";

describe("ListSecretariats", () => {
  it("returns secretariats ordered by name", async () => {
    const repository = new FakeSecretariatRepository([
      new Secretariat("id-2", "Saúde"),
      new Secretariat("id-1", "Educação"),
    ]);
    const useCase = new ListSecretariats(repository);

    const secretariats = await useCase.execute();

    expect(secretariats.map((s) => s.name)).toEqual(["Educação", "Saúde"]);
  });
});
