import type { VehicleType } from "@frotas/contracts";

// PT-BR labels for the wire enums (code stays EN; only the UI string is PT).
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: "Carro",
  motorcycle: "Moto",
  truck: "Caminhão",
  van: "Van",
  bus: "Ônibus",
  pickup: "Caminhonete",
  machine: "Máquina",
  other: "Outro",
};

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  available: "Disponível",
  in_use: "Em uso",
  reserved: "Reservado",
  in_maintenance: "Em manutenção",
  in_repair: "Em conserto",
  inactive: "Inativo",
};

export function vehicleTypeLabel(type: string): string {
  return VEHICLE_TYPE_LABELS[type as VehicleType] ?? type;
}

export function vehicleStatusLabel(status: string): string {
  return VEHICLE_STATUS_LABELS[status] ?? status;
}
