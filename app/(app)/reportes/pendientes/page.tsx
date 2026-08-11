import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExportCsvButton } from "@/components/export-csv-button";
import { formatearImporte } from "@/lib/utils";
import { trimestreActual } from "@/lib/periodo";
import { SelectorPeriodoPendientes } from "./selector";

export const dynamic = "force-dynamic";

interface SearchParams {
  anio?: string;
  trimestre?: string;
}

export default async function ReportePendientesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const actual = trimestreActual();
  const anio = Number(searchParams.anio ?? actual.anio);
  const trimestre = Number(searchParams.trimestre ?? actual.trimestre);

  // Socios que deben específicamente el período seleccionado
  const { data: pendientesPeriodo } = await supabase
    .from("vista_estado_cuenta")
    .select("socio_id, numero_socio, nombre, apellido")
    .eq("anio", anio)
    .eq("trimestre", trimestre)
    .eq("estado_socio", "ACTIVO")
    .in("estado_cuota", ["PENDIENTE", "ATRASADO"]);

  const socioIds = (pendientesPeriodo ?? []).map((r) => r.socio_id);

  let filas: {
    socio_id: string;
    numero_socio: number;
    nombre: string;
    apellido: string;
    dni?: string;
    importe_adeudado: number;
    periodos_adeudados: number;
  }[] = [];

  if (socioIds.length > 0) {
    // Deuda total de esos socios en TODOS los períodos pendientes/atrasados
    const { data: deudaTotal } = await supabase
      .from("vista_estado_cuenta")
      .select("socio_id, numero_socio, nombre, apellido, valor_cuota")
      .in("socio_id", socioIds)
      .in("estado_cuota", ["PENDIENTE", "ATRASADO"]);

    const { data: sociosConDni } = await supabase
      .from("socios")
      .select("id, dni")
      .in("id", socioIds);
    const dniPorSocio = new Map((sociosConDni ?? []).map((s) => [s.id, s.dni]));

    const acumulado = new Map<string, typeof filas[number]>();
    for (const r of deudaTotal ?? []) {
      const actual = acumulado.get(r.socio_id) ?? {
        socio_id: r.socio_id,
        numero_socio: r.numero_socio,
        nombre: r.nombre,
        apellido: r.apellido,
        dni: dniPorSocio.get(r.socio_id),
        importe_adeudado: 0,
        periodos_adeudados: 0,
      };
      actual.importe_adeudado += Number(r.valor_cuota);
      actual.periodos_adeudados += 1;
      acumulado.set(r.socio_id, actual);
    }
    filas = Array.from(acumulado.values()).sort((a, b) => a.numero_socio - b.numero_socio);
  }

  const filasCSV = filas.map((f) => ({
    "N° socio": f.numero_socio,
    Apellido: f.apellido,
    Nombre: f.nombre,
    DNI: f.dni ?? "",
    "Importe adeudado": f.importe_adeudado,
    "Períodos adeudados": f.periodos_adeudados,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reportes" className="text-sm text-brand hover:underline">← Reportes</Link>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">Cuotas pendientes</h1>
          <p className="text-sm text-ink-600">
            Socios que no pagaron {anio} - T{trimestre} ({filas.length})
          </p>
        </div>
        <ExportCsvButton filas={filasCSV} nombreArchivo={`pendientes-${anio}-T${trimestre}.csv`} />
      </div>

      <div className="card p-4"><SelectorPeriodoPendientes /></div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">N° socio</th>
              <th className="px-4 py-3">Apellido y nombre</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3">Importe adeudado (total)</th>
              <th className="px-4 py-3">Períodos adeudados</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.socio_id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">{f.numero_socio}</td>
                <td className="px-4 py-3">{f.apellido}, {f.nombre}</td>
                <td className="px-4 py-3 text-ink-600">{f.dni}</td>
                <td className="px-4 py-3">{formatearImporte(f.importe_adeudado)}</td>
                <td className="px-4 py-3">{f.periodos_adeudados}</td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-400">
                  No hay socios pendientes para ese período. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
