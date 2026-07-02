import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import type { CreateDriverRequest } from "@frotas/contracts";
import { Button } from "@frotas/ui/components/button";
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
    <div className="mx-auto w-full max-w-2xl">
      <div className="grid gap-6">
        <div className="grid gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2.5 w-fit text-muted-foreground"
            render={<Link href={`/motoristas/${id}`} />}
          >
            <RiArrowLeftLine />
            {driver.name}
          </Button>
          <h1 className="font-heading text-2xl font-semibold">
            Editar motorista
          </h1>
          <p className="text-muted-foreground text-sm">
            Atualize os dados de {driver.name}.
          </p>
        </div>
        <DriverForm
          secretariats={secretariats}
          vehicles={vehicles}
          action={updateDriverAction.bind(null, id)}
          submitLabel="Salvar alterações"
          defaultValues={defaultValues}
        />
      </div>
    </div>
  );
}
