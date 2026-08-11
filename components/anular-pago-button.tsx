"use client";

import { useTransition } from "react";
import { anularPago } from "@/app/(app)/pagos/actions";

export function AnularPagoButton({ pagoId }: { pagoId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const motivo = prompt("Motivo de la anulación (obligatorio):");
    if (!motivo || !motivo.trim()) return;
    if (!confirm("¿Confirmás anular este pago? El trimestre volverá a figurar como pendiente.")) return;
    startTransition(() => anularPago(pagoId, motivo.trim()));
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm font-medium text-estado-atrasado hover:underline disabled:opacity-50"
    >
      {isPending ? "Anulando..." : "Anular"}
    </button>
  );
}
