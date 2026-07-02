import Link from "next/link";
import { getVehicle } from "@/lib/vehicles";
import { vehicleStatusLabel, vehicleTypeLabel } from "@/lib/labels";

// Server component: vehicle detail.
export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  const rows: [string, string][] = [
    ["Placa", vehicle.plate],
    ["Modelo", vehicle.model],
    ["Ano", String(vehicle.year)],
    ["Tipo", vehicleTypeLabel(vehicle.type)],
    ["Status", vehicleStatusLabel(vehicle.status)],
    ["Quilometragem", vehicle.currentMileage.toLocaleString("pt-BR")],
  ];

  return (
    <div className="space-y-4">
      <Link href="/veiculos" className="text-sm text-zinc-500 hover:underline">
        ← Voltar
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{vehicle.plate}</h1>
        <Link
          href={`/veiculos/${vehicle.id}/editar`}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
        >
          Editar
        </Link>
      </div>

      <dl className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
