import { VEHICLE_TYPES, type VehicleType } from "./vehicle.type.js";

export type VehicleStatus =
  | "available"
  | "in_use"
  | "reserved"
  | "in_maintenance"
  | "in_repair"
  | "inactive";

const VEHICLE_STATUSES: readonly VehicleStatus[] = [
  "available",
  "in_use",
  "reserved",
  "in_maintenance",
  "in_repair",
  "inactive",
];

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

// Matches both the old plate format (AAA9999) and Mercosul (AAA9A99).
const PLATE_PATTERN = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/;

export interface VehicleAttributes {
  plate: string;
  model: string;
  year: number;
  type: VehicleType;
  secretariatId: string;
  currentMileage: number;
  status?: VehicleStatus;
}

export type VehicleUpdateAttributes = VehicleAttributes;

export class Vehicle {
  public readonly id: string;
  public plate: string;
  public model: string;
  public year: number;
  public type: VehicleType;
  public secretariatId: string;
  public status: VehicleStatus;
  public currentMileage: number;

  constructor(id: string, attrs: VehicleAttributes) {
    this.id = id;
    this.plate = Vehicle.validatePlate(attrs.plate);
    this.model = Vehicle.validateModel(attrs.model);
    this.year = Vehicle.validateYear(attrs.year);
    this.type = Vehicle.validateType(attrs.type);
    this.secretariatId = attrs.secretariatId;
    this.currentMileage = Vehicle.validateMileage(attrs.currentMileage);
    this.status = Vehicle.validateStatus(attrs.status ?? "available");
  }

  /**
   * Edits attributes owned by this CRUD, including an administrative mileage
   * correction (no monotonicity rule — that belongs to `registerMileage`).
   */
  update(attrs: Partial<VehicleUpdateAttributes>): void {
    if (attrs.plate !== undefined)
      this.plate = Vehicle.validatePlate(attrs.plate);
    if (attrs.model !== undefined)
      this.model = Vehicle.validateModel(attrs.model);
    if (attrs.year !== undefined) this.year = Vehicle.validateYear(attrs.year);
    if (attrs.type !== undefined) this.type = Vehicle.validateType(attrs.type);
    if (attrs.secretariatId !== undefined)
      this.secretariatId = attrs.secretariatId;
    if (attrs.status !== undefined)
      this.status = Vehicle.validateStatus(attrs.status);
    if (attrs.currentMileage !== undefined) {
      this.currentMileage = Vehicle.validateMileage(attrs.currentMileage);
    }
  }

  /** Odometer reading from operational modules (usage orders, refuelings): never decreases. */
  registerMileage(mileage: number): void {
    if (mileage < this.currentMileage) {
      throw new Error("Mileage cannot decrease");
    }
    this.currentMileage = mileage;
  }

  /** Normalizes and validates a plate; exposed so callers can compare before mutating. */
  static normalizePlate(plate: string): string {
    return Vehicle.validatePlate(plate);
  }

  private static validatePlate(plate: string): string {
    const normalized = plate.trim().toUpperCase();
    if (!PLATE_PATTERN.test(normalized)) {
      throw new Error(`Invalid plate: "${plate}"`);
    }
    return normalized;
  }

  private static validateModel(model: string): string {
    const trimmed = model.trim();
    if (!trimmed) {
      throw new Error("Vehicle model cannot be empty");
    }
    return trimmed;
  }

  private static validateYear(year: number): number {
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
      throw new Error(`Invalid year: ${year}`);
    }
    return year;
  }

  private static validateType(type: VehicleType): VehicleType {
    if (!VEHICLE_TYPES.includes(type)) {
      throw new Error(`Invalid vehicle type: "${type}"`);
    }
    return type;
  }

  private static validateMileage(mileage: number): number {
    if (!Number.isInteger(mileage) || mileage < 0) {
      throw new Error(`Invalid mileage: ${mileage}`);
    }
    return mileage;
  }

  private static validateStatus(status: VehicleStatus): VehicleStatus {
    if (!VEHICLE_STATUSES.includes(status)) {
      throw new Error(`Invalid vehicle status: "${status}"`);
    }
    return status;
  }
}
