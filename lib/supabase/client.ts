import { createBrowserClient } from "@supabase/ssr";

// Sin genérico <Database>: usamos tipos manuales (lib/types.ts) en cada
// consulta en vez de generarlos automáticamente desde el esquema. Pasarle
// un tipo Database vacío acá haría que TypeScript trate cualquier insert/
// update como inválido (bloqueando el build de producción).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
