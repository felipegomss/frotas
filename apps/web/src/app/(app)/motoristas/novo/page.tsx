import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@frotas/ui/components/button";
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
    <div className="mx-auto w-full max-w-2xl">
      <div className="grid gap-6">
        <div className="grid gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2.5 w-fit text-muted-foreground"
            render={<Link href="/motoristas" />}
          >
            <RiArrowLeftLine />
            Motoristas
          </Button>
          <h1 className="font-heading text-2xl font-semibold">
            Novo motorista
          </h1>
          <p className="text-muted-foreground text-sm">
            Cadastre um motorista, sua CNH e os veículos que pode conduzir.
          </p>
        </div>
        <DriverForm
          secretariats={secretariats}
          vehicles={vehicles}
          action={createDriverAction}
          submitLabel="Criar motorista"
        />
      </div>
    </div>
  );
}
