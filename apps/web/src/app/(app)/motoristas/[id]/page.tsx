import Link from "next/link";
import { RiArrowLeftLine, RiEditLine } from "@remixicon/react";
import { Badge } from "@frotas/ui/components/badge";
import { Button } from "@frotas/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@frotas/ui/components/card";
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
  const authorized = driver.authorizedVehicleIds.map(
    (vid) => vehiclePlate.get(vid) ?? vid,
  );

  const rows: [string, React.ReactNode][] = [
    ["Nome", driver.name],
    [
      "Categoria da CNH",
      <Badge key="cnh" variant="outline" className="font-mono">
        {driver.cnhCategory}
      </Badge>,
    ],
    [
      "Validade da CNH",
      <span key="expiry" className="tabular-nums">
        {formatDate(driver.cnhExpiry)}
      </span>,
    ],
    ["Secretaria", secretariatName.get(driver.secretariatId) ?? "—"],
    [
      "Veículos autorizados",
      authorized.length === 0 ? (
        "Nenhum"
      ) : (
        <span key="vehicles" className="flex flex-wrap justify-end gap-1">
          {authorized.map((plate) => (
            <Badge key={plate} variant="secondary" className="font-mono">
              {plate}
            </Badge>
          ))}
        </span>
      ),
    ],
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
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
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold">
                {driver.name}
              </h1>
              <Badge
                variant={driver.status === "active" ? "success" : "secondary"}
              >
                {driverStatusLabel(driver.status)}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            render={<Link href={`/motoristas/${driver.id}/editar`} />}
          >
            <RiEditLine />
            Editar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do motorista</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              {rows.map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <dt className="shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
