"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

function BotonConfirmar({ cantidad }: { cantidad: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending || cantidad === 0}>
      {pending
        ? "Registrando..."
        : cantidad > 1
          ? `Confirmar pago de ${cantidad} períodos`
          : "Confirmar pago"}
    </button>
  );
}

const initialState: RegistrarPagoState = { error: null };

export function RegistrarPagoWizard({ mediosPago }: { mediosPago: MedioPago[] }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<SocioResultado[]>([]);
  const [buscando, startBusqueda] = useTransition();

  const [socio, setSocio] = useState<SocioResultado | null>(null);
  const [periodosDisponibles, setPeriodosDisponibles] = useState<PeriodoPendiente[]>([]);
  // Períodos elegidos por el usuario, con su importe editable individualmente
  // (por defecto, el valor de la cuota de ese período).
  const [seleccion, setSeleccion] = useState<Record<string, number>>({});
  const [pasoDatos, setPasoDatos] = useState(false);

  const [state, formAction] = useFormState(registrarPago, initialState);

  // useFormState no se "resetea" solo: su estado vive fuera de este
  // componente. Usamos un estado local propio para la confirmación.
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
    setSeleccion({});
    setPasoDatos(false);
    const data = await obtenerPeriodosPendientes(s.id);
    setPeriodosDisponibles(data as PeriodoPendiente[]);
  }

  function alternarPeriodo(p: PeriodoPendiente) {
    setSeleccion((actual) => {
      const copia = { ...actual };
      if (p.periodo_id in copia) {
        delete copia[p.periodo_id];
      } else {
        copia[p.periodo_id] = p.valor_cuota;
      }
      return copia;
    });
  }

  function actualizarImporte(periodoId: string, valor: number) {
    setSeleccion((actual) => ({ ...actual, [periodoId]: valor }));
  }

  function reiniciar() {
    setSocio(null);
    setTexto("");
    setResultados([]);
    setPeriodosDisponibles([]);
    setSeleccion({});
    setPasoDatos(false);
    setMostrarConfirmacion(false);
  }

  const periodosSeleccionados = periodosDisponibles.filter((p) => p.periodo_id in seleccion);
  const totalAPagar = periodosSeleccionados.reduce((acc, p) => acc + (seleccion[p.periodo_id] ?? 0), 0);

  const periodosJSON = useMemo(
    () =>
      JSON.stringify(
        periodosSeleccionados.map((p) => ({
          cuota_periodo_id: p.periodo_id,
          importe: seleccion[p.periodo_id] ?? p.valor_cuota,
        }))
      ),
    [periodosSeleccionados, seleccion]
  );

  if (mostrarConfirmacion) {
    return (
      <div className="card flex flex-col items-start gap-4 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-estado-pagadoBg text-estado-pagado">
          ✓
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink-900">
            {state.pendienteAprobacion ? "Pago enviado para aprobación" : "Pago registrado correctamente"}
          </h2>
          <p className="text-sm text-ink-600">
            {state.pendienteAprobacion
              ? `El pago de ${socio?.apellido}, ${socio?.nombre} quedó pendiente de aprobación por un administrador.`
              : `El pago de ${socio?.apellido}, ${socio?.nombre} quedó registrado y aprobado.`}
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

      {/* Paso 2: elegir uno o varios períodos */}
      {socio && !pasoDatos && (
        <div className="card p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-600">
            2. Elegir períodos a pagar
          </h2>
          <p className="mb-3 text-xs text-ink-400">
            Podés elegir más de uno si el socio va a pagar varios trimestres juntos.
          </p>
          {periodosDisponibles.length === 0 ? (
            <p className="text-sm text-ink-600">
              Este socio no tiene trimestres pendientes de pago.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {periodosDisponibles.map((p) => {
                  const elegido = p.periodo_id in seleccion;
                  return (
                    <button
                      key={p.periodo_id}
                      type="button"
                      onClick={() => alternarPeriodo(p)}
                      className={`flex flex-col items-start rounded-md border p-3 text-left transition-colors ${
                        elegido ? "border-brand bg-brand-light" : "border-border hover:bg-bg"
                      }`}
                    >
                      <span className="text-sm font-semibold text-ink-900">
                        {p.anio} — {trimestreLabel(p.trimestre)}
                      </span>
                      <span className="text-xs text-ink-600">{formatearImporte(p.valor_cuota)}</span>
                      <div className="mt-1"><EstadoBadge estado={p.estado_cuota} /></div>
                    </button>
                  );
                })}
              </div>

              {periodosSeleccionados.length > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-ink-600">
                    {periodosSeleccionados.length} período{periodosSeleccionados.length > 1 ? "s" : ""}{" "}
                    seleccionado{periodosSeleccionados.length > 1 ? "s" : ""} — total{" "}
                    <span className="font-semibold text-ink-900">{formatearImporte(totalAPagar)}</span>
                  </p>
                  <button className="btn-primary" onClick={() => setPasoDatos(true)}>
                    Continuar →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Paso 3: datos del pago */}
      {socio && pasoDatos && (
        <form action={formAction} className="card flex flex-col gap-4 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
            3. Datos del pago
          </h2>

          <input type="hidden" name="socio_id" value={socio.id} />
          <input type="hidden" name="periodos" value={periodosJSON} />

          {/* Períodos seleccionados, con importe editable por si el socio
              abona un monto distinto al esperado en alguno de ellos. */}
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            {periodosSeleccionados.map((p) => (
              <div key={p.periodo_id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-900">{p.anio} {trimestreLabel(p.trimestre)}</span>
                <div className="flex items-center gap-2">
                  {seleccion[p.periodo_id] !== p.valor_cuota && (
                    <span className="text-xs text-estado-pendiente" title={`Valor esperado: ${formatearImporte(p.valor_cuota)}`}>
                      ⚠
                    </span>
                  )}
                  <input
                    type="number"
                    step="0.01"
                    className="input w-28 py-1 text-right"
                    value={seleccion[p.periodo_id] ?? p.valor_cuota}
                    onChange={(e) => actualizarImporte(p.periodo_id, Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold text-ink-900">
              <span>Total</span>
              <span>{formatearImporte(totalAPagar)}</span>
            </div>
          </div>

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
            <button type="button" className="btn-secondary" onClick={() => setPasoDatos(false)}>
              Volver
            </button>
            <BotonConfirmar cantidad={periodosSeleccionados.length} />
          </div>
        </form>
      )}
    </div>
  );
}
