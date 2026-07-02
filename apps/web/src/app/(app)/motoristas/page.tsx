import { listDrivers } from "@/lib/drivers";
import { listSecretariats } from "@/lib/vehicles";
import { DriversTable } from "./drivers-table";

// Server component: reads the tenant's drivers with the session bearer.
export default async function DriversPage() {
  const [drivers, secretariats] = await Promise.all([
    listDrivers(),
    listSecretariats(),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Motoristas</h1>
        <p className="text-muted-foreground text-sm">
          Motoristas habilitados — CNH, secretaria e veículos autorizados.
        </p>
      </div>
      <DriversTable drivers={drivers} secretariats={secretariats} />
    </div>
  );
}
