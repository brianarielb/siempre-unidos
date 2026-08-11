"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { MedioPago } from "@/lib/types";

export function PagosFiltros({ mediosPago }: { mediosPago: MedioPago[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "desde", "hasta", "medio_pago_id", "incluir_anulados"]) {
      const valor = String(formData.get(key) ?? "");
      if (valor) params.set(key, valor);
    }
    router.push(`/pagos?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="field w-48">
        <label className="label" htmlFor="q">Socio</label>
        <input id="q" name="q" className="input" placeholder="Nombre, apellido o DNI" defaultValue={searchParams.get("q") ?? ""} />
      </div>
      <div className="field w-36">
        <label className="label" htmlFor="desde">Desde</label>
        <input id="desde" name="desde" type="date" className="input" defaultValue={searchParams.get("desde") ?? ""} />
      </div>
      <div className="field w-36">
        <label className="label" htmlFor="hasta">Hasta</label>
        <input id="hasta" name="hasta" type="date" className="input" defaultValue={searchParams.get("hasta") ?? ""} />
      </div>
      <div className="field w-44">
        <label className="label" htmlFor="medio_pago_id">Medio de pago</label>
        <select id="medio_pago_id" name="medio_pago_id" className="input" defaultValue={searchParams.get("medio_pago_id") ?? ""}>
          <option value="">Todos</option>
          {mediosPago.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-ink-600">
        <input
          type="checkbox"
          name="incluir_anulados"
          value="1"
          defaultChecked={searchParams.get("incluir_anulados") === "1"}
        />
        Incluir anulados
      </label>
      <button type="submit" className="btn-primary">Filtrar</button>
    </form>
  );
}
