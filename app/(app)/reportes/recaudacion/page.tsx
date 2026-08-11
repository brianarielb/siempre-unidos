import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExportCsvButton } from "@/components/export-csv-button";
import { RecaudacionChart } from "@/components/recaudacion-chart";
import { formatearImporte, trimestreLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReporteRecaudacionPage() {
  const supabase = createClient();

  const { data: pagos } = await supabase
    .from("pagos")
    .select("importe, cuotas_periodos(anio, trimestre), medios_pago(nombre)")
    .eq("estado", "ACTIVO")
    .limit(5000);

  type Grupo = { anio: number; trimestre: number; medio: string; cantidad: number; total: number };
  const grupos = new Map<string, Grupo>();

  for (const p of pagos ?? []) {
    const periodo = Array.isArray(p.cuotas_periodos) ? p.cuotas_periodos[0] : p.cuotas_periodos;
    const medio = Array.isArray(p.medios_pago) ? p.medios_pago[0] : p.medios_pago;
    if (!periodo || !medio) continue;
    const key = `${periodo.anio}-${periodo.trimestre}-${medio.nombre}`;
    const actual = grupos.get(key) ?? {
      anio: periodo.anio,
      trimestre: periodo.trimestre,
      medio: medio.nombre,
      cantidad: 0,
      total: 0,
    };
    actual.cantidad += 1;
    actual.total += Number(p.importe);
    grupos.set(key, actual);
  }

  const filas = Array.from(grupos.values()).sort(
    (a, b) => b.anio - a.anio || b.trimestre - a.trimestre || a.medio.localeCompare(b.medio)
  );

  const filasCSV = filas.map((f) => ({
    Año: f.anio,
    Trimestre: trimestreLabel(f.trimestre),
    "Medio de pago": f.medio,
    "Cantidad de pagos": f.cantidad,
    "Importe total": f.total,
  }));

  // Datos apilados para el gráfico: una fila por período, una columna por medio de pago
  const mediosUnicos = Array.from(new Set(filas.map((f) => f.medio)));
  const porPeriodo = new Map<string, Record<string, number>>();
  for (const f of filas) {
    const key = `${f.anio} ${trimestreLabel(f.trimestre)}`;
    const actual = porPeriodo.get(key) ?? {};
    actual[f.medio] = f.total;
    porPeriodo.set(key, actual);
  }
  const datosGrafico = Array.from(porPeriodo.entries())
    .map(([periodo, valores]) => ({ periodo, ...valores }))
    .reverse();

  const totalGeneral = filas.reduce((acc, f) => acc + f.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reportes" className="text-sm text-brand hover:underline">← Reportes</Link>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">Recaudación</h1>
          <p className="text-sm text-ink-600">Total histórico: {formatearImporte(totalGeneral)}</p>
        </div>
        <ExportCsvButton filas={filasCSV} nombreArchivo="reporte-recaudacion.csv" />
      </div>

      {datosGrafico.length > 0 && <RecaudacionChart data={datosGrafico} medios={mediosUnicos} />}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Trimestre</th>
              <th className="px-4 py-3">Medio de pago</th>
              <th className="px-4 py-3">Cantidad de pagos</th>
              <th className="px-4 py-3">Importe total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={`${f.anio}-${f.trimestre}-${f.medio}`} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{f.anio}</td>
                <td className="px-4 py-3">{trimestreLabel(f.trimestre)}</td>
                <td className="px-4 py-3 text-ink-600">{f.medio}</td>
                <td className="px-4 py-3">{f.cantidad}</td>
                <td className="px-4 py-3">{formatearImporte(f.total)}</td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-400">
                  Todavía no hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
