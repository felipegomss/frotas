"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CnhCategory,
  CreateDriverRequest,
  type SecretariatResponse,
  type VehicleResponse,
} from "@frotas/contracts";
import { RiErrorWarningLine } from "@remixicon/react";
import { Alert, AlertDescription } from "@frotas/ui/components/alert";
import { Button } from "@frotas/ui/components/button";
import { Card, CardContent } from "@frotas/ui/components/card";
import { Checkbox } from "@frotas/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@frotas/ui/components/field";
import { Input } from "@frotas/ui/components/input";
import { Label } from "@frotas/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frotas/ui/components/select";
import { DRIVER_STATUS_LABELS } from "@/lib/labels";
import type { ActionResult } from "./action-result";

// `authorizedVehicleIds` defaults to [] in the contract, so the parsed output
// differs from the form input — use both types with the RHF transform generics.
type FormInput = z.input<typeof CreateDriverRequest>;
type FormOutput = z.output<typeof CreateDriverRequest>;

interface DriverFormProps {
  secretariats: SecretariatResponse[];
  vehicles: VehicleResponse[];
  action: (input: FormOutput) => Promise<ActionResult>;
  submitLabel: string;
  defaultValues?: Partial<FormInput>;
}

export function DriverForm({
  secretariats,
  vehicles,
  action,
  submitLabel,
  defaultValues,
}: DriverFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(CreateDriverRequest),
    defaultValues: {
      status: "active",
      authorizedVehicleIds: [],
      ...defaultValues,
    },
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await action(values);
      // On success the action redirects; only an error object comes back here.
      if (result && !result.ok) setFormError(result.message);
    });
  });

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-5">
            <Field data-invalid={!!errors.name || undefined}>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                placeholder="Nome completo"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError
                errors={errors.name && [{ message: "Informe o nome." }]}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.cnhCategory || undefined}>
                <FieldLabel htmlFor="cnhCategory">Categoria da CNH</FieldLabel>
                <Controller
                  control={control}
                  name="cnhCategory"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? null}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="cnhCategory"
                        aria-invalid={!!errors.cnhCategory}
                        className="w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue>
                          {(value: unknown) =>
                            value ? String(value) : "Selecione…"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CnhCategory.options.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError
                  errors={
                    errors.cnhCategory && [
                      { message: "Selecione a categoria." },
                    ]
                  }
                />
              </Field>
              <Field data-invalid={!!errors.cnhExpiry || undefined}>
                <FieldLabel htmlFor="cnhExpiry">Validade da CNH</FieldLabel>
                <Input
                  id="cnhExpiry"
                  type="date"
                  aria-invalid={!!errors.cnhExpiry}
                  {...register("cnhExpiry")}
                />
                <FieldError
                  errors={errors.cnhExpiry && [{ message: "Data inválida." }]}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.secretariatId || undefined}>
                <FieldLabel htmlFor="secretariatId">Secretaria</FieldLabel>
                <Controller
                  control={control}
                  name="secretariatId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? null}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="secretariatId"
                        aria-invalid={!!errors.secretariatId}
                        className="w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue>
                          {(value: unknown) =>
                            secretariats.find((s) => s.id === value)?.name ??
                            "Selecione…"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {secretariats.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError
                  errors={
                    errors.secretariatId && [
                      { message: "Selecione a secretaria." },
                    ]
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "active"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="status"
                        className="w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue>
                          {(value: unknown) =>
                            DRIVER_STATUS_LABELS[String(value)] ?? "Selecione…"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          {DRIVER_STATUS_LABELS.active}
                        </SelectItem>
                        <SelectItem value="inactive">
                          {DRIVER_STATUS_LABELS.inactive}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Veículos autorizados</FieldLabel>
              {vehicles.length === 0 ? (
                <FieldDescription>Nenhum veículo cadastrado.</FieldDescription>
              ) : (
                <Controller
                  control={control}
                  name="authorizedVehicleIds"
                  render={({ field }) => {
                    const selected = field.value ?? [];
                    return (
                      <div className="grid max-h-48 gap-1 overflow-y-auto rounded-md border p-2">
                        {vehicles.map((v) => {
                          const checked = selected.includes(v.id);
                          return (
                            <Label
                              key={v.id}
                              className="flex items-center gap-2 rounded-sm px-1 py-1.5 font-normal hover:bg-muted"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(isChecked) =>
                                  field.onChange(
                                    isChecked
                                      ? [...selected, v.id]
                                      : selected.filter((id) => id !== v.id),
                                  )
                                }
                              />
                              <span className="font-mono">{v.plate}</span>
                              <span className="text-muted-foreground">
                                {v.model}
                              </span>
                            </Label>
                          );
                        })}
                      </div>
                    );
                  }}
                />
              )}
            </Field>

            {formError && (
              <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : submitLabel}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
