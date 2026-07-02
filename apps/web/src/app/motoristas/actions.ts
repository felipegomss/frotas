"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateDriverRequest } from "@frotas/contracts";
import { ApiError } from "@/lib/api-client";
import { createDriver, deleteDriver, updateDriver } from "@/lib/drivers";
import type { ActionResult } from "./action-result";

// Server-side re-validation of the contract before hitting the API (the client
// also validates with the same Zod schema, but the action never trusts input).
function parse(input: unknown): CreateDriverRequest | null {
  const parsed = CreateDriverRequest.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export async function createDriverAction(
  input: unknown,
): Promise<ActionResult> {
  const data = parse(input);
  if (!data) return { ok: false, message: "Dados inválidos." };
  try {
    await createDriver(data);
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
  revalidatePath("/motoristas");
  redirect("/motoristas");
}

export async function updateDriverAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const data = parse(input);
  if (!data) return { ok: false, message: "Dados inválidos." };
  try {
    await updateDriver(id, data);
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
  revalidatePath("/motoristas");
  revalidatePath(`/motoristas/${id}`);
  redirect(`/motoristas/${id}`);
}

export async function deleteDriverAction(id: string): Promise<ActionResult> {
  try {
    await deleteDriver(id);
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
  revalidatePath("/motoristas");
  return { ok: true };
}
