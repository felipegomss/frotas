"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateVehicleRequest } from "@frotas/contracts";
import { ApiError } from "@/lib/api-client";
import {
  createVehicle,
  deleteVehicle,
  updateVehicle,
} from "@/lib/vehicles";
import type { ActionResult } from "./action-result";

// Server-side re-validation of the contract before hitting the API (the client
// also validates with the same Zod schema, but the action never trusts input).
function parse(input: unknown): CreateVehicleRequest | null {
  const parsed = CreateVehicleRequest.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export async function createVehicleAction(input: unknown): Promise<ActionResult> {
  const data = parse(input);
  if (!data) return { ok: false, message: "Dados inválidos." };
  try {
    await createVehicle(data);
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
  revalidatePath("/veiculos");
  redirect("/veiculos");
}

export async function updateVehicleAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const data = parse(input);
  if (!data) return { ok: false, message: "Dados inválidos." };
  try {
    await updateVehicle(id, data);
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
  revalidatePath("/veiculos");
  revalidatePath(`/veiculos/${id}`);
  redirect(`/veiculos/${id}`);
}

export async function deleteVehicleAction(id: string): Promise<ActionResult> {
  try {
    await deleteVehicle(id);
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
  revalidatePath("/veiculos");
  return { ok: true };
}
