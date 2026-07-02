"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "./action-result";

interface DeleteDriverButtonProps {
  name: string;
  action: () => Promise<ActionResult>;
}

export function DeleteDriverButton({ name, action }: DeleteDriverButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm(`Excluir o motorista ${name}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Excluindo…" : "Excluir"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </>
  );
}
