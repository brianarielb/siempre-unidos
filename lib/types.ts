// Tipos manuales alineados a 02-schema.sql.
// Si preferís tipos 100% generados, podés reemplazar este archivo por la
// salida de: npx supabase gen types typescript --project-id <id>

export type EstadoSocio = "ACTIVO" | "INACTIVO";
export type EstadoCivil = "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO" | "OTRO";
export type EstadoPago = "ACTIVO" | "ANULADO";
export type EstadoCuota = "PAGADO" | "PENDIENTE" | "ATRASADO";

export interface Socio {
  id: string;
  numero_socio: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string | null;
  nacionalidad: string | null;
  estado_civil: EstadoCivil | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fecha_alta: string;
  fecha_baja: string | null;
  estado: EstadoSocio;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface CuotaPeriodo {
  id: string;
  anio: number;
  trimestre: 1 | 2 | 3 | 4;
  fecha_desde: string;
  fecha_hasta: string;
  valor: number;
  observaciones: string | null;
  created_at: string;
}

export interface MedioPago {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Pago {
  id: string;
  socio_id: string;
  cuota_periodo_id: string;
  fecha_pago: string;
  importe: number;
  medio_pago_id: number;
  numero_comprobante: string | null;
  observaciones: string | null;
  usuario_id: string;
  estado: EstadoPago;
  pago_original_id: string | null;
  motivo_anulacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstadoCuentaRow {
  socio_id: string;
  numero_socio: number;
  nombre: string;
  apellido: string;
  estado_socio: EstadoSocio;
  periodo_id: string;
  anio: number;
  trimestre: number;
  valor_cuota: number;
  fecha_hasta: string;
  pago_id: string | null;
  fecha_pago: string | null;
  importe: number | null;
  estado_cuota: EstadoCuota;
}

// Placeholder mínimo para que @supabase/ssr tipe los clientes.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {}
