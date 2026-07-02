import Link from "next/link";
import type { CreateDriverRequest } from "@frotas/contracts";
import { getDriver } from "@/lib/drivers";
import { listSecretariats, listVehicles } from "@/lib/vehicles";
import { updateDriverAction } from "../../actions";
import { DriverForm } from "../../driver-form";

// Server component: loads the driver + secretariats + vehicles, then renders the
// form with an update action bound to this id.
export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [driver, secretariats, vehicles] = await Promise.all([
    getDriver(id),
    listSecretariats(),
    listVehicles(),
  ]);

  const defaultValues: Partial<CreateDriverRequest> = {
    name: driver.name,
    cnhCategory: driver.cnhCategory,
    cnhExpiry: driver.cnhExpiry,
    secretariatId: driver.secretariatId,
    status: driver.status === "inactive" ? "inactive" : "active",
    authorizedVehicleIds: driver.authorizedVehicleIds,
  };

  return (
    <div className="space-y-4">
      <Link
        href={`/motoristas/${id}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Voltar
      </Link>
      <h1 className="text-xl font-semibold">Editar motorista</h1>
      <DriverForm
        secretariats={secretariats}
        vehicles={vehicles}
        action={updateDriverAction.bind(null, id)}
        submitLabel="Salvar alterações"
        defaultValues={defaultValues}
      />
    </div>
  );
}
