"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { VehicleResponse } from "@frotas/contracts";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiCarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiErrorWarningLine,
  RiExpandUpDownLine,
  RiEyeLine,
  RiMore2Line,
  RiSearchLine,
} from "@remixicon/react";
import {
  Alert,
  AlertDescription,
} from "@frotas/ui/components/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@frotas/ui/components/alert-dialog";
import { Badge } from "@frotas/ui/components/badge";
import { Button } from "@frotas/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@frotas/ui/components/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@frotas/ui/components/empty";
import { Input } from "@frotas/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@frotas/ui/components/table";
import { vehicleStatusLabel, vehicleTypeLabel } from "@/lib/labels";
import { deleteVehicleAction } from "./actions";

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

function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] ?? "outline";
}

function SortableHeader({
  label,
  sorted,
  onToggle,
  className,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={onToggle}
    >
      {label}
      {sorted === "asc" ? (
        <RiArrowUpLine />
      ) : sorted === "desc" ? (
        <RiArrowDownLine />
      ) : (
        <RiExpandUpDownLine className="text-muted-foreground" />
      )}
    </Button>
  );
}

export function VehiclesTable({ vehicles }: { vehicles: VehicleResponse[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "plate", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(
    null,
  );

  const columns: ColumnDef<VehicleResponse>[] = [
    {
      accessorKey: "plate",
      header: ({ column }) => (
        <SortableHeader
          label="Placa"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-2.5"
        />
      ),
      cell: ({ row }) => (
        <Link
          href={`/veiculos/${row.original.id}`}
          className="font-medium font-mono hover:underline"
        >
          {row.original.plate}
        </Link>
      ),
    },
    {
      accessorKey: "model",
      header: ({ column }) => (
        <SortableHeader
          label="Modelo"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-2.5"
        />
      ),
    },
    {
      accessorKey: "year",
      header: "Ano",
      cell: ({ row }) => <span className="tabular-nums">{row.original.year}</span>,
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => vehicleTypeLabel(row.original.type),
      filterFn: (row, _id, value: string) =>
        vehicleTypeLabel(row.original.type)
          .toLowerCase()
          .includes(String(value).toLowerCase()),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {vehicleStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "currentMileage",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader
            label="Km"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="-mr-2.5"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.currentMileage.toLocaleString("pt-BR")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={`Ações do veículo ${row.original.plate}`}
                  variant="ghost"
                  size="icon-sm"
                />
              }
            >
              <RiMore2Line />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link href={`/veiculos/${row.original.id}`} />}
              >
                <RiEyeLine />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href={`/veiculos/${row.original.id}/editar`} />}
              >
                <RiEditLine />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <RiDeleteBinLine />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: vehicles,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (vehicles.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiCarLine />
          </EmptyMedia>
          <EmptyTitle>Nenhum veículo cadastrado</EmptyTitle>
          <EmptyDescription>
            Cadastre o primeiro veículo da frota para começar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/veiculos/novo" />}>
            <RiAddLine />
            Novo veículo
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 md:max-w-xs">
          <RiSearchLine className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar veículos"
            placeholder="Buscar por placa, modelo…"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>
        <span className="ml-auto hidden text-muted-foreground text-sm md:block">
          {table.getFilteredRowModel().rows.length} de {vehicles.length}{" "}
          veículos
        </span>
        <Button render={<Link href="/veiculos/novo" />}>
          <RiAddLine />
          Novo veículo
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum veículo corresponde à busca.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteVehicleDialog
        vehicle={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DeleteVehicleDialog({
  vehicle,
  onClose,
}: {
  vehicle: VehicleResponse | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    if (!vehicle) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteVehicleAction(vehicle.id);
      if (result && !result.ok) {
        setError(result.message);
        return;
      }
      onClose();
    });
  }

  return (
    <AlertDialog
      open={!!vehicle}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir veículo</AlertDialogTitle>
          <AlertDialogDescription>
            O veículo <span className="font-mono font-medium">{vehicle?.plate}</span>{" "}
            será removido da frota. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive">
            <RiErrorWarningLine />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={confirmDelete}
          >
            {pending ? "Excluindo…" : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
