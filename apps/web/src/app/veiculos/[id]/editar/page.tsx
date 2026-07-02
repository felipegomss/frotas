import Link from "next/link";
import type { CreateVehicleRequest } from "@frotas/contracts";
import { getVehicle, listSecretariats } from "@/lib/vehicles";
import { updateVehicleAction } from "../../actions";
import { VehicleForm } from "../../vehicle-form";

// Server component: loads the vehicle + secretariats, then renders the form with
// an update action bound to this id.
export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, secretariats] = await Promise.all([
    getVehicle(id),
    listSecretariats(),
  ]);

  const defaultValues: Partial<CreateVehicleRequest> = {
    plate: vehicle.plate,
    model: vehicle.model,
    year: vehicle.year,
    type: vehicle.type,
    secretariatId: vehicle.secretariatId,
    currentMileage: vehicle.currentMileage,
    status: vehicle.status === "inactive" ? "inactive" : "available",
  };

  return (
    <div className="space-y-4">
      <Link
        href={`/veiculos/${id}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Voltar
      </Link>
      <h1 className="text-xl font-semibold">Editar veículo</h1>
      <VehicleForm
        secretariats={secretariats}
        action={updateVehicleAction.bind(null, id)}
        submitLabel="Salvar alterações"
        defaultValues={defaultValues}
      />
    </div>
  );
}
