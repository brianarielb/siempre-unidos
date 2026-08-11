"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function buscarSociosParaPago(texto: string) {
  if (!texto || texto.trim().length < 2) return [];
  const supabase = createClient();
  const q = texto.trim();
  const esNumero = /^\d+$/.test(q);

  let query = supabase
    .from("socios")
    .select("id, numero_socio, nombre, apellido, dni, estado")
    .eq("estado", "ACTIVO")
    .limit(10);

  query = esNumero
    ? query.or(`numero_socio.eq.${q},dni.ilike.%${q}%`)
    : query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`);

  const { data } = await query;
  return data ?? [];
}

export async function obtenerPeriodosPendientes(socioId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("vista_estado_cuenta")
    .select("*")
    .eq("socio_id", socioId)
    .in("estado_cuota", ["PENDIENTE", "ATRASADO"])
    .order("anio", { ascending: true })
    .order("trimestre", { ascending: true });
  return data ?? [];
}

export type RegistrarPagoState = { error: string | null; ok?: boolean };

export async function registrarPago(_prev: RegistrarPagoState, formData: FormData): Promise<RegistrarPagoState> {
  const socio_id = String(formData.get("socio_id"));
  const cuota_periodo_id = String(formData.get("cuota_periodo_id"));
  const fecha_pago = String(formData.get("fecha_pago"));
  const importe = Number(formData.get("importe"));
  const medio_pago_id = Number(formData.get("medio_pago_id"));
  const numero_comprobante = (formData.get("numero_comprobante") as string) || null;
  const observaciones = (formData.get("observaciones") as string) || null;

  if (!socio_id || !cuota_periodo_id || !fecha_pago || !importe || !medio_pago_id) {
    return { error: "Completá todos los campos obligatorios." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Iniciá sesión nuevamente." };

  const { error } = await supabase.from("pagos").insert({
    socio_id,
    cuota_periodo_id,
    fecha_pago,
    importe,
    medio_pago_id,
    numero_comprobante,
    observaciones,
    usuario_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Este socio ya tiene un pago activo registrado para ese trimestre." };
    }
    return { error: "No se pudo registrar el pago. Intentá nuevamente." };
  }

  revalidatePath("/pagos");
  revalidatePath(`/socios/${socio_id}`);
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function anularPago(pagoId: string, motivo: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pagos")
    .update({ estado: "ANULADO", motivo_anulacion: motivo })
    .eq("id", pagoId);

  if (error) throw new Error("No se pudo anular el pago.");

  revalidatePath("/pagos");
  revalidatePath("/dashboard");
}
