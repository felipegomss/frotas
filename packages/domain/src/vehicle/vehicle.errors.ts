/** Raised when a vehicle id does not exist in the current tenant. */
export class VehicleNotFoundError extends Error {
  constructor(id: string) {
    super(`Vehicle ${id} not found`);
    this.name = "VehicleNotFoundError";
  }
}

/** Raised when a vehicle plate already exists in the current tenant. */
export class DuplicatePlateError extends Error {
  constructor(plate: string) {
    super(`Vehicle plate "${plate}" already exists`);
    this.name = "DuplicatePlateError";
  }
}
