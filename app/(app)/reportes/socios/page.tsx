import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "@/components/estado-badge";
import { ExportCsvButton } from "@/components/export-csv-button";
import { formatearFecha } from "@/lib/utils";
import { FiltrosReporteSocios } from "./filtros";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  estado?: string;
  alta_desde?: string;
  alta_hasta?: string;
}

export default async function ReporteSociosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  let query = supabase
    .from("socios")
    .select("numero_socio, nombre, apellido, dni, estado, fecha_alta")
    .order("numero_socio");

  if (searchParams.estado) query = query.eq("estado", searchParams.estado);
  if (searchParams.alta_desde) query = query.gte("fecha_alta", searchParams.alta_desde);
  if (searchParams.alta_hasta) query = query.lte("fecha_alta", searchParams.alta_hasta);
  if (searchParams.q) {
    const q = searchParams.q.trim();
    const esNumero = /^\d+$/.test(q);
    query = esNumero
      ? query.or(`numero_socio.eq.${q},dni.ilike.%${q}%`)
      : query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,dni.ilike.%${q}%`);
  }

  const { data: socios } = await query.limit(500);

  const filasCSV = (socios ?? []).map((s) => ({
    "N° socio": s.numero_socio,
    Apellido: s.apellido,
    Nombre: s.nombre,
    DNI: s.dni,
    Estado: s.estado,
    "Fecha de alta": formatearFecha(s.fecha_alta),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reportes" className="text-sm text-brand hover:underline">← Reportes</Link>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">Reporte de socios</h1>
          <p className="text-sm text-ink-600">{socios?.length ?? 0} resultados</p>
        </div>
        <ExportCsvButton filas={filasCSV} nombreArchivo="reporte-socios.csv" />
      </div>

      <div className="card p-4"><FiltrosReporteSocios /></div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">N° socio</th>
              <th className="px-4 py-3">Apellido y nombre</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha de alta</th>
            </tr>
          </thead>
          <tbody>
            {(socios ?? []).map((s) => (
              <tr key={s.numero_socio} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">{s.numero_socio}</td>
                <td className="px-4 py-3">{s.apellido}, {s.nombre}</td>
                <td className="px-4 py-3 text-ink-600">{s.dni}</td>
                <td className="px-4 py-3"><EstadoBadge estado={s.estado} /></td>
                <td className="px-4 py-3 text-ink-600">{formatearFecha(s.fecha_alta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
