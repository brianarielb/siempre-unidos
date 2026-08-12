import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege estas rutas; esta verificación es una
  // segunda barrera por si el layout se renderiza en otro contexto.
  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, email")
    .eq("id", user.id)
    .single();

  const nombreUsuario = perfil?.nombre || perfil?.email || user.email || "Usuario";

  return <AppShell nombreUsuario={nombreUsuario}>{children}</AppShell>;
}
