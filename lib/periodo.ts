// Determina año/trimestre calendario a partir de una fecha (por defecto, hoy).
// Trimestre 1: ene-mar, 2: abr-jun, 3: jul-sep, 4: oct-dic.
export function trimestreActual(fecha: Date = new Date()) {
  const anio = fecha.getFullYear();
  const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
  return { anio, trimestre };
}
