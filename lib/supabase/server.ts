import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Crea un cliente de Supabase atado a las cookies de la request actual.
// Usar dentro de Server Components, Server Actions y Route Handlers.
// (Ver nota sobre el genérico <Database> en lib/supabase/client.ts)
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorado: se llama desde un Server Component. El middleware
            // se encarga de refrescar la sesión en esos casos.
          }
        },
      },
    }
  );
}
