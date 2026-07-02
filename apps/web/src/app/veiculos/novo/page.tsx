import Link from "next/link";
import { listSecretariats } from "@/lib/vehicles";
import { createVehicleAction } from "../actions";
import { VehicleForm } from "../vehicle-form";

// Server component: loads the tenant's secretariats, then renders the client form.
export default async function NewVehiclePage() {
  const secretariats = await listSecretariats();

  return (
    <div className="space-y-4">
      <Link href="/veiculos" className="text-sm text-zinc-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="text-xl font-semibold">Novo veículo</h1>
      <VehicleForm
        secretariats={secretariats}
        action={createVehicleAction}
        submitLabel="Criar veículo"
      />
    </div>
  );
}
