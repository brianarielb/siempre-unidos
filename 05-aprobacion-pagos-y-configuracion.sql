-- =====================================================================
-- Migración: aprobación de pagos + configuración del sistema
-- Ejecutar en el SQL Editor de Supabase, sobre un proyecto que ya tiene
-- 02-schema.sql y 04-roles-y-permisos.sql corridos.
--
-- IMPORTANTE: ejecutar en DOS PASOS SEPARADOS (dos "Run" distintos).
-- Postgres no permite usar un valor nuevo de ENUM en la misma transacción
-- en la que se lo agrega. Copiá y corré primero el PASO 1 solo; cuando
-- termine, copiá y corré el PASO 2.
-- =====================================================================

-- ============================== PASO 1 ==============================
-- Ejecutar esto primero, solo, y esperar a que termine.

alter type estado_pago add value if not exists 'PENDIENTE_APROBACION';

-- ============================== PASO 2 ==============================
-- Recién después de que el PASO 1 haya terminado, ejecutar todo esto:

-- ---------- Columnas nuevas en pagos ----------
alter table public.pagos
  add column if not exists aprobado_por uuid references public.usuarios(id),
  add column if not exists aprobado_en timestamptz,
  add column if not exists grupo_pago_id uuid;

comment on column public.pagos.grupo_pago_id is
  'Agrupa varios pagos (uno por período) registrados en una misma operación '
  'cuando el socio paga varios trimestres juntos. Null en pagos individuales.';

-- ---------- El índice único ahora también protege los pendientes ----------
-- (antes solo evitaba dos pagos ACTIVO para el mismo período; ahora tampoco
-- permite un pago ACTIVO + uno PENDIENTE_APROBACION, ni dos PENDIENTE_APROBACION)
drop index if exists uq_pago_activo_por_periodo;

create unique index uq_pago_activo_por_periodo
  on public.pagos(socio_id, cuota_periodo_id)
  where estado in ('ACTIVO', 'PENDIENTE_APROBACION');

-- ---------- Trigger: el estado del pago lo decide la base, no el cliente ----------
-- ADMIN -> queda aprobado (ACTIVO) automáticamente, con su propio usuario
--          como aprobador.
-- OPERADOR -> queda PENDIENTE_APROBACION sin importar qué haya mandado el
--             formulario; solo un ADMIN puede aprobarlo después.
create or replace function public.fijar_estado_pago_segun_rol()
returns trigger as $$
begin
  if public.rol_actual() = 'ADMIN' then
    new.estado := 'ACTIVO';
    new.aprobado_por := auth.uid();
    new.aprobado_en := now();
  else
    new.estado := 'PENDIENTE_APROBACION';
    new.aprobado_por := null;
    new.aprobado_en := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_fijar_estado_pago on public.pagos;
create trigger trg_fijar_estado_pago
before insert on public.pagos
for each row execute function public.fijar_estado_pago_segun_rol();

-- Trigger de auditoría: sumar el caso "aprobación" (además de alta/anulación)
create or replace function public.audit_pagos()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.auditoria (usuario_id, tabla, registro_id, accion, detalle)
    values (new.usuario_id, 'pagos', new.id::text, 'ALTA_PAGO', to_jsonb(new));
  elsif tg_op = 'UPDATE' and old.estado = 'PENDIENTE_APROBACION' and new.estado = 'ACTIVO' then
    insert into public.auditoria (usuario_id, tabla, registro_id, accion, detalle)
    values (new.aprobado_por, 'pagos', new.id::text, 'APROBACION_PAGO', '{}'::jsonb);
  elsif tg_op = 'UPDATE' and old.estado <> 'ANULADO' and new.estado = 'ANULADO' then
    insert into public.auditoria (usuario_id, tabla, registro_id, accion, detalle)
    values (new.usuario_id, 'pagos', new.id::text, 'ANULACION_PAGO',
      jsonb_build_object('motivo', new.motivo_anulacion));
  end if;
  return new;
end;
$$ language plpgsql;

-- ---------- La vista de estado de cuenta ya excluye lo no-ACTIVO ----------
-- No hace falta tocar vista_estado_cuenta: el join ya filtra
-- "p.estado = 'ACTIVO'", así que un pago PENDIENTE_APROBACION sigue
-- mostrando el período como PENDIENTE/ATRASADO, no como PAGADO. Esto ya
-- resuelve el punto de "no contabilizar pendientes como aprobados".

-- ---------- Configuración del sistema (tabla nueva, genérica) ----------
create table if not exists public.configuracion_sistema (
  clave text primary key,
  valor text not null,
  actualizado_en timestamptz not null default now()
);

insert into public.configuracion_sistema (clave, valor)
values ('tamanio_pagina', '20')
on conflict (clave) do nothing;

alter table public.configuracion_sistema enable row level security;

drop policy if exists configuracion_select on public.configuracion_sistema;
create policy configuracion_select on public.configuracion_sistema
  for select using (auth.role() = 'authenticated');

drop policy if exists configuracion_update on public.configuracion_sistema;
create policy configuracion_update on public.configuracion_sistema
  for update using (public.rol_actual() = 'ADMIN');

create or replace function public.set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_configuracion_actualizado_en
before update on public.configuracion_sistema
for each row execute function public.set_actualizado_en();
