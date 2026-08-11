"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { EstadoBadge } from "@/components/estado-badge";
import { formatearImporte, trimestreLabel } from "@/lib/utils";
import type { MedioPago } from "@/lib/types";
import {
  buscarSociosParaPago,
  obtenerPeriodosPendientes,
  registrarPago,
  type RegistrarPagoState,
} from "../actions";

type SocioResultado = {
  id: string;
  numero_socio: number;
  nombre: string;
  apellido: string;
  dni: string;
  estado: string;
};

type PeriodoPendiente = {
  periodo_id: string;
  anio: number;
  trimestre: number;
  valor_cuota: number;
  estado_cuota: string;
};

function BotonConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Registrando..." : "Confirmar pago"}
    </button>
  );
}

const initialState: RegistrarPagoState = { error: null };

export function RegistrarPagoWizard({ mediosPago }: { mediosPago: MedioPago[] }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<SocioResultado[]>([]);
  const [buscando, startBusqueda] = useTransition();

  const [socio, setSocio] = useState<SocioResultado | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoPendiente[]>([]);
  const [periodo, setPeriodo] = useState<PeriodoPendiente | null>(null);

  const [state, formAction] = useFormState(registrarPago, initialState);

  // useFormState no se "resetea" solo: su estado vive fuera de este componente
  // y sigue en {ok: true} hasta que el formulario se vuelva a enviar. Por eso
  // usamos un estado local propio para decidir si mostrar la confirmación,
  // y lo sincronizamos acá. Se usa `state` completo (no `state.ok`) como
  // dependencia porque cada envío exitoso genera un objeto nuevo, incluso si
  // el valor de `ok` sigue siendo `true` que sino el efecto no se dispararía
  // en pagos sucesivos.
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  useEffect(() => {
    if (state.ok) setMostrarConfirmacion(true);
  }, [state]);

  function handleBuscar(valor: string) {
    setTexto(valor);
    if (valor.trim().length < 2) {
      setResultados([]);
      return;
    }
    startBusqueda(async () => {
      const data = await buscarSociosParaPago(valor);
      setResultados(data);
    });
  }

  async function handleSeleccionarSocio(s: SocioResultado) {
    setSocio(s);
    setResultados([]);
    setTexto(`${s.apellido}, ${s.nombre} (N° ${s.numero_socio})`);
    setPeriodo(null);
    const data = await obtenerPeriodosPendientes(s.id);
    setPeriodos(data as PeriodoPendiente[]);
  }

  function reiniciar() {
    setSocio(null);
    setTexto("");
    setResultados([]);
    setPeriodos([]);
    setPeriodo(null);
    setMostrarConfirmacion(false);
  }

  if (mostrarConfirmacion) {
    return (
      <div className="card flex flex-col items-start gap-4 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-estado-pagadoBg text-estado-pagado">
          ✓
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Pago registrado correctamente</h2>
          <p className="text-sm text-ink-600">
            El pago de {socio?.apellido}, {socio?.nombre} quedó registrado.
          </p>
        </div>
        <button className="btn-primary" onClick={reiniciar}>
          Registrar otro pago
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Paso 1: búsqueda de socio */}
      <div className="card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-600">
          1. Buscar socio
        </h2>
        <div className="relative max-w-md">
          <input
            className="input"
            placeholder="Número de socio, DNI, nombre o apellido"
            value={texto}
            onChange={(e) => handleBuscar(e.target.value)}
            disabled={!!socio}
          />
          {!socio && resultados.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-md">
              {resultados.map((s) => (
                <button
                  key={s.id}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-bg"
                  onClick={() => handleSeleccionarSocio(s)}
                >
                  <span className="font-medium text-ink-900">
                    {s.apellido}, {s.nombre}
                  </span>
                  <span className="text-xs text-ink-400">
                    N° {s.numero_socio} — DNI {s.dni}
                  </span>
                </button>
              ))}
            </div>
          )}
          {buscando && <p className="mt-1 text-xs text-ink-400">Buscando...</p>}
        </div>
        {socio && (
          <button className="mt-3 text-sm text-brand hover:underline" onClick={reiniciar}>
            Cambiar socio
          </button>
        )}
      </div>

      {/* Paso 2: elegir período */}
      {socio && (
        <div className="card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-600">
            2. Elegir trimestre a pagar
          </h2>
          {periodos.length === 0 ? (
            <p className="text-sm text-ink-600">
              Este socio no tiene trimestres pendientes de pago.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {periodos.map((p) => (
                <button
                  key={p.periodo_id}
                  onClick={() => setPeriodo(p)}
                  className={`flex flex-col items-start rounded-md border p-3 text-left transition-colors ${
                    periodo?.periodo_id === p.periodo_id
                      ? "border-brand bg-brand-light"
                      : "border-border hover:bg-bg"
                  }`}
                >
                  <span className="text-sm font-semibold text-ink-900">
                    {p.anio} — {trimestreLabel(p.trimestre)}
                  </span>
                  <span className="text-xs text-ink-600">{formatearImporte(p.valor_cuota)}</span>
                  <div className="mt-1"><EstadoBadge estado={p.estado_cuota} /></div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Paso 3: datos del pago */}
      {socio && periodo && (
        <form action={formAction} className="card flex flex-col gap-4 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
            3. Datos del pago — {periodo.anio} {trimestreLabel(periodo.trimestre)}
          </h2>

          <input type="hidden" name="socio_id" value={socio.id} />
          <input type="hidden" name="cuota_periodo_id" value={periodo.periodo_id} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="fecha_pago">Fecha de pago</label>
              <input
                id="fecha_pago"
                name="fecha_pago"
                type="date"
                required
                className="input"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <ImporteConAdvertencia valorEsperado={periodo.valor_cuota} />
            <div className="field">
              <label className="label" htmlFor="medio_pago_id">Medio de pago</label>
              <select id="medio_pago_id" name="medio_pago_id" required className="input" defaultValue="">
                <option value="" disabled>Elegir</option>
                {mediosPago.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="numero_comprobante">N° de comprobante (opcional)</label>
              <input id="numero_comprobante" name="numero_comprobante" className="input" />
            </div>
            <div className="field md:col-span-2">
              <label className="label" htmlFor="observaciones">Observaciones (opcional)</label>
              <textarea id="observaciones" name="observaciones" rows={2} className="input" />
            </div>
          </div>

          {state.error && <p className="text-sm text-estado-atrasado">{state.error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setPeriodo(null)}>
              Volver
            </button>
            <BotonConfirmar />
          </div>
        </form>
      )}
    </div>
  );
}

function ImporteConAdvertencia({ valorEsperado }: { valorEsperado: number }) {
  const [importe, setImporte] = useState(String(valorEsperado));
  const difiere = Number(importe) !== valorEsperado;

  return (
    <div className="field">
      <label className="label" htmlFor="importe">Importe abonado</label>
      <input
        id="importe"
        name="importe"
        type="number"
        step="0.01"
        required
        className="input"
        value={importe}
        onChange={(e) => setImporte(e.target.value)}
      />
      {difiere && (
        <p className="text-xs text-estado-pendiente">
          ⚠ Difiere del valor esperado ({formatearImporte(valorEsperado)}).
        </p>
      )}
    </div>
  );
}
