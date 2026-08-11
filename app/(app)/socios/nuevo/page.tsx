import { SocioForm } from "@/components/socio-form";
import { crearSocio } from "../actions";

export default function NuevoSocioPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Nuevo socio</h1>
        <p className="text-sm text-ink-600">Completá los datos del socio a dar de alta.</p>
      </div>
      <div className="card p-6">
        <SocioForm action={crearSocio} labelBoton="Crear socio" />
      </div>
    </div>
  );
}
