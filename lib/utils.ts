export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatearImporte(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return "-";
  return formatoMoneda.format(valor);
}

export function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return "-";
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

export function trimestreLabel(trimestre: number) {
  return `T${trimestre}`;
}

// Convierte un array de objetos planos a CSV y dispara la descarga en el navegador.
export function exportarCSV(nombreArchivo: string, filas: Record<string, string | number>[]) {
  if (filas.length === 0) return;
  const columnas = Object.keys(filas[0]);
  const escapar = (valor: string | number) => {
    const texto = String(valor ?? "");
    return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const lineas = [
    columnas.join(";"),
    ...filas.map((fila) => columnas.map((c) => escapar(fila[c])).join(";")),
  ];
  const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  link.click();
  URL.revokeObjectURL(url);
}
