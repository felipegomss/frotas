import {
  CNH_CATEGORIES,
  DRIVER_STATUSES,
  type CnhCategory,
  type DriverStatus,
} from "./driver.type.js";

// CNH expiry travels as a plain calendar date (YYYY-MM-DD); no time, no timezone.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DriverAttributes {
  name: string;
  cnhCategory: CnhCategory;
  cnhExpiry: string;
  secretariatId: string;
  authorizedVehicleIds?: string[];
  status?: DriverStatus;
}

export type DriverUpdateAttributes = DriverAttributes;

export class Driver {
  public readonly id: string;
  public name: string;
  public cnhCategory: CnhCategory;
  public cnhExpiry: string;
  public secretariatId: string;
  public status: DriverStatus;
  public authorizedVehicleIds: string[];

  constructor(id: string, attrs: DriverAttributes) {
    this.id = id;
    this.name = Driver.validateName(attrs.name);
    this.cnhCategory = Driver.validateCategory(attrs.cnhCategory);
    this.cnhExpiry = Driver.validateExpiry(attrs.cnhExpiry);
    this.secretariatId = attrs.secretariatId;
    this.status = Driver.validateStatus(attrs.status ?? "active");
    this.authorizedVehicleIds = Driver.normalizeVehicleIds(
      attrs.authorizedVehicleIds ?? [],
    );
  }

  /** Edits attributes owned by this CRUD; the authorized set is replaced wholesale. */
  update(attrs: Partial<DriverUpdateAttributes>): void {
    if (attrs.name !== undefined) this.name = Driver.validateName(attrs.name);
    if (attrs.cnhCategory !== undefined)
      this.cnhCategory = Driver.validateCategory(attrs.cnhCategory);
    if (attrs.cnhExpiry !== undefined)
      this.cnhExpiry = Driver.validateExpiry(attrs.cnhExpiry);
    if (attrs.secretariatId !== undefined)
      this.secretariatId = attrs.secretariatId;
    if (attrs.status !== undefined)
      this.status = Driver.validateStatus(attrs.status);
    if (attrs.authorizedVehicleIds !== undefined)
      this.authorizedVehicleIds = Driver.normalizeVehicleIds(
        attrs.authorizedVehicleIds,
      );
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Driver name cannot be empty");
    }
    return trimmed;
  }

  private static validateCategory(category: CnhCategory): CnhCategory {
    if (!CNH_CATEGORIES.includes(category)) {
      throw new Error(`Invalid CNH category: "${category}"`);
    }
    return category;
  }

  private static validateExpiry(expiry: string): string {
    if (!DATE_PATTERN.test(expiry)) {
      throw new Error(`Invalid CNH expiry: "${expiry}"`);
    }
    // Reject impossible calendar dates (e.g. 2027-02-31) that pass the regex.
    const year = Number(expiry.slice(0, 4));
    const month = Number(expiry.slice(5, 7));
    const day = Number(expiry.slice(8, 10));
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new Error(`Invalid CNH expiry: "${expiry}"`);
    }
    return expiry;
  }

  private static validateStatus(status: DriverStatus): DriverStatus {
    if (!DRIVER_STATUSES.includes(status)) {
      throw new Error(`Invalid driver status: "${status}"`);
    }
    return status;
  }

  private static normalizeVehicleIds(ids: string[]): string[] {
    return [...new Set(ids)];
  }
}
