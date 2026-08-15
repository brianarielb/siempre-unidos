"use client";

import { useFormState, useFormStatus } from "react-dom";
import { actualizarTamanioPagina } from "./actions";

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </button>
  );
}

export function ConfiguracionGeneralSection({ tamanioPaginaActual }: { tamanioPaginaActual: number }) {
  const [state, formAction] = useFormState(actualizarTamanioPagina, { error: null });

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-600">General</h2>
      <p className="mb-4 text-sm text-ink-600">
        Cantidad de registros que se muestran por página en los listados de Socios y Pagos.
      </p>
      <form action={formAction} className="flex items-end gap-3">
        <div className="field w-40">
          <label className="label" htmlFor="tamanio_pagina">Registros por página</label>
          <input
            id="tamanio_pagina"
            name="tamanio_pagina"
            type="number"
            min={5}
            max={500}
            className="input"
            defaultValue={tamanioPaginaActual}
          />
        </div>
        <BotonGuardar />
      </form>
      {state.error && <p className="mt-2 text-sm text-estado-atrasado">{state.error}</p>}
    </div>
  );
}
