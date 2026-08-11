-- =====================================================================
-- Migración: agrega nacionalidad y estado civil a socios
-- Ejecutar en el SQL Editor de Supabase (proyecto ya tiene 02-schema.sql corrido)
-- =====================================================================

create type estado_civil_socio as enum ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'OTRO');

alter table public.socios
  add column nacionalidad text,
  add column estado_civil estado_civil_socio;
