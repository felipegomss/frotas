"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateVehicleRequest,
  VehicleType,
  type SecretariatResponse,
} from "@frotas/contracts";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";
import type { ActionResult } from "./action-result";

type FormValues = CreateVehicleRequest;

interface VehicleFormProps {
  secretariats: SecretariatResponse[];
  action: (input: FormValues) => Promise<ActionResult>;
  submitLabel: string;
  defaultValues?: Partial<FormValues>;
}

const fieldClass =
  "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";
const labelClass = "block text-sm font-medium text-zinc-700";
const errorClass = "mt-1 text-sm text-red-600";

export function VehicleForm({
  secretariats,
  action,
  submitLabel,
  defaultValues,
}: VehicleFormProps) {
  const {
    register,
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
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <label className={labelClass} htmlFor="plate">
          Placa
        </label>
        <input id="plate" className={fieldClass} {...register("plate")} />
        {errors.plate && <p className={errorClass}>Placa inválida.</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="model">
          Modelo
        </label>
        <input id="model" className={fieldClass} {...register("model")} />
        {errors.model && <p className={errorClass}>Informe o modelo.</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className={labelClass} htmlFor="year">
            Ano
          </label>
          <input
            id="year"
            type="number"
            className={fieldClass}
            {...register("year", { valueAsNumber: true })}
          />
          {errors.year && <p className={errorClass}>Ano inválido.</p>}
        </div>
        <div className="flex-1">
          <label className={labelClass} htmlFor="currentMileage">
            Quilometragem
          </label>
          <input
            id="currentMileage"
            type="number"
            className={fieldClass}
            {...register("currentMileage", { valueAsNumber: true })}
          />
          {errors.currentMileage && (
            <p className={errorClass}>Quilometragem inválida.</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className={labelClass} htmlFor="type">
            Tipo
          </label>
          <select id="type" className={fieldClass} {...register("type")}>
            <option value="">Selecione…</option>
            {VehicleType.options.map((type) => (
              <option key={type} value={type}>
                {VEHICLE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {errors.type && <p className={errorClass}>Selecione o tipo.</p>}
        </div>
        <div className="flex-1">
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select id="status" className={fieldClass} {...register("status")}>
            <option value="available">Disponível</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="secretariatId">
          Secretaria
        </label>
        <select
          id="secretariatId"
          className={fieldClass}
          {...register("secretariatId")}
        >
          <option value="">Selecione…</option>
          {secretariats.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.secretariatId && (
          <p className={errorClass}>Selecione a secretaria.</p>
        )}
      </div>

      {formError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
