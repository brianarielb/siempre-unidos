import { createClient } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/types";

// Este archivo SÍ depende de next/headers (a través de lib/supabase/server)
// y por eso solo se puede importar desde Server Components, Server Actions
// o Route Handlers — nunca desde un archivo con "use client".
export async function obtenerRolActual(): Promise<RolUsuario> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "LECTURA";

  const { data } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
  return (data?.rol as RolUsuario) ?? "LECTURA";
}
