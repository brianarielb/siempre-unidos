"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { formatearImporte } from "@/lib/utils";
import { actualizarValorPeriodo, type PeriodoFormState } from "./actions";

const initialState: PeriodoFormState = { error: null };

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="text-xs font-medium text-brand hover:underline" disabled={pending}>
      {pending ? "..." : "Guardar"}
    </button>
  );
}

export function EditarValorPeriodo({
  periodoId,
  valorActual,
  bloqueado,
}: {
  periodoId: string;
  valorActual: number;
  bloqueado: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [state, formAction] = useFormState(actualizarValorPeriodo, initialState);

  if (bloqueado) {
    return (
      <span className="inline-flex items-center gap-1">
        {formatearImporte(valorActual)}
        <span className="text-xs text-ink-400" title="Ya tiene pagos registrados; el valor no puede modificarse">
          🔒
        </span>
      </span>
    );
  }

  if (!editando) {
    return (
      <button
        className="inline-flex items-center gap-2 text-left hover:underline"
        onClick={() => setEditando(true)}
      >
        {formatearImporte(valorActual)}
        <span className="text-xs text-ink-400">editar</span>
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={periodoId} />
      <input
        type="number"
        step="0.01"
        name="valor"
        defaultValue={valorActual}
        className="input w-28 py-1"
        autoFocus
      />
      <BotonGuardar />
      <button type="button" className="text-xs text-ink-400" onClick={() => setEditando(false)}>
        Cancelar
      </button>
      {state.error && <span className="text-xs text-estado-atrasado">{state.error}</span>}
    </form>
  );
}
