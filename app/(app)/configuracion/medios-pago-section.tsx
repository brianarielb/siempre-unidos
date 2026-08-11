"use client";

import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { MedioPago } from "@/lib/types";
import { agregarMedioPago, alternarMedioPago } from "./actions";

function BotonAgregar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Agregando..." : "Agregar"}
    </button>
  );
}

export function MediosPagoSection({ mediosPago }: { mediosPago: MedioPago[] }) {
  const [state, formAction] = useFormState(agregarMedioPago, { error: null });
  const [isPending, startTransition] = useTransition();

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-600">Medios de pago</h2>
      <p className="mb-4 text-sm text-ink-600">
        Se usan al registrar un pago. Podés agregar nuevos o desactivar los que ya no uses.
      </p>

      <ul className="mb-4 flex flex-col divide-y divide-border">
        {mediosPago.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2">
            <span className={m.activo ? "text-ink-900" : "text-ink-400 line-through"}>{m.nombre}</span>
            <button
              className="text-sm text-brand hover:underline disabled:opacity-50"
              disabled={isPending}
              onClick={() => startTransition(() => alternarMedioPago(m.id, !m.activo))}
            >
              {m.activo ? "Desactivar" : "Activar"}
            </button>
          </li>
        ))}
      </ul>

      <form action={formAction} className="flex items-end gap-3">
        <div className="field flex-1">
          <label className="label" htmlFor="nombre">Nuevo medio de pago</label>
          <input id="nombre" name="nombre" className="input" placeholder="Ej: MERCADO PAGO" />
        </div>
        <BotonAgregar />
      </form>
      {state.error && <p className="mt-2 text-sm text-estado-atrasado">{state.error}</p>}
    </div>
  );
}
