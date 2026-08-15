import type { RolUsuario } from "@/lib/types";

// Este archivo NO importa nada de "@/lib/supabase/server" a propósito:
// lo usan tanto Server Components como Client Components (ej: sidebar.tsx,
// usuarios-section.tsx). Si algo de acá dependiera de next/headers, Next
// intentaría meterlo en el bundle del navegador y el build fallaría.
//
// La función que sí necesita el servidor (obtenerRolActual) vive en
// "@/lib/rol-actual".

// La base de datos (RLS) es la que realmente impide estas acciones si el
// rol no corresponde; estos helpers son solo para adaptar la interfaz
// (ocultar botones que de todos modos el servidor rechazaría).
export function esAdmin(rol: RolUsuario) {
  return rol === "ADMIN";
}

export function puedeGestionarSocios(rol: RolUsuario) {
  return rol === "ADMIN" || rol === "OPERADOR";
}

export function puedeRegistrarPagos(rol: RolUsuario) {
  return rol === "ADMIN" || rol === "OPERADOR";
}

export function puedeAnularPagos(rol: RolUsuario) {
  return rol === "ADMIN";
}

export function puedeAprobarPagos(rol: RolUsuario) {
  return rol === "ADMIN";
}

export function puedeGestionarCuotas(rol: RolUsuario) {
  return rol === "ADMIN";
}

export const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador de caja",
  LECTURA: "Solo lectura",
};
