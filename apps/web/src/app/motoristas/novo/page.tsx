import Link from "next/link";
import { listSecretariats, listVehicles } from "@/lib/vehicles";
import { createDriverAction } from "../actions";
import { DriverForm } from "../driver-form";

// Server component: loads secretariats + vehicles, then renders the client form.
export default async function NewDriverPage() {
  const [secretariats, vehicles] = await Promise.all([
    listSecretariats(),
    listVehicles(),
  ]);

  return (
    <div className="space-y-4">
      <Link
        href="/motoristas"
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Voltar
      </Link>
      <h1 className="text-xl font-semibold">Novo motorista</h1>
      <DriverForm
        secretariats={secretariats}
        vehicles={vehicles}
        action={createDriverAction}
        submitLabel="Criar motorista"
      />
    </div>
  );
}
