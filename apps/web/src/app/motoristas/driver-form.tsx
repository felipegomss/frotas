"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CnhCategory,
  CreateDriverRequest,
  type SecretariatResponse,
  type VehicleResponse,
} from "@frotas/contracts";
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

const fieldClass =
  "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";
const labelClass = "block text-sm font-medium text-zinc-700";
const errorClass = "mt-1 text-sm text-red-600";

export function DriverForm({
  secretariats,
  vehicles,
  action,
  submitLabel,
  defaultValues,
}: DriverFormProps) {
  const {
    register,
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
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <label className={labelClass} htmlFor="name">
          Nome
        </label>
        <input id="name" className={fieldClass} {...register("name")} />
        {errors.name && <p className={errorClass}>Informe o nome.</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className={labelClass} htmlFor="cnhCategory">
            Categoria da CNH
          </label>
          <select
            id="cnhCategory"
            className={fieldClass}
            {...register("cnhCategory")}
          >
            <option value="">Selecione…</option>
            {CnhCategory.options.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.cnhCategory && (
            <p className={errorClass}>Selecione a categoria.</p>
          )}
        </div>
        <div className="flex-1">
          <label className={labelClass} htmlFor="cnhExpiry">
            Validade da CNH
          </label>
          <input
            id="cnhExpiry"
            type="date"
            className={fieldClass}
            {...register("cnhExpiry")}
          />
          {errors.cnhExpiry && <p className={errorClass}>Data inválida.</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
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
        <div className="flex-1">
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select id="status" className={fieldClass} {...register("status")}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Veículos autorizados</legend>
        {vehicles.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-500">
            Nenhum veículo cadastrado.
          </p>
        ) : (
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-2">
            {vehicles.map((v) => (
              <label
                key={v.id}
                className="flex items-center gap-2 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  value={v.id}
                  {...register("authorizedVehicleIds")}
                />
                <span>
                  {v.plate} — {v.model}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

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
