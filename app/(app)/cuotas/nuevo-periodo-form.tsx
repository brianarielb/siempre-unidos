"use client";

import { useFormState, useFormStatus } from "react-dom";
import { crearPeriodo, type PeriodoFormState } from "./actions";

function BotonCrear() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Guardando..." : "Crear período"}
    </button>
  );
}

const initialState: PeriodoFormState = { error: null };

export function NuevoPeriodoForm() {
  const [state, formAction] = useFormState(crearPeriodo, initialState);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4 md:grid-cols-6" key={state.ok ? Math.random() : "form"}>
      <div className="field">
        <label className="label" htmlFor="anio">Año</label>
        <input id="anio" name="anio" type="number" required className="input" defaultValue={new Date().getFullYear()} />
      </div>
      <div className="field">
        <label className="label" htmlFor="trimestre">Trimestre</label>
        <select id="trimestre" name="trimestre" required className="input" defaultValue="">
          <option value="" disabled>Elegir</option>
          <option value="1">T1</option>
          <option value="2">T2</option>
          <option value="3">T3</option>
          <option value="4">T4</option>
        </select>
      </div>
      <div className="field">
        <label className="label" htmlFor="fecha_desde">Desde</label>
        <input id="fecha_desde" name="fecha_desde" type="date" required className="input" />
      </div>
      <div className="field">
        <label className="label" htmlFor="fecha_hasta">Hasta</label>
        <input id="fecha_hasta" name="fecha_hasta" type="date" required className="input" />
      </div>
      <div className="field">
        <label className="label" htmlFor="valor">Valor ($)</label>
        <input id="valor" name="valor" type="number" step="0.01" required className="input" />
      </div>
      <div className="field justify-end">
        <label className="label opacity-0">.</label>
        <BotonCrear />
      </div>
      <div className="field col-span-2 md:col-span-6">
        <label className="label" htmlFor="observaciones">Observaciones</label>
        <input id="observaciones" name="observaciones" className="input" />
      </div>
      {state.error && <p className="col-span-2 text-sm text-estado-atrasado md:col-span-6">{state.error}</p>}
    </form>
  );
}
