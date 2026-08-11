import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExportCsvButton } from "@/components/export-csv-button";
import { formatearImporte, formatearFecha, trimestreLabel } from "@/lib/utils";
import { FiltrosReportePagos } from "./filtros";

export const dynamic = "force-dynamic";

interface SearchParams {
  desde?: string;
  hasta?: string;
  anio?: string;
  trimestre?: string;
  q?: string;
  medio_pago_id?: string;
}

export default async function ReportePagosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from("pagos")
    .select(
      "id, fecha_pago, importe, socios(numero_socio, nombre, apellido), cuotas_periodos(anio, trimestre), medios_pago(nombre)"
    )
    .eq("estado", "ACTIVO")
    .order("fecha_pago", { ascending: false })
    .limit(1000);

  if (searchParams.desde) query = query.gte("fecha_pago", searchParams.desde);
  if (searchParams.hasta) query = query.lte("fecha_pago", searchParams.hasta);
  if (searchParams.medio_pago_id) query = query.eq("medio_pago_id", Number(searchParams.medio_pago_id));

  const { data: pagosRaw } = await query;
  const { data: mediosPago } = await supabase.from("medios_pago").select("*").order("id");

  let pagos = (pagosRaw ?? []).map((p) => ({
    ...p,
    socio: Array.isArray(p.socios) ? p.socios[0] : p.socios,
    periodo: Array.isArray(p.cuotas_periodos) ? p.cuotas_periodos[0] : p.cuotas_periodos,
    medio: Array.isArray(p.medios_pago) ? p.medios_pago[0] : p.medios_pago,
  }));

  if (searchParams.anio) pagos = pagos.filter((p) => p.periodo?.anio === Number(searchParams.anio));
  if (searchParams.trimestre) pagos = pagos.filter((p) => p.periodo?.trimestre === Number(searchParams.trimestre));
  if (searchParams.q) {
    const q = searchParams.q.trim().toLowerCase();
    pagos = pagos.filter(
      (p) =>
        p.socio?.nombre?.toLowerCase().includes(q) ||
        p.socio?.apellido?.toLowerCase().includes(q) ||
        String(p.socio?.numero_socio).includes(q)
    );
  }

  const total = pagos.reduce((acc, p) => acc + Number(p.importe), 0);

  const filasCSV = pagos.map((p) => ({
    Socio: p.socio ? `${p.socio.apellido}, ${p.socio.nombre}` : "-",
    Período: p.periodo ? `${p.periodo.anio} ${trimestreLabel(p.periodo.trimestre)}` : "-",
    "Fecha de pago": formatearFecha(p.fecha_pago),
    Importe: p.importe,
    "Medio de pago": p.medio?.nombre ?? "-",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reportes" className="text-sm text-brand hover:underline">← Reportes</Link>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">Reporte de pagos</h1>
          <p className="text-sm text-ink-600">{pagos.length} pagos — total {formatearImporte(total)}</p>
        </div>
        <ExportCsvButton filas={filasCSV} nombreArchivo="reporte-pagos.csv" />
      </div>

      <div className="card p-4"><FiltrosReportePagos mediosPago={mediosPago ?? []} /></div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Fecha de pago</th>
              <th className="px-4 py-3">Importe</th>
              <th className="px-4 py-3">Medio de pago</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{p.socio ? `${p.socio.apellido}, ${p.socio.nombre}` : "-"}</td>
                <td className="px-4 py-3">{p.periodo ? `${p.periodo.anio} ${trimestreLabel(p.periodo.trimestre)}` : "-"}</td>
                <td className="px-4 py-3">{formatearFecha(p.fecha_pago)}</td>
                <td className="px-4 py-3">{formatearImporte(p.importe)}</td>
                <td className="px-4 py-3 text-ink-600">{p.medio?.nombre ?? "-"}</td>
              </tr>
            ))}
          </tbody>
          {pagos.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-bg font-semibold">
                <td className="px-4 py-3" colSpan={3}>Total</td>
                <td className="px-4 py-3">{formatearImporte(total)}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
