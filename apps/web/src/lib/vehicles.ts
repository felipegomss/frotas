import type {
  CreateVehicleRequest,
  SecretariatListResponse,
  VehicleDetailListResponse,
  VehicleResponse,
} from "@frotas/contracts";
import { apiFetch } from "./api-client";
import { requireSession } from "./require-session";

// Server-side data access for the vehicle screens. Each call carries the session
// bearer; the API derives the tenant from the signed token (never from the web).

export async function listVehicles(): Promise<VehicleDetailListResponse> {
  const bearer = await requireSession();
  return apiFetch<VehicleDetailListResponse>("/veiculos", { bearer });
}

export async function getVehicle(id: string): Promise<VehicleResponse> {
  const bearer = await requireSession();
  return apiFetch<VehicleResponse>(`/veiculos/${encodeURIComponent(id)}`, {
    bearer,
  });
}

export async function listSecretariats(): Promise<SecretariatListResponse> {
  const bearer = await requireSession();
  return apiFetch<SecretariatListResponse>("/secretarias", { bearer });
}

export async function createVehicle(
  input: CreateVehicleRequest,
): Promise<VehicleResponse> {
  const bearer = await requireSession();
  return apiFetch<VehicleResponse>("/veiculos", {
    method: "POST",
    body: input,
    bearer,
  });
}

export async function updateVehicle(
  id: string,
  input: CreateVehicleRequest,
): Promise<VehicleResponse> {
  const bearer = await requireSession();
  return apiFetch<VehicleResponse>(`/veiculos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
    bearer,
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  const bearer = await requireSession();
  await apiFetch<void>(`/veiculos/${encodeURIComponent(id)}`, {
    method: "DELETE",
    bearer,
  });
}
