"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import type { RolUsuario } from "@/lib/types";

export function AppShell({
  nombreUsuario,
  rol,
  children,
}: {
  nombreUsuario: string;
  rol: RolUsuario;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  // Cierra el menú automáticamente al navegar a otra página (mobile)
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar nombreUsuario={nombreUsuario} rol={rol} abierto={abierto} onNavegar={() => setAbierto(false)} />

      {/* Fondo oscuro detrás del menú cuando está abierto en mobile */}
      {abierto && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setAbierto(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior: solo visible en mobile/tablet */}
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <button
            aria-label="Abrir menú"
            onClick={() => setAbierto(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink-900"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
            CJ
          </div>
          <p className="text-sm font-semibold text-ink-900">Centro de Jubilados</p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
