import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "@/components/estado-badge";
import { SociosFiltros } from "./socios-filtros";

export const dynamic = "force-dynamic";

export default async function SociosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("socios")
    .select("id, numero_socio, nombre, apellido, dni, estado, telefono")
    .order("numero_socio", { ascending: true });

  if (searchParams.estado) {
    query = query.eq("estado", searchParams.estado);
  }

  if (searchParams.q) {
    const q = searchParams.q.trim();
    const esNumero = /^\d+$/.test(q);
    query = esNumero
      ? query.or(`numero_socio.eq.${q},dni.ilike.%${q}%`)
      : query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,dni.ilike.%${q}%`);
  }

  const { data: socios, error } = await query.limit(200);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Socios</h1>
          <p className="text-sm text-ink-600">{socios?.length ?? 0} resultados</p>
        </div>
        <Link href="/socios/nuevo" className="btn-primary">
          + Nuevo socio
        </Link>
      </div>

      <div className="card p-4">
        <SociosFiltros />
      </div>

      {error && <p className="text-sm text-estado-atrasado">No se pudo cargar el listado de socios.</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">N° socio</th>
              <th className="px-4 py-3">Apellido y nombre</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(socios ?? []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-4 py-3 font-medium text-ink-900">{s.numero_socio}</td>
                <td className="px-4 py-3">{s.apellido}, {s.nombre}</td>
                <td className="px-4 py-3 text-ink-600">{s.dni}</td>
                <td className="px-4 py-3 text-ink-600">{s.telefono ?? "-"}</td>
                <td className="px-4 py-3"><EstadoBadge estado={s.estado} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/socios/${s.id}`} className="text-sm font-medium text-brand hover:underline">
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
      </div>
    </div>
  );
}
