import { createClient } from "@/lib/supabase/server";

const TAMANIO_PAGINA_POR_DEFECTO = 20;

// Server-only (usa lib/supabase/server, con next/headers) — no importar
// desde un componente cliente.
export async function obtenerTamanioPagina(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("configuracion_sistema")
    .select("valor")
    .eq("clave", "tamanio_pagina")
    .maybeSingle();

  const valor = Number(data?.valor);
  return Number.isFinite(valor) && valor > 0 ? valor : TAMANIO_PAGINA_POR_DEFECTO;
}
