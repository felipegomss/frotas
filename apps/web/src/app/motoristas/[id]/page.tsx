import Link from "next/link";
import { getDriver } from "@/lib/drivers";
import { listSecretariats, listVehicles } from "@/lib/vehicles";
import { driverStatusLabel, formatDate } from "@/lib/labels";

// Server component: driver detail (resolves secretariat + authorized vehicles
// to readable labels).
export default async function DriverDetailPage({
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

  const secretariatName = new Map(secretariats.map((s) => [s.id, s.name]));
  const vehiclePlate = new Map(vehicles.map((v) => [v.id, v.plate]));
  const authorized = driver.authorizedVehicleIds
    .map((vid) => vehiclePlate.get(vid) ?? vid)
    .join(", ");

  const rows: [string, string][] = [
    ["Nome", driver.name],
    ["Categoria da CNH", driver.cnhCategory],
    ["Validade da CNH", formatDate(driver.cnhExpiry)],
    ["Secretaria", secretariatName.get(driver.secretariatId) ?? "—"],
    ["Status", driverStatusLabel(driver.status)],
    ["Veículos autorizados", authorized || "Nenhum"],
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/motoristas"
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Voltar
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{driver.name}</h1>
        <Link
          href={`/motoristas/${driver.id}/editar`}
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
