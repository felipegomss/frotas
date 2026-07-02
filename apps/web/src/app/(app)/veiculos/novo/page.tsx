import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@frotas/ui/components/button";
import { listSecretariats } from "@/lib/vehicles";
import { createVehicleAction } from "../actions";
import { VehicleForm } from "../vehicle-form";

// Server component: loads the tenant's secretariats, then renders the client form.
export default async function NewVehiclePage() {
  const secretariats = await listSecretariats();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="grid gap-6">
        <div className="grid gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2.5 w-fit text-muted-foreground"
            render={<Link href="/veiculos" />}
          >
            <RiArrowLeftLine />
            Veículos
          </Button>
          <h1 className="font-heading text-2xl font-semibold">Novo veículo</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre um veículo da frota e vincule-o a uma secretaria.
          </p>
        </div>
        <VehicleForm
          secretariats={secretariats}
          action={createVehicleAction}
          submitLabel="Criar veículo"
        />
      </div>
    </div>
  );
}
