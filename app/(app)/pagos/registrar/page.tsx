import { createClient } from "@/lib/supabase/server";
import { RegistrarPagoWizard } from "./registrar-pago-wizard";

export const dynamic = "force-dynamic";

export default async function RegistrarPagoPage() {
  const supabase = createClient();
  const { data: mediosPago } = await supabase
    .from("medios_pago")
    .select("*")
    .eq("activo", true)
    .order("id");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Registrar pago</h1>
        <p className="text-sm text-ink-600">
          Buscá al socio, elegí el trimestre y confirmá el pago. El importe se completa automáticamente
          según el valor vigente del período.
        </p>
      </div>
      <RegistrarPagoWizard mediosPago={mediosPago ?? []} />
    </div>
  );
}
