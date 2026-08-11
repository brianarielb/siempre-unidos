import { createClient } from "@/lib/supabase/server";
import { formatearFecha, trimestreLabel } from "@/lib/utils";
import { NuevoPeriodoForm } from "./nuevo-periodo-form";
import { EditarValorPeriodo } from "./editar-valor-periodo";

export const dynamic = "force-dynamic";

export default async function CuotasPage() {
  const supabase = createClient();

  const [{ data: periodos }, { data: pagosActivos }] = await Promise.all([
    supabase
      .from("cuotas_periodos")
      .select("*")
      .order("anio", { ascending: false })
      .order("trimestre", { ascending: false }),
    supabase.from("pagos").select("cuota_periodo_id").eq("estado", "ACTIVO"),
  ]);

  const periodosConPagos = new Set((pagosActivos ?? []).map((p) => p.cuota_periodo_id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Cuotas / Períodos</h1>
        <p className="text-sm text-ink-600">
          El valor de la cuota se define por trimestre. Los períodos con pagos registrados quedan bloqueados.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-600">Nuevo período</h2>
        <NuevoPeriodoForm />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-6 py-3">Año</th>
              <th className="px-6 py-3">Trimestre</th>
              <th className="px-6 py-3">Vigencia</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {(periodos ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-6 py-3">{p.anio}</td>
                <td className="px-6 py-3">{trimestreLabel(p.trimestre)}</td>
                <td className="px-6 py-3 text-ink-600">
                  {formatearFecha(p.fecha_desde)} — {formatearFecha(p.fecha_hasta)}
                </td>
                <td className="px-6 py-3">
                  <EditarValorPeriodo
                    periodoId={p.id}
                    valorActual={p.valor}
                    bloqueado={periodosConPagos.has(p.id)}
                  />
                </td>
                <td className="px-6 py-3 text-ink-600">{p.observaciones ?? "-"}</td>
              </tr>
            ))}
            {(periodos ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-ink-400">
                  Todavía no cargaste ningún período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
