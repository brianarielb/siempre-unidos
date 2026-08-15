import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "@/components/estado-badge";
import { PaginationControls } from "@/components/pagination-controls";
import { obtenerRolActual } from "@/lib/rol-actual";
import { puedeGestionarSocios } from "@/lib/permisos";
import { obtenerTamanioPagina } from "@/lib/configuracion";
import { SociosFiltros } from "./socios-filtros";

export const dynamic = "force-dynamic";

export default async function SociosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string; page?: string };
}) {
  const supabase = createClient();
  const rol = await obtenerRolActual();
  const puedeCrear = puedeGestionarSocios(rol);
  const tamanioPagina = await obtenerTamanioPagina();

  const pagina = Math.max(1, Number(searchParams.page ?? "1"));
  const desde = (pagina - 1) * tamanioPagina;
  const hasta = desde + tamanioPagina - 1;

  // Conteo total y datos de la página se piden en consultas separadas a
  // propósito: combinar count:"exact" con .range() en una sola consulta
  // devolvía el total correcto pero la porción de filas vacía.
  let countQuery = supabase.from("socios").select("id", { count: "exact", head: true });
  let dataQuery = supabase
    .from("socios")
    .select("id, numero_socio, nombre, apellido, dni, estado, telefono")
    .order("numero_socio", { ascending: true });

  if (searchParams.estado) {
    countQuery = countQuery.eq("estado", searchParams.estado);
    dataQuery = dataQuery.eq("estado", searchParams.estado);
  }

  if (searchParams.q) {
    const texto = searchParams.q.trim();
    const esNumero = /^\d+$/.test(texto);
    const filtroOr = esNumero
      ? `numero_socio.eq.${texto},dni.ilike.%${texto}%`
      : `nombre.ilike.%${texto}%,apellido.ilike.%${texto}%,dni.ilike.%${texto}%`;
    countQuery = countQuery.or(filtroOr);
    dataQuery = dataQuery.or(filtroOr);
  }

  // Conteo total y datos de la página, uno después del otro (no en paralelo):
  // corríamos ambas consultas con Promise.all sobre el mismo cliente y una
  // de las dos terminaba perdiendo el contexto de sesión, devolviendo 0
  // filas mientras la otra sí contaba bien.
  const { count } = await countQuery;
  const { data: socios, error } = await dataQuery.range(desde, hasta);

  if (error) console.error("Error consultando socios:", error.message, error.details, error.hint);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Socios</h1>
          <p className="text-sm text-ink-600">{count ?? 0} resultados</p>
        </div>
        {puedeCrear && (
          <Link href="/socios/nuevo" className="btn-primary">
            + Nuevo socio
          </Link>
        )}
      </div>

      <div className="card p-4">
        <SociosFiltros />
      </div>

      {error && <p className="text-sm text-estado-atrasado">No se pudo cargar el listado de socios.</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">N° socio</th>
              <th className="px-4 py-3">Apellido y nombre</th>
              <th className="px-4 py-3">DNI</th>
              <th className="hidden px-4 py-3 sm:table-cell">Teléfono</th>
              <th className="hidden px-4 py-3 sm:table-cell">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(socios ?? []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-4 py-3 font-medium text-ink-900">{s.numero_socio}</td>
                <td className="px-4 py-3">{s.apellido}, {s.nombre}</td>
                <td className="px-4 py-3 text-ink-600">{s.dni}</td>
                <td className="hidden px-4 py-3 text-ink-600 sm:table-cell">{s.telefono ?? "-"}</td>
                <td className="hidden px-4 py-3 sm:table-cell"><EstadoBadge estado={s.estado} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/socios/${s.id}`} className="whitespace-nowrap text-sm font-medium text-brand hover:underline">
                    Ver ficha
                  </Link>
                </td>
              </tr>
            ))}
            {(socios ?? []).length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-400">
                  No se encontraron socios con esos criterios.
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