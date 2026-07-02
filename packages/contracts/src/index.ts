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
