"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateVehicleRequest,
  VehicleType,
  type SecretariatResponse,
} from "@frotas/contracts";
import { RiErrorWarningLine } from "@remixicon/react";
import { Alert, AlertDescription } from "@frotas/ui/components/alert";
import { Button } from "@frotas/ui/components/button";
import { Card, CardContent } from "@frotas/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@frotas/ui/components/field";
import { Input } from "@frotas/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frotas/ui/components/select";
import { VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS } from "@/lib/labels";
import type { ActionResult } from "./action-result";

type FormValues = CreateVehicleRequest;

interface VehicleFormProps {
  secretariats: SecretariatResponse[];
  action: (input: FormValues) => Promise<ActionResult>;
  submitLabel: string;
  defaultValues?: Partial<FormValues>;
}

export function VehicleForm({
  secretariats,
  action,
  submitLabel,
  defaultValues,
}: VehicleFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateVehicleRequest),
    defaultValues: {
      status: "available",
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
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.plate || undefined}>
                <FieldLabel htmlFor="plate">Placa</FieldLabel>
                <Input
                  id="plate"
                  placeholder="AAA0A00"
                  aria-invalid={!!errors.plate}
                  className="font-mono uppercase"
                  {...register("plate")}
                />
                <FieldError
                  errors={errors.plate && [{ message: "Placa inválida." }]}
                />
              </Field>
              <Field data-invalid={!!errors.model || undefined}>
                <FieldLabel htmlFor="model">Modelo</FieldLabel>
                <Input
                  id="model"
                  placeholder="Ex.: Fiat Strada"
                  aria-invalid={!!errors.model}
                  {...register("model")}
                />
                <FieldError
                  errors={errors.model && [{ message: "Informe o modelo." }]}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.year || undefined}>
                <FieldLabel htmlFor="year">Ano</FieldLabel>
                <Input
                  id="year"
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.year}
                  {...register("year", { valueAsNumber: true })}
                />
                <FieldError
                  errors={errors.year && [{ message: "Ano inválido." }]}
                />
              </Field>
              <Field data-invalid={!!errors.currentMileage || undefined}>
                <FieldLabel htmlFor="currentMileage">
                  Quilometragem (km)
                </FieldLabel>
                <Input
                  id="currentMileage"
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.currentMileage}
                  {...register("currentMileage", { valueAsNumber: true })}
                />
                <FieldError
                  errors={
                    errors.currentMileage && [
                      { message: "Quilometragem inválida." },
                    ]
                  }
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.type || undefined}>
                <FieldLabel htmlFor="type">Tipo</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? null}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="type"
                        aria-invalid={!!errors.type}
                        className="w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue>
                          {(value: unknown) =>
                            value
                              ? VEHICLE_TYPE_LABELS[value as VehicleType]
                              : "Selecione…"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {VehicleType.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {VEHICLE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError
                  errors={errors.type && [{ message: "Selecione o tipo." }]}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "available"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="status"
                        className="w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue>
                          {(value: unknown) =>
                            VEHICLE_STATUS_LABELS[String(value)] ?? "Selecione…"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">
                          {VEHICLE_STATUS_LABELS.available}
                        </SelectItem>
                        <SelectItem value="inactive">
                          {VEHICLE_STATUS_LABELS.inactive}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

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
