"use client";

import { exportarCSV } from "@/lib/utils";

export function ExportCsvButton({
  filas,
  nombreArchivo,
}: {
  filas: Record<string, string | number>[];
  nombreArchivo: string;
}) {
  return (
    <button
      className="btn-secondary"
      onClick={() => exportarCSV(nombreArchivo, filas)}
      disabled={filas.length === 0}
    >
      Exportar CSV
    </button>
  );
}
