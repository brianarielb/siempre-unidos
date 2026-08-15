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

export async function cambiarRolUsuario(usuarioId: string, rol: string) {
  const supabase = createClient();
  const { error } = await supabase.from("usuarios").update({ rol }).eq("id", usuarioId);
  if (error) {
    // El trigger proteger_cambio_rol también rechaza esto en la base si el
    // que ejecuta la acción no es ADMIN; este mensaje cubre ese caso.
    throw new Error("No se pudo cambiar el rol. Solo un administrador puede hacerlo.");
  }
  revalidatePath("/configuracion");
}

export async function actualizarTamanioPagina(_prev: { error: string | null }, formData: FormData) {
  const valor = Number(formData.get("tamanio_pagina"));
  if (!Number.isFinite(valor) || valor < 5 || valor > 500) {
    return { error: "Ingresá un número entre 5 y 500." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("configuracion_sistema")
    .update({ valor: String(valor) })
    .eq("clave", "tamanio_pagina");

  if (error) return { error: "No se pudo guardar (solo un administrador puede cambiarlo)." };

  revalidatePath("/configuracion");
  revalidatePath("/socios");
  revalidatePath("/pagos");
  return { error: null };
}
