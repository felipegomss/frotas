// Shared result type for the vehicle server actions. Kept out of the "use server"
// module because those may only export async functions.
export type ActionResult = { ok: true } | { ok: false; message: string };
