"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function agregarMedioPago(_prev: { error: string | null }, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim().toUpperCase();
  if (!nombre) return { error: "Ingresá un nombre." };

  const supabase = createClient();
  const { error } = await supabase.from("medios_pago").insert({ nombre });

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un medio de pago con ese nombre." };
    return { error: "No se pudo agregar el medio de pago." };
  }

  revalidatePath("/configuracion");
  return { error: null };
}

export async function alternarMedioPago(id: number, activo: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("medios_pago").update({ activo }).eq("id", id);
  if (error) throw new Error("No se pudo actualizar el medio de pago.");
  revalidatePath("/configuracion");
}
