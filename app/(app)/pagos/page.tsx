import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "@/components/estado-badge";
import { AnularPagoButton } from "@/components/anular-pago-button";
import { formatearImporte, formatearFecha, trimestreLabel } from "@/lib/utils";
import { PagosFiltros } from "./pagos-filtros";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  desde?: string;
  hasta?: string;
  medio_pago_id?: string;
  incluir_anulados?: string;
}

export default async function PagosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from("pagos")
    .select(
      "id, fecha_pago, importe, estado, numero_comprobante, socios(numero_socio, nombre, apellido), cuotas_periodos(anio, trimestre), medios_pago(nombre)"
    )
    .order("fecha_pago", { ascending: false })
    .limit(200);

  if (!searchParams.incluir_anulados) {
    query = query.eq("estado", "ACTIVO");
  }
  if (searchParams.desde) query = query.gte("fecha_pago", searchParams.desde);
  if (searchParams.hasta) query = query.lte("fecha_pago", searchParams.hasta);
  if (searchParams.medio_pago_id) query = query.eq("medio_pago_id", Number(searchParams.medio_pago_id));

  const { data: pagos } = await query;
  const { data: mediosPago } = await supabase.from("medios_pago").select("*").order("id");

  // Filtro por nombre de socio (se aplica en memoria porque cruza tablas relacionadas)
  const q = searchParams.q?.trim().toLowerCase();
  const pagosFiltrados = q
    ? (pagos ?? []).filter((p) => {
        const s = Array.isArray(p.socios) ? p.socios[0] : p.socios;
        if (!s) return false;
        return (
          s.nombre?.toLowerCase().includes(q) ||
          s.apellido?.toLowerCase().includes(q) ||
          String(s.numero_socio).includes(q)
        );
      })
    : pagos ?? [];

  const total = pagosFiltrados.reduce((acc, p) => acc + Number(p.importe), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Pagos</h1>
          <p className="text-sm text-ink-600">
            {pagosFiltrados.length} pagos — total {formatearImporte(total)}
          </p>
        </div>
        <Link href="/pagos/registrar" className="btn-primary">+ Registrar pago</Link>
      </div>

      <div className="card p-4">
        <PagosFiltros mediosPago={mediosPago ?? []} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Importe</th>
              <th className="px-4 py-3">Medio de pago</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pagosFiltrados.map((p) => {
              const socio = Array.isArray(p.socios) ? p.socios[0] : p.socios;
              const periodo = Array.isArray(p.cuotas_periodos) ? p.cuotas_periodos[0] : p.cuotas_periodos;
              const medio = Array.isArray(p.medios_pago) ? p.medios_pago[0] : p.medios_pago;
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3">{formatearFecha(p.fecha_pago)}</td>
                  <td className="px-4 py-3">
                    {socio ? `${socio.apellido}, ${socio.nombre} (N° ${socio.numero_socio})` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {periodo ? `${periodo.anio} ${trimestreLabel(periodo.trimestre)}` : "-"}
                  </td>
                  <td className="px-4 py-3">{formatearImporte(p.importe)}</td>
                  <td className="px-4 py-3 text-ink-600">{medio?.nombre ?? "-"}</td>
                  <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                  <td className="px-4 py-3 text-right">
                    {p.estado === "ACTIVO" && <AnularPagoButton pagoId={p.id} />}
                  </td>
                </tr>
              );
            })}
            {pagosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-400">
                  No se encontraron pagos con esos criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
