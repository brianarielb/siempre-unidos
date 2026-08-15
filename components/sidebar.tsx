"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import type { RolUsuario } from "@/lib/types";
import { ETIQUETAS_ROL } from "@/lib/permisos";

const ITEMS: { href: string; label: string; roles: RolUsuario[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "OPERADOR", "LECTURA"] },
  { href: "/socios", label: "Socios", roles: ["ADMIN", "OPERADOR", "LECTURA"] },
  { href: "/pagos/registrar", label: "Registrar pago", roles: ["ADMIN", "OPERADOR"] },
  { href: "/pagos", label: "Pagos", roles: ["ADMIN", "OPERADOR", "LECTURA"] },
  { href: "/cuotas", label: "Cuotas / Períodos", roles: ["ADMIN", "OPERADOR", "LECTURA"] },
  { href: "/reportes", label: "Reportes", roles: ["ADMIN", "OPERADOR", "LECTURA"] },
  { href: "/configuracion", label: "Configuración", roles: ["ADMIN", "OPERADOR", "LECTURA"] },
];

export function Sidebar({
  nombreUsuario,
  rol,
  abierto,
  onNavegar,
}: {
  nombreUsuario: string;
  rol: RolUsuario;
  abierto: boolean;
  onNavegar: () => void;
}) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => item.roles.includes(rol));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out",
        "lg:static lg:translate-x-0",
        abierto ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          CJ
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink-900">Centro de Jubilados</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavegar}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activo
                  ? "bg-brand-light text-brand-dark"
                  : "text-ink-600 hover:bg-bg hover:text-ink-900"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <p className="truncate px-3 text-xs text-ink-400">{nombreUsuario}</p>
        <p className="mb-1 px-3 text-xs text-ink-400">{ETIQUETAS_ROL[rol]}</p>
        <LogoutButton />
      </div>
    </aside>
  );
}

