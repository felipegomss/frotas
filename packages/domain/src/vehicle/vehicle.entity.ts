export type VehicleStatus =
  | "available"
  | "in_use"
  | "reserved"
  | "in_maintenance"
  | "in_repair"
  | "inactive";

export class Vehicle {
  constructor(
    public readonly id: string,
    public plate: string,
    public status: VehicleStatus,
    public currentMileage: number,
  ) {}
  registerMileage(mileage: number): void {
    if (mileage < this.currentMileage)
      throw new Error("Mileage cannot decrease");
    this.currentMileage = mileage;
  }
}
