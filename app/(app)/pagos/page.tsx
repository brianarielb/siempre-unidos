import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "@/components/estado-badge";
import { AnularPagoButton } from "@/components/anular-pago-button";
import { AprobarPagoButton } from "@/components/aprobar-pago-button";
import { PaginationControls } from "@/components/pagination-controls";
import { formatearImporte, formatearFecha, trimestreLabel } from "@/lib/utils";
import { obtenerRolActual } from "@/lib/rol-actual";
import { puedeAnularPagos, puedeAprobarPagos, puedeRegistrarPagos } from "@/lib/permisos";
import { obtenerTamanioPagina } from "@/lib/configuracion";
import { PagosFiltros } from "./pagos-filtros";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  desde?: string;
  hasta?: string;
  medio_pago_id?: string;
  estado?: string;
  page?: string;
}

export default async function PagosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const rol = await obtenerRolActual();
  const puedeCrear = puedeRegistrarPagos(rol);
  const puedeAnular = puedeAnularPagos(rol);
  const puedeAprobar = puedeAprobarPagos(rol);
  const tamanioPagina = await obtenerTamanioPagina();

  const pagina = Math.max(1, Number(searchParams.page ?? "1"));
  const desdeIdx = (pagina - 1) * tamanioPagina;
  const hastaIdx = desdeIdx + tamanioPagina - 1;

  // Filtro por socio: se resuelve primero contra "socios" para poder
  // combinarlo con el resto de los filtros antes de contar/paginar.
  const q = searchParams.q?.trim();
  let idsSocios: string[] | null = null;
  if (q) {
    const esNumero = /^\d+$/.test(q);
    let socioQuery = supabase.from("socios").select("id");
    socioQuery = esNumero
      ? socioQuery.eq("numero_socio", Number(q))
      : socioQuery.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`);
    const { data: sociosCoincidentes } = await socioQuery;
    idsSocios = (sociosCoincidentes ?? []).map((s) => s.id);
    if (idsSocios.length === 0) idsSocios = ["00000000-0000-0000-0000-000000000000"];
  }

  let countQuery = supabase.from("pagos").select("id", { count: "exact", head: true });
  let dataQuery = supabase
    .from("pagos")
    .select(
      "id, fecha_pago, importe, estado, numero_comprobante, socios(numero_socio, nombre, apellido), cuotas_periodos(anio, trimestre), medios_pago(nombre)"
    )
    .order("fecha_pago", { ascending: false });

  // Por defecto (sin elegir nada) se muestran aprobados y pendientes, pero
  // no los anulados; así lo pendiente de aprobación siempre es visible sin
  // que el ADMIN tenga que buscarlo.
  if (!searchParams.estado) {
    countQuery = countQuery.in("estado", ["ACTIVO", "PENDIENTE_APROBACION"]);
    dataQuery = dataQuery.in("estado", ["ACTIVO", "PENDIENTE_APROBACION"]);
  } else if (searchParams.estado !== "TODOS") {
    countQuery = countQuery.eq("estado", searchParams.estado);
    dataQuery = dataQuery.eq("estado", searchParams.estado);
  }
  if (searchParams.desde) {
    countQuery = countQuery.gte("fecha_pago", searchParams.desde);
    dataQuery = dataQuery.gte("fecha_pago", searchParams.desde);
  }
  if (searchParams.hasta) {
    countQuery = countQuery.lte("fecha_pago", searchParams.hasta);
    dataQuery = dataQuery.lte("fecha_pago", searchParams.hasta);
  }
  if (searchParams.medio_pago_id) {
    countQuery = countQuery.eq("medio_pago_id", Number(searchParams.medio_pago_id));
    dataQuery = dataQuery.eq("medio_pago_id", Number(searchParams.medio_pago_id));
  }
  if (idsSocios) {
    countQuery = countQuery.in("socio_id", idsSocios);
    dataQuery = dataQuery.in("socio_id", idsSocios);
  }

  // Secuencial, no en paralelo (Promise.all sobre el mismo cliente hacía
  // que una de las dos consultas perdiera el contexto de sesión).
  const { count } = await countQuery;
  const { data: pagos, error } = await dataQuery.range(desdeIdx, hastaIdx);

  if (error) console.error("Error consultando pagos:", error.message, error.details, error.hint);
  const { data: mediosPago } = await supabase.from("medios_pago").select("*").order("id");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Pagos</h1>
          <p className="text-sm text-ink-600">{count ?? 0} pagos encontrados</p>
        </div>
        {puedeCrear && <Link href="/pagos/registrar" className="btn-primary">+ Registrar pago</Link>}
      </div>

      <div className="card p-4">
        <PagosFiltros mediosPago={mediosPago ?? []} />
      </div>

      {error && (
        <p className="text-sm text-estado-atrasado">
          No se pudo cargar el listado de pagos ({error.message}).
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Importe</th>
              <th className="hidden px-4 py-3 md:table-cell">Medio de pago</th>
              <th className="hidden px-4 py-3 sm:table-cell">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(pagos ?? []).map((p) => {
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
                  <td className="hidden px-4 py-3 text-ink-600 md:table-cell">{medio?.nombre ?? "-"}</td>
                  <td className="hidden px-4 py-3 sm:table-cell"><EstadoBadge estado={p.estado} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {puedeAprobar && p.estado === "PENDIENTE_APROBACION" && <AprobarPagoButton pagoId={p.id} />}
                      {puedeAnular && p.estado !== "ANULADO" && <AnularPagoButton pagoId={p.id} />}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(pagos ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-400">
                  No se encontraron pagos con esos criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls total={count ?? 0} tamanioPagina={tamanioPagina} />
      </div>
    </div>
  );
}
