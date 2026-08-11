"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { trimestreActual } from "@/lib/periodo";

export function SelectorPeriodoPendientes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actual = trimestreActual();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    params.set("anio", String(formData.get("anio")));
    params.set("trimestre", String(formData.get("trimestre")));
    router.push(`/reportes/pendientes?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="field w-28">
        <label className="label" htmlFor="anio">Año</label>
        <input
          id="anio"
          name="anio"
          type="number"
          required
          className="input"
          defaultValue={searchParams.get("anio") ?? actual.anio}
        />
      </div>
      <div className="field w-28">
        <label className="label" htmlFor="trimestre">Trimestre</label>
        <select
          id="trimestre"
          name="trimestre"
          required
          className="input"
          defaultValue={searchParams.get("trimestre") ?? String(actual.trimestre)}
        >
          <option value="1">T1</option>
          <option value="2">T2</option>
          <option value="3">T3</option>
          <option value="4">T4</option>
        </select>
      </div>
      <button type="submit" className="btn-primary">Consultar</button>
    </form>
  );
}
