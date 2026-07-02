export type CnhCategory =
  "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE";

export const CNH_CATEGORIES: readonly CnhCategory[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "AB",
  "AC",
  "AD",
  "AE",
];

export type DriverStatus = "active" | "inactive";

export const DRIVER_STATUSES: readonly DriverStatus[] = ["active", "inactive"];
