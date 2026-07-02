/** Raised when a driver id does not exist in the current tenant. */
export class DriverNotFoundError extends Error {
  constructor(id: string) {
    super(`Driver ${id} not found`);
    this.name = "DriverNotFoundError";
  }
}
