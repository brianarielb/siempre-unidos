"use client";

import { useTransition } from "react";
import { darDeBajaSocio, reactivarSocio } from "@/app/(app)/socios/actions";

export function SocioAcciones({ socioId, estado }: { socioId: string; estado: "ACTIVO" | "INACTIVO" }) {
  const [isPending, startTransition] = useTransition();

  function handleBaja() {
    if (!confirm("¿Confirmás dar de baja a este socio? Su historial de pagos se conserva.")) return;
    startTransition(() => darDeBajaSocio(socioId));
  }

  function handleReactivar() {
    if (!confirm("¿Confirmás reactivar a este socio?")) return;
    startTransition(() => reactivarSocio(socioId));
  }

  return estado === "ACTIVO" ? (
    <button className="btn-danger" onClick={handleBaja} disabled={isPending}>
      {isPending ? "Procesando..." : "Dar de baja"}
    </button>
  ) : (
    <button className="btn-secondary" onClick={handleReactivar} disabled={isPending}>
      {isPending ? "Procesando..." : "Reactivar socio"}
    </button>
  );
}
