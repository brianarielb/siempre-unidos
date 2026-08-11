"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FiltrosReporteSocios() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "estado", "alta_desde", "alta_hasta"]) {
      const valor = String(formData.get(key) ?? "");
      if (valor) params.set(key, valor);
    }
    router.push(`/reportes/socios?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="field w-56">
        <label className="label" htmlFor="q">N° socio, DNI, nombre o apellido</label>
        <input id="q" name="q" className="input" defaultValue={searchParams.get("q") ?? ""} />
      </div>
      <div className="field w-40">
        <label className="label" htmlFor="estado">Estado</label>
        <select id="estado" name="estado" className="input" defaultValue={searchParams.get("estado") ?? ""}>
          <option value="">Todos</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>
      <div className="field w-36">
        <label className="label" htmlFor="alta_desde">Alta desde</label>
        <input id="alta_desde" name="alta_desde" type="date" className="input" defaultValue={searchParams.get("alta_desde") ?? ""} />
      </div>
      <div className="field w-36">
        <label className="label" htmlFor="alta_hasta">Alta hasta</label>
        <input id="alta_hasta" name="alta_hasta" type="date" className="input" defaultValue={searchParams.get("alta_hasta") ?? ""} />
      </div>
      <button type="submit" className="btn-primary">Filtrar</button>
    </form>
  );
}
