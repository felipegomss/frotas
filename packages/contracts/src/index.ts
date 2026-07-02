import { z } from "zod";
// Shared contract used by api, web and mobile.
export const CreateUsageOrder = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  destination: z.string().min(1),
  purpose: z.string().min(1),
  startMileage: z.number().int().nonnegative(),
});
export type CreateUsageOrder = z.infer<typeof CreateUsageOrder>;

// --- Auth / session (M0-F01, ADR 0010) ------------------------------------

// Body of POST /sessao. The identity comes from the IdP token in the
// Authorization header; only the chosen tenant travels in the body.
export const StartSessionRequest = z.object({
  tenantId: z.string().uuid(),
});
export type StartSessionRequest = z.infer<typeof StartSessionRequest>;

// A prefecture the identity may act in (an active membership).
export const Prefecture = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  role: z.string(),
});
export type Prefecture = z.infer<typeof Prefecture>;

// GET /sessao/prefeituras — prefectures available for selection.
export const PrefecturesResponse = z.array(Prefecture);
export type PrefecturesResponse = z.infer<typeof PrefecturesResponse>;

// POST /sessao — the API-signed session token plus the active tenant.
export const SessionResponse = z.object({
  token: z.string(),
  tenant: Prefecture.pick({ id: true, slug: true, name: true }),
  role: z.string(),
});
export type SessionResponse = z.infer<typeof SessionResponse>;

// --- Fleet (M0-F01 read path) ---------------------------------------------

export const VehicleListItem = z.object({
  id: z.string().uuid(),
  plate: z.string(),
  status: z.string(),
  currentMileage: z.number().int().nonnegative(),
});
export type VehicleListItem = z.infer<typeof VehicleListItem>;

// --- Secretariats (M0-F03) -------------------------------------------------

// Body of POST /secretarias and PUT /secretarias/:id.
export const CreateSecretariatRequest = z.object({
  name: z.string().trim().min(1),
});
export type CreateSecretariatRequest = z.infer<typeof CreateSecretariatRequest>;

export const UpdateSecretariatRequest = CreateSecretariatRequest;
export type UpdateSecretariatRequest = z.infer<typeof UpdateSecretariatRequest>;

export const SecretariatResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type SecretariatResponse = z.infer<typeof SecretariatResponse>;

export const SecretariatListResponse = z.array(SecretariatResponse);
export type SecretariatListResponse = z.infer<typeof SecretariatListResponse>;

// --- Vehicles (M0-F04) ------------------------------------------------------

// Matches both the old plate format (AAA9999) and Mercosul (AAA9A99).
const PLATE_REGEX = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/;

export const VehicleType = z.enum([
  "car",
  "motorcycle",
  "truck",
  "van",
  "bus",
  "pickup",
  "machine",
  "other",
]);
export type VehicleType = z.infer<typeof VehicleType>;

// Status assignable by this CRUD. Operational statuses (in_use, reserved,
// in_maintenance, in_repair) are set by other modules (M0-F06+), not here.
export const VehicleAdministrativeStatus = z.enum(["available", "inactive"]);
export type VehicleAdministrativeStatus = z.infer<
  typeof VehicleAdministrativeStatus
>;

// Body of POST /veiculos and PUT /veiculos/:id (full replace).
export const CreateVehicleRequest = z.object({
  plate: z.string().trim().toUpperCase().regex(PLATE_REGEX, "Placa inválida"),
  model: z.string().trim().min(1),
  year: z.number().int().min(1900).max(2100),
  type: VehicleType,
  secretariatId: z.string().uuid(),
  currentMileage: z.number().int().nonnegative(),
  status: VehicleAdministrativeStatus.optional(),
});
export type CreateVehicleRequest = z.infer<typeof CreateVehicleRequest>;

export const UpdateVehicleRequest = CreateVehicleRequest;
export type UpdateVehicleRequest = z.infer<typeof UpdateVehicleRequest>;

export const VehicleResponse = z.object({
  id: z.string().uuid(),
  plate: z.string(),
  model: z.string(),
  year: z.number().int(),
  type: VehicleType,
  secretariatId: z.string().uuid(),
  status: z.string(),
  currentMileage: z.number().int().nonnegative(),
});
export type VehicleResponse = z.infer<typeof VehicleResponse>;

export const VehicleDetailListResponse = z.array(VehicleResponse);
export type VehicleDetailListResponse = z.infer<
  typeof VehicleDetailListResponse
>;
