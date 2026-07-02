"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { DriverResponse, SecretariatResponse } from "@frotas/contracts";
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
  RiDeleteBinLine,
  RiEditLine,
  RiErrorWarningLine,
  RiExpandUpDownLine,
  RiEyeLine,
  RiMore2Line,
  RiSearchLine,
  RiSteering2Line,
} from "@remixicon/react";
import { Alert, AlertDescription } from "@frotas/ui/components/alert";
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
import { cn } from "@frotas/ui/lib/utils";
import { driverStatusLabel, formatDate } from "@/lib/labels";
import { deleteDriverAction } from "./actions";

// A CNH expiry is a plain YYYY-MM-DD; compare lexicographically with today.
function isCnhExpired(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate < today;
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
    <Button variant="ghost" size="sm" className={className} onClick={onToggle}>
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

export function DriversTable({
  drivers,
  secretariats,
}: {
  drivers: DriverResponse[];
  secretariats: SecretariatResponse[];
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DriverResponse | null>(null);

  const secretariatName = new Map(secretariats.map((s) => [s.id, s.name]));

  const columns: ColumnDef<DriverResponse>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader
          label="Nome"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-2.5"
        />
      ),
      cell: ({ row }) => (
        <Link
          href={`/motoristas/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "cnhCategory",
      header: "CNH",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.cnhCategory}
        </Badge>
      ),
    },
    {
      accessorKey: "cnhExpiry",
      header: ({ column }) => (
        <SortableHeader
          label="Validade"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-2.5"
        />
      ),
      cell: ({ row }) => {
        const expired = isCnhExpired(row.original.cnhExpiry);
        return (
          <span
            className={cn(
              "tabular-nums",
              expired && "font-medium text-destructive",
            )}
          >
            {formatDate(row.original.cnhExpiry)}
            {expired && " (vencida)"}
          </span>
        );
      },
    },
    {
      id: "secretariat",
      accessorFn: (row) => secretariatName.get(row.secretariatId) ?? "—",
      header: "Secretaria",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "success" : "secondary"}
        >
          {driverStatusLabel(row.original.status)}
        </Badge>
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
                  aria-label={`Ações do motorista ${row.original.name}`}
                  variant="ghost"
                  size="icon-sm"
                />
              }
            >
              <RiMore2Line />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link href={`/motoristas/${row.original.id}`} />}
              >
                <RiEyeLine />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <Link href={`/motoristas/${row.original.id}/editar`} />
                }
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
    data: drivers,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (drivers.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiSteering2Line />
          </EmptyMedia>
          <EmptyTitle>Nenhum motorista cadastrado</EmptyTitle>
          <EmptyDescription>
            Cadastre o primeiro motorista da frota para começar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/motoristas/novo" />}>
            <RiAddLine />
            Novo motorista
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
            aria-label="Buscar motoristas"
            placeholder="Buscar por nome, secretaria…"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>
        <span className="ml-auto hidden text-muted-foreground text-sm md:block">
          {table.getFilteredRowModel().rows.length} de {drivers.length}{" "}
          motoristas
        </span>
        <Button render={<Link href="/motoristas/novo" />}>
          <RiAddLine />
          Novo motorista
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
                  Nenhum motorista corresponde à busca.
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

      <DeleteDriverDialog
        driver={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DeleteDriverDialog({
  driver,
  onClose,
}: {
  driver: DriverResponse | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    if (!driver) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteDriverAction(driver.id);
      if (result && !result.ok) {
        setError(result.message);
        return;
      }
      onClose();
    });
  }

  return (
    <AlertDialog
      open={!!driver}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir motorista</AlertDialogTitle>
          <AlertDialogDescription>
            O motorista{" "}
            <span className="font-medium">{driver?.name}</span> será removido.
            Essa ação não pode ser desfeita.
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
