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
import { getVehicle } from "@/lib/vehicles";
import { vehicleStatusLabel, vehicleTypeLabel } from "@/lib/labels";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success";

// PT label only in the UI; wire status stays EN (idioma por camada).
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  available: "success",
  in_use: "default",
  reserved: "outline",
  in_maintenance: "destructive",
  in_repair: "destructive",
  inactive: "secondary",
};

// Server component: vehicle detail.
export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  const rows: [string, React.ReactNode][] = [
    [
      "Placa",
      <span key="plate" className="font-mono">
        {vehicle.plate}
      </span>,
    ],
    ["Modelo", vehicle.model],
    [
      "Ano",
      <span key="year" className="tabular-nums">
        {vehicle.year}
      </span>,
    ],
    ["Tipo", vehicleTypeLabel(vehicle.type)],
    [
      "Quilometragem",
      <span key="km" className="tabular-nums">
        {vehicle.currentMileage.toLocaleString("pt-BR")} km
      </span>,
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
              render={<Link href="/veiculos" />}
            >
              <RiArrowLeftLine />
              Veículos
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-mono text-2xl font-semibold">
                {vehicle.plate}
              </h1>
              <Badge variant={STATUS_VARIANTS[vehicle.status] ?? "outline"}>
                {vehicleStatusLabel(vehicle.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{vehicle.model}</p>
          </div>
          <Button
            variant="outline"
            render={<Link href={`/veiculos/${vehicle.id}/editar`} />}
          >
            <RiEditLine />
            Editar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              {rows.map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{label}</dt>
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
