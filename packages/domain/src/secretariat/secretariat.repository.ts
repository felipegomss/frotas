import { Secretariat } from "./secretariat.entity.js";

// PORT: the domain depends on this, never on the ORM. The Prisma adapter implements it.
export interface SecretariatRepository {
  list(): Promise<Secretariat[]>;
  findById(id: string): Promise<Secretariat | null>;
  findByName(name: string): Promise<Secretariat | null>;
  save(secretariat: Secretariat): Promise<void>;
  delete(id: string): Promise<void>;
}
