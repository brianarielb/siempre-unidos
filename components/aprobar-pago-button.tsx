"use client";

import { useTransition } from "react";
import { aprobarPago } from "@/app/(app)/pagos/actions";

export function AprobarPagoButton({ pagoId }: { pagoId: string }) {
  const [isPending, startTransition] = useTransition();
  function handleClick() {
    if (!confirm("¿Confirmás aprobar este pago?")) return;
    startTransition(() => aprobarPago(pagoId));
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm font-medium text-estado-pagado hover:underline disabled:opacity-50"
    >
      {isPending ? "Aprobando..." : "Aprobar"}
    </button>
  );
}
