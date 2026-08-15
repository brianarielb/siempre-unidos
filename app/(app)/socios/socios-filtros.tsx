"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Búsqueda incremental: cada cambio actualiza la URL (y por lo tanto los
// resultados) automáticamente, sin depender de un botón "Buscar". El texto
// libre lleva un pequeño debounce para no disparar una consulta por cada
// tecla; el select de estado se aplica al instante, como en "Registrar pago".
export function SociosFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [texto, setTexto] = useState(searchParams.get("q") ?? "");

  function actualizarParams(next: { q?: string; estado?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // toda búsqueda nueva vuelve a la página 1

    const q = next.q ?? searchParams.get("q") ?? "";
    const estado = next.estado ?? searchParams.get("estado") ?? "";

    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");

    if (estado) params.set("estado", estado);
    else params.delete("estado");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Debounce del texto: espera 400ms de inactividad antes de buscar
  useEffect(() => {
    const actual = searchParams.get("q") ?? "";
    if (texto === actual) return;
    const id = setTimeout(() => actualizarParams({ q: texto }), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="field w-64">
        <label className="label" htmlFor="q">Buscar</label>
        <input
          id="q"
          className="input"
          placeholder="Número, DNI, nombre o apellido"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>
      <div className="field w-44">
        <label className="label" htmlFor="estado">Estado</label>
        <select
          id="estado"
          className="input"
          defaultValue={searchParams.get("estado") ?? ""}
          onChange={(e) => actualizarParams({ estado: e.target.value })}
        >
          <option value="">Todos</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>
    </div>
  );
}