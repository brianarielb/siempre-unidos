"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SociosFiltros() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const q = String(formData.get("q") ?? "").trim();
    const estado = String(formData.get("estado") ?? "");
    if (q) params.set("q", q);
    if (estado) params.set("estado", estado);
    router.push(`/socios?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="field w-64">
        <label className="label" htmlFor="q">Buscar</label>
        <input
          id="q"
          name="q"
          className="input"
          placeholder="Número, DNI, nombre o apellido"
          defaultValue={searchParams.get("q") ?? ""}
        />
      </div>
      <div className="field w-44">
        <label className="label" htmlFor="estado">Estado</label>
        <select id="estado" name="estado" className="input" defaultValue={searchParams.get("estado") ?? ""}>
          <option value="">Todos</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>
      <button type="submit" className="btn-primary">Buscar</button>
    </form>
  );
}
