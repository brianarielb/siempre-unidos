"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("No pudimos enviar el email de recuperación.");
      return;
    }
    setMensaje("Si el email existe, te enviamos un enlace para restablecer la contraseña.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white">
            CJ
          </div>
          <h1 className="text-lg font-semibold text-ink-900">Centro de Jubilados</h1>
          <p className="text-sm text-ink-600">Gestión de socios y cuotas</p>
        </div>

        <div className="card p-6">
          {!modoRecuperar ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="field">
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-estado-atrasado">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
              <button
                type="button"
                className="text-sm text-brand hover:underline"
                onClick={() => {
                  setModoRecuperar(true);
                  setError(null);
                  setMensaje(null);
                }}
              >
                Olvidé mi contraseña
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecuperar} className="flex flex-col gap-4">
              <p className="text-sm text-ink-600">
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <div className="field">
                <label className="label" htmlFor="email-recuperar">Email</label>
                <input
                  id="email-recuperar"
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-estado-atrasado">{error}</p>}
              {mensaje && <p className="text-sm text-estado-pagado">{mensaje}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
              <button
                type="button"
                className="text-sm text-brand hover:underline"
                onClick={() => setModoRecuperar(false)}
              >
                Volver al login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

