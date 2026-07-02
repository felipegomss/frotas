import type {
  CreateDriverRequest,
  DriverListResponse,
  DriverResponse,
} from "@frotas/contracts";
import { apiFetch } from "./api-client";
import { requireSession } from "./require-session";

// Server-side data access for the driver screens. Each call carries the session
// bearer; the API derives the tenant from the signed token (never from the web).
// Secretariats and vehicles (for the form dropdowns) are reused from lib/vehicles.

export async function listDrivers(): Promise<DriverListResponse> {
  const bearer = await requireSession();
  return apiFetch<DriverListResponse>("/motoristas", { bearer });
}

export async function getDriver(id: string): Promise<DriverResponse> {
  const bearer = await requireSession();
  return apiFetch<DriverResponse>(`/motoristas/${encodeURIComponent(id)}`, {
    bearer,
  });
}

export async function createDriver(
  input: CreateDriverRequest,
): Promise<DriverResponse> {
  const bearer = await requireSession();
  return apiFetch<DriverResponse>("/motoristas", {
    method: "POST",
    body: input,
    bearer,
  });
}

export async function updateDriver(
  id: string,
  input: CreateDriverRequest,
): Promise<DriverResponse> {
  const bearer = await requireSession();
  return apiFetch<DriverResponse>(`/motoristas/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
    bearer,
  });
}

export async function deleteDriver(id: string): Promise<void> {
  const bearer = await requireSession();
  await apiFetch<void>(`/motoristas/${encodeURIComponent(id)}`, {
    method: "DELETE",
    bearer,
  });
}
