import Link from "next/link";
import { listVehicles } from "@/lib/vehicles";
import { vehicleStatusLabel, vehicleTypeLabel } from "@/lib/labels";
import { deleteVehicleAction } from "./actions";
import { DeleteVehicleButton } from "./delete-vehicle-button";

// Server component: reads the tenant's vehicles with the session bearer.
export default async function VehiclesPage() {
  const vehicles = await listVehicles();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Veículos</h1>
        <Link
          href="/veiculos/novo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Novo veículo
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
          Nenhum veículo cadastrado ainda.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2 pr-4 font-medium">Placa</th>
              <th className="py-2 pr-4 font-medium">Modelo</th>
              <th className="py-2 pr-4 font-medium">Ano</th>
              <th className="py-2 pr-4 font-medium">Tipo</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 text-right font-medium tabular-nums">
                Km
              </th>
              <th className="py-2 pl-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-zinc-100">
                <td className="py-2 pr-4 font-medium">
                  <Link href={`/veiculos/${v.id}`} className="hover:underline">
                    {v.plate}
                  </Link>
                </td>
                <td className="py-2 pr-4">{v.model}</td>
                <td className="py-2 pr-4 tabular-nums">{v.year}</td>
                <td className="py-2 pr-4">{vehicleTypeLabel(v.type)}</td>
                <td className="py-2 pr-4">{vehicleStatusLabel(v.status)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {v.currentMileage.toLocaleString("pt-BR")}
                </td>
                <td className="py-2 pl-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/veiculos/${v.id}/editar`}
                      className="text-sm text-zinc-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteVehicleButton
                      plate={v.plate}
                      action={deleteVehicleAction.bind(null, v.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
