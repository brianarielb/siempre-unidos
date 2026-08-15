"use server";

import { randomUUID } from "crypto";
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
  const [{ data }, { data: yaCubiertos }] = await Promise.all([
    supabase
      .from("vista_estado_cuenta")
      .select("*")
      .eq("socio_id", socioId)
      .in("estado_cuota", ["PENDIENTE", "ATRASADO"])
      .order("anio", { ascending: true })
      .order("trimestre", { ascending: true }),
    // Períodos que ya tienen un pago pendiente de aprobación (la vista los
    // sigue mostrando como "pendiente" porque todavía no están aprobados,
    // pero no tiene sentido ofrecerlos de nuevo acá).
    supabase.from("pagos").select("cuota_periodo_id").eq("socio_id", socioId).eq("estado", "PENDIENTE_APROBACION"),
  ]);

  const idsCubiertos = new Set((yaCubiertos ?? []).map((p) => p.cuota_periodo_id));
  return (data ?? []).filter((p) => !idsCubiertos.has(p.periodo_id));
}

export type RegistrarPagoState = { error: string | null; ok?: boolean; pendienteAprobacion?: boolean };

interface PeriodoAPagar {
  cuota_periodo_id: string;
  importe: number;
}

// Registra uno o varios períodos como una sola operación (el socio puede
// pagar, por ejemplo, 3 trimestres juntos). El campo "periodos" viaja en el
// formulario como JSON: [{ cuota_periodo_id, importe }, ...].
//
// El estado de cada pago (aprobado o pendiente de aprobación) NO se decide
// acá: lo fija el trigger fijar_estado_pago_segun_rol() en la base de datos
// según el rol de quien está logueado, para que no se pueda evitar la
// aprobación armando el request a mano.
export async function registrarPago(_prev: RegistrarPagoState, formData: FormData): Promise<RegistrarPagoState> {
  const socio_id = String(formData.get("socio_id"));
  const fecha_pago = String(formData.get("fecha_pago"));
  const medio_pago_id = Number(formData.get("medio_pago_id"));
  const numero_comprobante = (formData.get("numero_comprobante") as string) || null;
  const observaciones = (formData.get("observaciones") as string) || null;

  let periodos: PeriodoAPagar[] = [];
  try {
    periodos = JSON.parse(String(formData.get("periodos") ?? "[]"));
  } catch {
    return { error: "No se pudieron leer los períodos seleccionados." };
  }

  if (!socio_id || !fecha_pago || !medio_pago_id || periodos.length === 0) {
    return { error: "Completá todos los campos obligatorios y elegí al menos un período." };
  }
  if (periodos.some((p) => !p.cuota_periodo_id || !p.importe || p.importe <= 0)) {
    return { error: "Todos los períodos seleccionados necesitan un importe válido." };
  }

  const idsUnicos = new Set(periodos.map((p) => p.cuota_periodo_id));
  if (idsUnicos.size !== periodos.length) {
    return { error: "No se puede pagar el mismo período dos veces en la misma operación." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Iniciá sesión nuevamente." };

  const grupo_pago_id = periodos.length > 1 ? randomUUID() : null;

  const filas = periodos.map((p) => ({
    socio_id,
    cuota_periodo_id: p.cuota_periodo_id,
    fecha_pago,
    importe: p.importe,
    medio_pago_id,
    numero_comprobante,
    observaciones,
    usuario_id: user.id,
    grupo_pago_id,
  }));

  // Un solo INSERT con varias filas: es atómico (si un período ya tiene
  // pago, el índice único lo rechaza y NINGUNO de los períodos se registra,
  // en vez de dejar la operación a medio hacer).
  const { data: insertados, error } = await supabase.from("pagos").insert(filas).select("estado");

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          periodos.length > 1
            ? "Uno o más de los períodos seleccionados ya tiene un pago activo o pendiente. Revisá la selección."
            : "Este socio ya tiene un pago activo o pendiente de aprobación para ese trimestre.",
      };
    }
    return { error: "No se pudo registrar el pago. Intentá nuevamente." };
  }

  revalidatePath("/pagos");
  revalidatePath(`/socios/${socio_id}`);
  revalidatePath("/dashboard");

  const pendienteAprobacion = (insertados ?? []).some((p) => p.estado === "PENDIENTE_APROBACION");
  return { error: null, ok: true, pendienteAprobacion };
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

export async function aprobarPago(pagoId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tu sesión expiró. Iniciá sesión nuevamente.");

  // El UPDATE en sí (incluido qué rol puede tocar el estado de un pago) ya
  // está restringido por RLS a ADMIN; acá solo completamos quién y cuándo
  // aprobó. El trigger de auditoría registra automáticamente la aprobación.
  const { error, data } = await supabase
    .from("pagos")
    .update({ estado: "ACTIVO", aprobado_por: user.id, aprobado_en: new Date().toISOString() })
    .eq("id", pagoId)
    .eq("estado", "PENDIENTE_APROBACION")
    .select("id");

  if (error) throw new Error("No se pudo aprobar el pago.");
  if (!data || data.length === 0) {
    throw new Error("El pago ya no está pendiente de aprobación (puede que ya lo hayan aprobado o anulado).");
  }

  revalidatePath("/pagos");
  revalidatePath("/dashboard");
}
