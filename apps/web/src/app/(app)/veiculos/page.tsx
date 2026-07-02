import { listVehicles } from "@/lib/vehicles";
import { VehiclesTable } from "./vehicles-table";

// Server component: reads the tenant's vehicles with the session bearer.
export default async function VehiclesPage() {
  const vehicles = await listVehicles();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Veículos</h1>
        <p className="text-muted-foreground text-sm">
          Frota da prefeitura — cadastro, status e quilometragem.
        </p>
      </div>
      <VehiclesTable vehicles={vehicles} />
    </div>
  );
}
