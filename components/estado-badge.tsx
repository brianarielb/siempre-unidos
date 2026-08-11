import { cn } from "@/lib/utils";

const ESTILOS: Record<string, string> = {
  PAGADO: "text-estado-pagado bg-estado-pagadoBg",
  ACTIVO: "text-estado-pagado bg-estado-pagadoBg",
  PENDIENTE: "text-estado-pendiente bg-estado-pendienteBg",
  ATRASADO: "text-estado-atrasado bg-estado-atrasadoBg",
  ANULADO: "text-estado-anulado bg-estado-anuladoBg",
  INACTIVO: "text-estado-anulado bg-estado-anuladoBg",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ESTILOS[estado] ?? "text-ink-600 bg-bg"
      )}
    >
      {estado}
    </span>
  );
}
