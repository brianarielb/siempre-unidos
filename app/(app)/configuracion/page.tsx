import { createClient } from "@/lib/supabase/server";
import { MediosPagoSection } from "./medios-pago-section";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, email, rol")
    .eq("id", user?.id)
    .single();
  const { data: mediosPago } = await supabase.from("medios_pago").select("*").order("id");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Configuración</h1>
        <p className="text-sm text-ink-600">Datos de tu cuenta y opciones generales del sistema.</p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-600">Tu cuenta</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-600">Nombre</dt>
            <dd className="text-ink-900">{perfil?.nombre ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-ink-600">Email</dt>
            <dd className="text-ink-900">{perfil?.email ?? user?.email}</dd>
          </div>
          <div>
            <dt className="text-ink-600">Rol</dt>
            <dd className="text-ink-900">{perfil?.rol ?? "ADMIN"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-400">
          Para cambiar tu contraseña, cerrá sesión y usá la opción "Olvidé mi contraseña" en la pantalla de login.
        </p>
      </div>

      <MediosPagoSection mediosPago={mediosPago ?? []} />
    </div>
  );
}
