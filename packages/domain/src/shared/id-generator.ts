// PORT: the domain decides an id is needed, but never how it is generated.
export interface IdGenerator {
  newId(): string;
}
