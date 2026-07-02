import Link from "next/link";
import { listDrivers } from "@/lib/drivers";
import { listSecretariats } from "@/lib/vehicles";
import { driverStatusLabel, formatDate } from "@/lib/labels";
import { deleteDriverAction } from "./actions";
import { DeleteDriverButton } from "./delete-driver-button";

// Server component: reads the tenant's drivers with the session bearer.
export default async function DriversPage() {
  const [drivers, secretariats] = await Promise.all([
    listDrivers(),
    listSecretariats(),
  ]);
  const secretariatName = new Map(secretariats.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Motoristas</h1>
        <Link
          href="/motoristas/novo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Novo motorista
        </Link>
      </div>

      {drivers.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
          Nenhum motorista cadastrado ainda.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2 pr-4 font-medium">Nome</th>
              <th className="py-2 pr-4 font-medium">CNH</th>
              <th className="py-2 pr-4 font-medium">Validade</th>
              <th className="py-2 pr-4 font-medium">Secretaria</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pl-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-b border-zinc-100">
                <td className="py-2 pr-4 font-medium">
                  <Link
                    href={`/motoristas/${d.id}`}
                    className="hover:underline"
                  >
                    {d.name}
                  </Link>
                </td>
                <td className="py-2 pr-4">{d.cnhCategory}</td>
                <td className="py-2 pr-4 tabular-nums">
                  {formatDate(d.cnhExpiry)}
                </td>
                <td className="py-2 pr-4">
                  {secretariatName.get(d.secretariatId) ?? "—"}
                </td>
                <td className="py-2 pr-4">{driverStatusLabel(d.status)}</td>
                <td className="py-2 pl-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/motoristas/${d.id}/editar`}
                      className="text-sm text-zinc-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteDriverButton
                      name={d.name}
                      action={deleteDriverAction.bind(null, d.id)}
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
