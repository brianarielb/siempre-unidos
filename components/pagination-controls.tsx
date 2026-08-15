"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PaginationControls({
  total,
  tamanioPagina,
}: {
  total: number;
  tamanioPagina: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPaginas = Math.max(1, Math.ceil(total / tamanioPagina));
  const paginaActual = Math.min(Math.max(1, Number(searchParams.get("page") ?? "1")), totalPaginas);

  if (totalPaginas <= 1) return null;

  function irA(pagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pagina));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-ink-600">
      <button
        className="btn-secondary"
        disabled={paginaActual <= 1}
        onClick={() => irA(paginaActual - 1)}
      >
        ← Anterior
      </button>
      <span>
        {(paginaActual - 1) * tamanioPagina + 1}-{Math.min(paginaActual * tamanioPagina, total)} de {total}
      </span>
      <button
        className="btn-secondary"
        disabled={paginaActual >= totalPaginas}
        onClick={() => irA(paginaActual + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
}
