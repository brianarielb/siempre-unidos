"use client";

import { useTransition } from "react";
import { ETIQUETAS_ROL } from "@/lib/permisos";
import type { RolUsuario } from "@/lib/types";
import { cambiarRolUsuario } from "./actions";

interface UsuarioFila {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

const ROLES: RolUsuario[] = ["ADMIN", "OPERADOR", "LECTURA"];

export function UsuariosSection({ usuarios, miPropioId }: { usuarios: UsuarioFila[]; miPropioId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleCambiar(usuarioId: string, rol: string) {
    startTransition(() => cambiarRolUsuario(usuarioId, rol));
  }

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-600">Usuarios y roles</h2>
      <p className="mb-4 text-sm text-ink-600">
        Los usuarios se crean desde el panel de Supabase (Authentication → Users). Acá solo se asigna su rol
        dentro del sistema.
      </p>

      <div className="flex flex-col divide-y divide-border">
        {usuarios.map((u) => (
          <div key={u.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900">
                {u.nombre} {u.id === miPropioId && <span className="text-xs text-ink-400">(vos)</span>}
              </p>
              <p className="text-xs text-ink-600">{u.email}</p>
            </div>
            <select
              className="input w-full sm:w-48"
              defaultValue={u.rol}
              disabled={isPending || u.id === miPropioId}
              onChange={(e) => handleCambiar(u.id, e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ETIQUETAS_ROL[r]}</option>
              ))}
            </select>
          </div>
        ))}
        {usuarios.length === 0 && (
          <p className="py-4 text-sm text-ink-400">No hay otros usuarios cargados todavía.</p>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-400">
        Por seguridad, no podés cambiar tu propio rol desde acá — pedile a otro administrador que lo haga.
      </p>
    </div>
  );
}
