"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Socio } from "@/lib/types";
import type { SocioFormState } from "@/app/(app)/socios/actions";
import { OPCIONES_ESTADO_CIVIL } from "@/lib/utils";

function BotonGuardar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Guardando..." : label}
    </button>
  );
}

export function SocioForm({
  socio,
  action,
  labelBoton = "Guardar",
  soloLectura = false,
}: {
  socio?: Socio;
  action: (state: SocioFormState, formData: FormData) => Promise<SocioFormState>;
  labelBoton?: string;
  soloLectura?: boolean;
}) {
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset disabled={soloLectura} className="contents">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="field">
          <label className="label" htmlFor="numero_socio">Número de socio *</label>
          <input
            id="numero_socio"
            name="numero_socio"
            type="number"
            required
            className="input"
            defaultValue={socio?.numero_socio}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="dni">DNI *</label>
          <input id="dni" name="dni" required className="input" defaultValue={socio?.dni} />
        </div>
        <div className="field">
          <label className="label" htmlFor="nombre">Nombre *</label>
          <input id="nombre" name="nombre" required className="input" defaultValue={socio?.nombre} />
        </div>
        <div className="field">
          <label className="label" htmlFor="apellido">Apellido *</label>
          <input id="apellido" name="apellido" required className="input" defaultValue={socio?.apellido} />
        </div>
        <div className="field">
          <label className="label" htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            className="input"
            defaultValue={socio?.fecha_nacimiento ?? ""}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="fecha_alta">Fecha de alta</label>
          <input
            id="fecha_alta"
            name="fecha_alta"
            type="date"
            className="input"
            defaultValue={socio?.fecha_alta ?? new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="nacionalidad">Nacionalidad</label>
          <input
            id="nacionalidad"
            name="nacionalidad"
            className="input"
            placeholder="Ej: Argentina"
            defaultValue={socio?.nacionalidad ?? ""}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="estado_civil">Estado civil</label>
          <select
            id="estado_civil"
            name="estado_civil"
            className="input"
            defaultValue={socio?.estado_civil ?? ""}
          >
            <option value="">Sin especificar</option>
            {OPCIONES_ESTADO_CIVIL.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="telefono">Teléfono</label>
          <input id="telefono" name="telefono" className="input" defaultValue={socio?.telefono ?? ""} />
        </div>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" defaultValue={socio?.email ?? ""} />
        </div>
        <div className="field md:col-span-2">
          <label className="label" htmlFor="direccion">Dirección</label>
          <input id="direccion" name="direccion" className="input" defaultValue={socio?.direccion ?? ""} />
        </div>
        <div className="field md:col-span-2">
          <label className="label" htmlFor="observaciones">Observaciones</label>
          <textarea
            id="observaciones"
            name="observaciones"
            className="input"
            rows={3}
            defaultValue={socio?.observaciones ?? ""}
          />
        </div>
      </div>
      </fieldset>

      {state.error && <p className="text-sm text-estado-atrasado">{state.error}</p>}

      {!soloLectura && (
        <div className="flex justify-end gap-3">
          <BotonGuardar label={labelBoton} />
        </div>
      )}
    </form>
  );
}
