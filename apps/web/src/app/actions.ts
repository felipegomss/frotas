"use server";

import { redirect } from "next/navigation";
import { clearSession } from "@/lib/session";

/** Clears the session cookie and returns to the login page. */
export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
