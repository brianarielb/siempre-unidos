"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/socios", label: "Socios" },
  { href: "/pagos/registrar", label: "Registrar pago" },
  { href: "/pagos", label: "Pagos" },
  { href: "/cuotas", label: "Cuotas / Períodos" },
  { href: "/reportes", label: "Reportes" },
  { href: "/configuracion", label: "Configuración" },
];

export function Sidebar({ nombreUsuario }: { nombreUsuario: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          CJ
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink-900">Centro de Jubilados</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {ITEMS.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <p className="truncate px-3 pb-1 text-xs text-ink-400">{nombreUsuario}</p>
        <LogoutButton />
      </div>
    </aside>
  );
}
