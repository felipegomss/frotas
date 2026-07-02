/** Raised when a secretariat id does not exist in the current tenant. */
export class SecretariatNotFoundError extends Error {
  constructor(id: string) {
    super(`Secretariat ${id} not found`);
    this.name = "SecretariatNotFoundError";
  }
}

/** Raised when a secretariat name already exists in the current tenant. */
export class DuplicateSecretariatNameError extends Error {
  constructor(name: string) {
    super(`Secretariat name "${name}" already exists`);
    this.name = "DuplicateSecretariatNameError";
  }
}

/** Raised when deleting a secretariat that still has vehicles referencing it (M0-F04). */
export class SecretariatInUseError extends Error {
  constructor(id: string) {
    super(`Secretariat ${id} still has vehicles and cannot be deleted`);
    this.name = "SecretariatInUseError";
  }
}
