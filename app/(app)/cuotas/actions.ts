"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PeriodoFormState = { error: string | null; ok?: boolean };

export async function crearPeriodo(_prevState: PeriodoFormState, formData: FormData): Promise<PeriodoFormState> {
  const anio = Number(formData.get("anio"));
  const trimestre = Number(formData.get("trimestre"));
  const fecha_desde = String(formData.get("fecha_desde"));
  const fecha_hasta = String(formData.get("fecha_hasta"));
  const valor = Number(formData.get("valor"));
  const observaciones = (formData.get("observaciones") as string) || null;

  if (!anio || !trimestre || !fecha_desde || !fecha_hasta || !valor) {
    return { error: "Completá todos los campos obligatorios." };
  }
  if (fecha_hasta <= fecha_desde) {
    return { error: "La fecha hasta debe ser posterior a la fecha desde." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("cuotas_periodos")
    .insert({ anio, trimestre, fecha_desde, fecha_hasta, valor, observaciones });

  if (error) {
    if (error.code === "23505") {
      return { error: `Ya existe un período cargado para ${anio} - T${trimestre}.` };
    }
    return { error: "No se pudo crear el período." };
  }

  revalidatePath("/cuotas");
  return { error: null, ok: true };
}

export async function actualizarValorPeriodo(
  _prevState: PeriodoFormState,
  formData: FormData
): Promise<PeriodoFormState> {
  const id = String(formData.get("id"));
  const valor = Number(formData.get("valor"));

  if (!valor || valor <= 0) {
    return { error: "Ingresá un valor válido." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("cuotas_periodos").update({ valor }).eq("id", id);

  if (error) {
    return {
      error:
        "No se pudo actualizar: este período ya tiene pagos registrados y su valor histórico no puede modificarse.",
    };
  }

  revalidatePath("/cuotas");
  return { error: null, ok: true };
}
