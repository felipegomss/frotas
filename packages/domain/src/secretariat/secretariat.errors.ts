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
