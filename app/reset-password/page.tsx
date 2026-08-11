"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("No pudimos actualizar la contraseña. Probá pedir un nuevo enlace.");
      return;
    }
    setOk(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-lg font-semibold text-ink-900">
          Establecer nueva contraseña
        </h1>
        <div className="card p-6">
          {ok ? (
            <p className="text-sm text-estado-pagado">
              Contraseña actualizada. Te estamos redirigiendo...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="field">
                <label className="label" htmlFor="password">Nueva contraseña</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="confirmacion">Confirmar contraseña</label>
                <input
                  id="confirmacion"
                  type="password"
                  required
                  className="input"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-estado-atrasado">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
