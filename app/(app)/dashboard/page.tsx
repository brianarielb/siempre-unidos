import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { formatearImporte, trimestreLabel } from "@/lib/utils";
import { trimestreActual } from "@/lib/periodo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { anio, trimestre } = trimestreActual();

  const [
    { count: totalSocios },
    { count: sociosActivos },
    { count: sociosInactivos },
    { data: estadoCuenta },
    { data: periodoActual },
    { data: pagosAnio },
  ] = await Promise.all([
    supabase.from("socios").select("*", { count: "exact", head: true }),
    supabase.from("socios").select("*", { count: "exact", head: true }).eq("estado", "ACTIVO"),
    supabase.from("socios").select("*", { count: "exact", head: true }).eq("estado", "INACTIVO"),
    supabase.from("vista_estado_cuenta").select("socio_id, estado_cuota, estado_socio"),
    supabase
      .from("cuotas_periodos")
      .select("id")
      .eq("anio", anio)
      .eq("trimestre", trimestre)
      .maybeSingle(),
    supabase
      .from("pagos")
      .select("importe, fecha_pago, cuota_periodo_id, estado, cuotas_periodos(anio, trimestre)")
      .eq("estado", "ACTIVO")
      .gte("fecha_pago", `${anio}-01-01`)
      .lte("fecha_pago", `${anio}-12-31`),
  ]);

  // Socios activos con al menos un período atrasado
  const sociosAtrasadosSet = new Set(
    (estadoCuenta ?? [])
      .filter((r) => r.estado_socio === "ACTIVO" && r.estado_cuota === "ATRASADO")
      .map((r) => r.socio_id)
  );
  const sociosConDeuda = sociosAtrasadosSet.size;
  const sociosAlDia = (sociosActivos ?? 0) - sociosConDeuda;

  let pagosPeriodoActual = 0;
  let recaudacionTrimestreActual = 0;
  if (periodoActual) {
    const { count } = await supabase
      .from("pagos")
      .select("*", { count: "exact", head: true })
      .eq("cuota_periodo_id", periodoActual.id)
      .eq("estado", "ACTIVO");
    pagosPeriodoActual = count ?? 0;

    const { data: sumaData } = await supabase
      .from("pagos")
      .select("importe")
      .eq("cuota_periodo_id", periodoActual.id)
      .eq("estado", "ACTIVO");
    recaudacionTrimestreActual = (sumaData ?? []).reduce((acc, p) => acc + Number(p.importe), 0);
  }

  const recaudacionAnual = (pagosAnio ?? []).reduce((acc, p) => acc + Number(p.importe), 0);

  // Agrupar para los gráficos
  const porTrimestre = new Map<string, { total: number; cantidad: number }>();
  for (const p of pagosAnio ?? []) {
    const cp = Array.isArray(p.cuotas_periodos) ? p.cuotas_periodos[0] : p.cuotas_periodos;
    if (!cp) continue;
    const key = trimestreLabel(cp.trimestre);
    const actual = porTrimestre.get(key) ?? { total: 0, cantidad: 0 };
    actual.total += Number(p.importe);
    actual.cantidad += 1;
    porTrimestre.set(key, actual);
  }
  const orden = ["T1", "T2", "T3", "T4"];
  const recaudacionPorTrimestre = orden.map((t) => ({
    periodo: t,
    total: porTrimestre.get(t)?.total ?? 0,
  }));
  const pagosPorTrimestre = orden.map((t) => ({
    periodo: t,
    cantidad: porTrimestre.get(t)?.cantidad ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-600">
          Período actual: {anio} — {trimestreLabel(trimestre)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total de socios" value={totalSocios ?? 0} />
        <StatCard label="Socios activos" value={sociosActivos ?? 0} />
        <StatCard label="Socios inactivos" value={sociosInactivos ?? 0} />
        <StatCard label="Socios al día" value={Math.max(sociosAlDia, 0)} />
        <StatCard label="Socios con cuotas atrasadas" value={sociosConDeuda} />
        <StatCard label="Pagos del período actual" value={pagosPeriodoActual} />
        <StatCard label="Recaudación del trimestre" value={formatearImporte(recaudacionTrimestreActual)} />
        <StatCard label="Recaudación anual" value={formatearImporte(recaudacionAnual)} />
      </div>

      {!periodoActual && (
        <div className="card border-estado-pendiente bg-estado-pendienteBg p-4 text-sm text-estado-pendiente">
          Todavía no existe un período de cuota cargado para {anio} - {trimestreLabel(trimestre)}.
          Cargalo desde "Cuotas / Períodos" para poder registrar pagos de este trimestre.
        </div>
      )}

      <DashboardCharts
        recaudacionPorTrimestre={recaudacionPorTrimestre}
        pagosPorTrimestre={pagosPorTrimestre}
      />
    </div>
  );
}
