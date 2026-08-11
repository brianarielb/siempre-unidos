import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SocioForm } from "@/components/socio-form";
import { EstadoBadge } from "@/components/estado-badge";
import { SocioAcciones } from "@/components/socio-acciones";
import { formatearImporte, formatearFecha, trimestreLabel } from "@/lib/utils";
import { actualizarSocio } from "../actions";

export const dynamic = "force-dynamic";

export default async function FichaSocioPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: socio } = await supabase.from("socios").select("*").eq("id", params.id).single();
  if (!socio) notFound();

  const { data: estadoCuenta } = await supabase
    .from("vista_estado_cuenta")
    .select("*")
    .eq("socio_id", params.id)
    .order("anio", { ascending: false })
    .order("trimestre", { ascending: false });

  const actualizarSocioConId = actualizarSocio.bind(null, socio.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/socios" className="text-sm text-brand hover:underline">
            ← Volver a socios
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">
            {socio.apellido}, {socio.nombre} <span className="text-ink-400">— N° {socio.numero_socio}</span>
          </h1>
          <div className="mt-1"><EstadoBadge estado={socio.estado} /></div>
        </div>
        <SocioAcciones socioId={socio.id} estado={socio.estado} />
      </div>

      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-600">Datos del socio</h2>
        <SocioForm socio={socio} action={actualizarSocioConId} labelBoton="Guardar cambios" />
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">Estado de cuenta</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-6 py-3">Año</th>
              <th className="px-6 py-3">Trimestre</th>
              <th className="px-6 py-3">Valor cuota</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Fecha pago</th>
              <th className="px-6 py-3">Importe pagado</th>
            </tr>
          </thead>
          <tbody>
            {(estadoCuenta ?? []).map((r) => (
              <tr key={r.periodo_id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-6 py-3">{r.anio}</td>
                <td className="px-6 py-3">{trimestreLabel(r.trimestre)}</td>
                <td className="px-6 py-3">{formatearImporte(r.valor_cuota)}</td>
                <td className="px-6 py-3"><EstadoBadge estado={r.estado_cuota} /></td>
                <td className="px-6 py-3">{formatearFecha(r.fecha_pago)}</td>
                <td className="px-6 py-3">{formatearImporte(r.importe)}</td>
              </tr>
            ))}
            {(estadoCuenta ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-ink-400">
                  Todavía no hay períodos de cuota cargados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
