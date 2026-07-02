import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import type { CreateVehicleRequest } from "@frotas/contracts";
import { Button } from "@frotas/ui/components/button";
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
    <div className="mx-auto w-full max-w-2xl">
      <div className="grid gap-6">
        <div className="grid gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2.5 w-fit text-muted-foreground"
            render={<Link href={`/veiculos/${id}`} />}
          >
            <RiArrowLeftLine />
            {vehicle.plate}
          </Button>
          <h1 className="font-heading text-2xl font-semibold">
            Editar veículo
          </h1>
          <p className="text-muted-foreground text-sm">
            Atualize os dados do veículo {vehicle.plate}.
          </p>
        </div>
        <VehicleForm
          secretariats={secretariats}
          action={updateVehicleAction.bind(null, id)}
          submitLabel="Salvar alterações"
          defaultValues={defaultValues}
        />
      </div>
    </div>
  );
}
