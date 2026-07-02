export class Secretariat {
  public name: string;

  constructor(
    public readonly id: string,
    name: string,
  ) {
    this.name = Secretariat.normalize(name);
  }

  rename(name: string): void {
    this.name = Secretariat.normalize(name);
  }

  private static normalize(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Secretariat name cannot be empty");
    }
    return trimmed;
  }
}
