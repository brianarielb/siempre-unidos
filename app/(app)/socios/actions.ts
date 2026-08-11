"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SocioFormState = { error: string | null };

function datosDelForm(formData: FormData) {
  return {
    numero_socio: Number(formData.get("numero_socio")),
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    dni: String(formData.get("dni") ?? "").trim(),
    fecha_nacimiento: (formData.get("fecha_nacimiento") as string) || null,
    nacionalidad: (formData.get("nacionalidad") as string) || null,
    estado_civil: (formData.get("estado_civil") as string) || null,
    telefono: (formData.get("telefono") as string) || null,
    email: (formData.get("email") as string) || null,
    direccion: (formData.get("direccion") as string) || null,
    fecha_alta: (formData.get("fecha_alta") as string) || new Date().toISOString().slice(0, 10),
    observaciones: (formData.get("observaciones") as string) || null,
  };
}

export async function crearSocio(_prevState: SocioFormState, formData: FormData): Promise<SocioFormState> {
  const datos = datosDelForm(formData);

  if (!datos.numero_socio || !datos.nombre || !datos.apellido || !datos.dni) {
    return { error: "Número de socio, nombre, apellido y DNI son obligatorios." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.from("socios").insert(datos).select("id").single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un socio con ese número de socio o DNI." };
    }
    return { error: "No se pudo crear el socio. Intentá nuevamente." };
  }

  revalidatePath("/socios");
  redirect(`/socios/${data.id}`);
}

export async function actualizarSocio(
  socioId: string,
  _prevState: SocioFormState,
  formData: FormData
): Promise<SocioFormState> {
  const datos = datosDelForm(formData);

  if (!datos.numero_socio || !datos.nombre || !datos.apellido || !datos.dni) {
    return { error: "Número de socio, nombre, apellido y DNI son obligatorios." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("socios").update(datos).eq("id", socioId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un socio con ese número de socio o DNI." };
    }
    return { error: "No se pudo guardar los cambios. Intentá nuevamente." };
  }

  revalidatePath("/socios");
  revalidatePath(`/socios/${socioId}`);
  return { error: null };
}

export async function darDeBajaSocio(socioId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("socios")
    .update({ estado: "INACTIVO", fecha_baja: new Date().toISOString().slice(0, 10) })
    .eq("id", socioId);

  if (error) throw new Error("No se pudo dar de baja al socio.");

  revalidatePath("/socios");
  revalidatePath(`/socios/${socioId}`);
}

export async function reactivarSocio(socioId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("socios")
    .update({ estado: "ACTIVO", fecha_baja: null })
    .eq("id", socioId);

  if (error) throw new Error("No se pudo reactivar al socio.");

  revalidatePath("/socios");
  revalidatePath(`/socios/${socioId}`);
}
